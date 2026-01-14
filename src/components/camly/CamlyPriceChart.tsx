import { useState, useMemo, useCallback } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatNumber } from "@/lib/formatNumber";
import { useCamlyPrice } from "@/hooks/useCamlyPrice";
import { Loader2, TrendingUp, TrendingDown, LineChart, CandlestickChart } from "lucide-react";

type TimeRange = '5m' | '15m' | '1H' | '4H' | '1D' | '1W' | '1M';
type ChartType = 'line' | 'candle';
type IndicatorType = 'vol' | 'ma' | 'boll' | 'macd' | 'rsi';

interface CamlyPriceChartProps {
  className?: string;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isUp: boolean;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  bollUpper?: number;
  bollMid?: number;
  bollLower?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
}

// Time range configurations - Expanded like Bitget
const TIME_RANGE_CONFIG = {
  '5m': { points: 60, interval: 300000, label: '5 phút' },
  '15m': { points: 60, interval: 900000, label: '15 phút' },
  '1H': { points: 48, interval: 3600000, label: '1 giờ' },
  '4H': { points: 42, interval: 14400000, label: '4 giờ' },
  '1D': { points: 30, interval: 86400000, label: '1 ngày' },
  '1W': { points: 52, interval: 604800000, label: '1 tuần' },
  '1M': { points: 30, interval: 2592000000, label: '1 tháng' },
};

// Generate seeded random number
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate candlestick data
function generateCandlestickData(
  currentPrice: number,
  change24h: number,
  timeRange: TimeRange,
  seed: number
): CandleData[] {
  const config = TIME_RANGE_CONFIG[timeRange];
  const now = Date.now();
  
  const changeMultiplier = 
    timeRange === '5m' ? 0.2 : 
    timeRange === '15m' ? 0.5 : 
    timeRange === '1H' ? 1 : 
    timeRange === '4H' ? 1.5 : 
    timeRange === '1D' ? 2 : 
    timeRange === '1W' ? 5 : 10;
  const estimatedChange = change24h * changeMultiplier;
  const startPrice = currentPrice / (1 + estimatedChange / 100);
  
  const data: CandleData[] = [];
  let prevClose = startPrice;
  
  for (let i = 0; i < config.points; i++) {
    const progress = i / (config.points - 1);
    const trendPrice = startPrice + (currentPrice - startPrice) * progress;
    
    const rand1 = seededRandom(seed + i * 7);
    const rand2 = seededRandom(seed + i * 13);
    const rand3 = seededRandom(seed + i * 19);
    const rand4 = seededRandom(seed + i * 23);
    
    const volatility = trendPrice * 0.03;
    const change = (rand1 - 0.5) * volatility * 2;
    
    const open = prevClose;
    const close = i === config.points - 1 ? currentPrice : trendPrice + change;
    const isUp = close >= open;
    
    const wickRange = volatility * (0.3 + rand2 * 0.7);
    const high = Math.max(open, close) + wickRange * rand3;
    const low = Math.min(open, close) - wickRange * rand4;
    
    const baseVolume = 50000 + rand1 * 200000;
    const volume = baseVolume * (0.5 + Math.abs(change) / volatility);
    
    data.push({
      time: now - (config.points - 1 - i) * config.interval,
      open,
      high,
      low,
      close,
      volume,
      isUp,
    });
    
    prevClose = close;
  }
  
  return calculateIndicators(data);
}

// Calculate technical indicators
function calculateIndicators(data: CandleData[]): CandleData[] {
  const closes = data.map(d => d.close);
  
  // Calculate MAs
  const ma5 = calculateMA(closes, 5);
  const ma10 = calculateMA(closes, 10);
  const ma20 = calculateMA(closes, 20);
  
  // Calculate Bollinger Bands
  const bollinger = calculateBollinger(closes, 20, 2);
  
  // Calculate RSI
  const rsi = calculateRSI(closes, 14);
  
  // Calculate MACD
  const macd = calculateMACD(closes);
  
  return data.map((d, i) => ({
    ...d,
    ma5: ma5[i],
    ma10: ma10[i],
    ma20: ma20[i],
    bollUpper: bollinger.upper[i],
    bollMid: bollinger.mid[i],
    bollLower: bollinger.lower[i],
    rsi: rsi[i],
    macd: macd.macd[i],
    macdSignal: macd.signal[i],
    macdHist: macd.histogram[i],
  }));
}

function calculateMA(data: number[], period: number): (number | undefined)[] {
  return data.map((_, i) => {
    if (i < period - 1) return undefined;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

function calculateBollinger(data: number[], period: number, stdDev: number) {
  const mid = calculateMA(data, period);
  const upper: (number | undefined)[] = [];
  const lower: (number | undefined)[] = [];
  
  data.forEach((_, i) => {
    if (i < period - 1 || mid[i] === undefined) {
      upper.push(undefined);
      lower.push(undefined);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = mid[i]!;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      upper.push(mean + std * stdDev);
      lower.push(mean - std * stdDev);
    }
  });
  
  return { upper, mid, lower };
}

function calculateRSI(data: number[], period: number): (number | undefined)[] {
  const rsi: (number | undefined)[] = [];
  let gains = 0;
  let losses = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      rsi.push(undefined);
      continue;
    }
    
    const change = data[i] - data[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    
    if (i < period) {
      gains += gain;
      losses += loss;
      rsi.push(undefined);
    } else if (i === period) {
      gains += gain;
      losses += loss;
      const avgGain = gains / period;
      const avgLoss = losses / period;
      rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
    } else {
      const avgGain = (gains * (period - 1) + gain) / period;
      const avgLoss = (losses * (period - 1) + loss) / period;
      gains = avgGain * period;
      losses = avgLoss * period;
      rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
    }
  }
  
  return rsi;
}

function calculateMACD(data: number[]) {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macd: (number | undefined)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (ema12[i] === undefined || ema26[i] === undefined) {
      macd.push(undefined);
    } else {
      macd.push(ema12[i]! - ema26[i]!);
    }
  }
  
  const signal = calculateEMA(macd.filter(v => v !== undefined) as number[], 9);
  const fullSignal: (number | undefined)[] = [];
  let signalIdx = 0;
  
  for (let i = 0; i < macd.length; i++) {
    if (macd[i] === undefined) {
      fullSignal.push(undefined);
    } else {
      fullSignal.push(signal[signalIdx] ?? undefined);
      signalIdx++;
    }
  }
  
  const histogram = macd.map((m, i) => {
    if (m === undefined || fullSignal[i] === undefined) return undefined;
    return m - fullSignal[i]!;
  });
  
  return { macd, signal: fullSignal, histogram };
}

function calculateEMA(data: number[], period: number): (number | undefined)[] {
  const ema: (number | undefined)[] = [];
  const multiplier = 2 / (period + 1);
  let prevEma: number | undefined;
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(undefined);
    } else if (i === period - 1) {
      const sum = data.slice(0, period).reduce((a, b) => a + b, 0);
      prevEma = sum / period;
      ema.push(prevEma);
    } else {
      prevEma = (data[i] - prevEma!) * multiplier + prevEma!;
      ema.push(prevEma);
    }
  }
  
  return ema;
}

// Custom Candlestick Shape - Wider and more visible like Bitget
function CandlestickShape({ x, y, width, height, payload }: any) {
  if (!payload) return null;
  
  const { open, high, low, close, isUp } = payload;
  const upColor = '#22c55e';
  const downColor = '#ef4444';
  const color = isUp ? upColor : downColor;
  const borderColor = isUp ? '#16a34a' : '#dc2626';
  
  const priceRange = Math.abs(high - low);
  if (priceRange === 0) return null;
  
  // Wider candles like Bitget (85% of width)
  const candleWidth = Math.max(width * 0.85, 6);
  const wickWidth = Math.max(2, width * 0.2);
  
  const scale = height / priceRange;
  const yHigh = y;
  const yLow = y + height;
  const yOpen = yHigh + (high - open) * scale;
  const yClose = yHigh + (high - close) * scale;
  
  const bodyTop = Math.min(yOpen, yClose);
  const bodyHeight = Math.max(Math.abs(yOpen - yClose), 2);
  
  return (
    <g>
      {/* Wick - Thicker */}
      <line
        x1={x + width / 2}
        y1={yHigh}
        x2={x + width / 2}
        y2={yLow}
        stroke={color}
        strokeWidth={wickWidth}
        strokeLinecap="round"
      />
      {/* Body - Rounded corners */}
      <rect
        x={x + (width - candleWidth) / 2}
        y={bodyTop}
        width={candleWidth}
        height={bodyHeight}
        fill={color}
        stroke={borderColor}
        strokeWidth={1}
        rx={2}
        ry={2}
      />
    </g>
  );
}

// Custom Tooltip
function CandleTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload as CandleData;
  if (!data) return null;
  
  const changePercent = data.open > 0 ? ((data.close - data.open) / data.open * 100) : 0;
  
  return (
    <div className="bg-popover/98 backdrop-blur border-2 border-primary/40 rounded-xl p-3 shadow-2xl min-w-[200px]">
      {/* Time */}
      <div className="text-xs font-medium text-primary border-b border-border pb-2 mb-2">
        📅 {format(new Date(data.time), 'HH:mm dd/MM/yyyy')}
      </div>
      
      {/* OHLC */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
        <div className="text-muted-foreground">O: <span className="text-foreground">${data.open.toFixed(8)}</span></div>
        <div className="text-[#22c55e]">H: ${data.high.toFixed(8)}</div>
        <div className="text-[#ef4444]">L: ${data.low.toFixed(8)}</div>
        <div className={data.isUp ? "text-[#22c55e]" : "text-[#ef4444]"}>
          C: ${data.close.toFixed(8)}
        </div>
      </div>
      
      {/* Volume & Signal */}
      <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          Vol: {formatNumber(data.volume, { compact: true, maxDecimals: 0 })}
        </span>
        <span className={cn(
          "px-2 py-0.5 rounded text-xs font-bold",
          data.isUp ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#ef4444]/20 text-[#ef4444]"
        )}>
          {data.isUp ? '▲ TĂNG' : '▼ GIẢM'} {Math.abs(changePercent).toFixed(2)}%
        </span>
      </div>
      
      {/* Indicators */}
      {data.rsi !== undefined && (
        <div className="mt-1 pt-1 border-t border-border/50 text-[10px] text-muted-foreground">
          RSI: {data.rsi.toFixed(1)} | MA5: ${data.ma5?.toFixed(8) ?? '-'}
        </div>
      )}
    </div>
  );
}

// Format Y-axis price
function formatYAxisPrice(value: number): string {
  if (value < 0.0001) return value.toFixed(8);
  if (value < 0.01) return value.toFixed(6);
  if (value < 1) return value.toFixed(4);
  return value.toFixed(2);
}

export function CamlyPriceChart({ className }: CamlyPriceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');
  const [chartType, setChartType] = useState<ChartType>('candle');
  const [activeIndicators, setActiveIndicators] = useState<IndicatorType[]>(['vol', 'ma']);
  
  const { data: priceData, isLoading } = useCamlyPrice();

  const currentPrice = priceData?.price_usd ?? 0.00002187;
  const change24h = priceData?.change_24h ?? 0;
  
  const seed = useMemo(() => {
    return timeRange.charCodeAt(0) + (priceData?.last_updated ? new Date(priceData.last_updated).getHours() : 0);
  }, [timeRange, priceData?.last_updated]);

  const chartData = useMemo(() => {
    return generateCandlestickData(currentPrice, change24h, timeRange, seed);
  }, [currentPrice, change24h, timeRange, seed]);

  const toggleIndicator = useCallback((ind: IndicatorType) => {
    setActiveIndicators(prev => 
      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
    );
  }, []);

  const isPositive = chartData.length >= 2 && 
    chartData[chartData.length - 1].close >= chartData[0].open;
  
  const priceChange = chartData.length >= 2 
    ? ((chartData[chartData.length - 1].close - chartData[0].open) / chartData[0].open * 100)
    : 0;

  const formatXAxis = (value: number) => {
    if (['5m', '15m', '1H', '4H'].includes(timeRange)) return format(new Date(value), 'HH:mm');
    return format(new Date(value), 'dd/MM');
  };

  const [yMin, yMax] = useMemo(() => {
    const lows = chartData.map(d => d.low);
    const highs = chartData.map(d => d.high);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }, [chartData]);

  const strokeColor = isPositive ? '#22c55e' : '#ef4444';

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="h-80 w-full flex items-center justify-center bg-muted/20 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const indicators = [
    { id: 'vol' as IndicatorType, label: 'Vol', color: '#C9A227' },
    { id: 'ma' as IndicatorType, label: 'MA', color: '#3b82f6' },
    { id: 'boll' as IndicatorType, label: 'BOLL', color: '#a855f7' },
    { id: 'macd' as IndicatorType, label: 'MACD', color: '#f97316' },
    { id: 'rsi' as IndicatorType, label: 'RSI', color: '#ec4899' },
  ];

  const timeRanges: TimeRange[] = ['5m', '15m', '1H', '4H', '1D', '1W', '1M'];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Chart Type Toggle */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          <Button
            variant={chartType === 'line' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setChartType('line')}
            className="gap-1.5 h-8 text-xs"
          >
            <LineChart className="w-3.5 h-3.5" />
            Line
          </Button>
          <Button
            variant={chartType === 'candle' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setChartType('candle')}
            className="gap-1.5 h-8 text-xs"
          >
            <CandlestickChart className="w-3.5 h-3.5" />
            Nến
          </Button>
        </div>

        {/* Time Range - Expanded like Bitget */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {timeRanges.map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={cn(
                "h-8 text-xs px-2.5 shrink-0",
                timeRange === range && "bg-primary text-primary-foreground"
              )}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Indicator Toggles */}
      <div className="flex flex-wrap gap-1.5">
        {indicators.map((ind) => (
          <Button
            key={ind.id}
            variant={activeIndicators.includes(ind.id) ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleIndicator(ind.id)}
            className="h-6 text-[10px] px-2"
            style={{
              backgroundColor: activeIndicators.includes(ind.id) ? ind.color : undefined,
              borderColor: ind.color,
              color: activeIndicators.includes(ind.id) ? 'white' : ind.color,
            }}
          >
            {ind.label}
          </Button>
        ))}
      </div>

      {/* Main Chart - Taller (h-64) */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 80, left: 5, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradientUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="priceGradientDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
            
            <XAxis
              dataKey="time"
              tickFormatter={formatXAxis}
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            
            {/* Y-Axis with price on right side like Bitget */}
            <YAxis 
              domain={[yMin, yMax]}
              orientation="right"
              tickFormatter={formatYAxisPrice}
              stroke="hsl(var(--muted-foreground))"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              width={75}
              tickCount={6}
            />
            
            <Tooltip content={<CandleTooltip />} />
            
            {/* Current Price Line with PnL Badge */}
            <ReferenceLine 
              y={currentPrice} 
              stroke={isPositive ? '#22c55e' : '#ef4444'} 
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            
            {/* Bollinger Bands */}
            {activeIndicators.includes('boll') && (
              <>
                <Line dataKey="bollUpper" stroke="#a855f7" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                <Line dataKey="bollMid" stroke="#a855f7" strokeWidth={1} dot={false} />
                <Line dataKey="bollLower" stroke="#a855f7" strokeWidth={1} strokeDasharray="3 3" dot={false} />
              </>
            )}
            
            {/* MA Lines */}
            {activeIndicators.includes('ma') && (
              <>
                <Line dataKey="ma5" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="MA5" />
                <Line dataKey="ma10" stroke="#f97316" strokeWidth={1.5} dot={false} name="MA10" />
                <Line dataKey="ma20" stroke="#a855f7" strokeWidth={1.5} dot={false} name="MA20" />
              </>
            )}
            
            {/* Chart - Line or Candlestick */}
            {chartType === 'line' ? (
              <Area
                type="monotone"
                dataKey="close"
                stroke={strokeColor}
                strokeWidth={2}
                fill={isPositive ? "url(#priceGradientUp)" : "url(#priceGradientDown)"}
                dot={false}
              />
            ) : (
              <Bar
                dataKey="high"
                shape={(props: any) => <CandlestickShape {...props} />}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* PnL Badge */}
      <div className="flex items-center justify-between px-1">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold",
          isPositive ? "bg-[#22c55e]/15 text-[#22c55e]" : "bg-[#ef4444]/15 text-[#ef4444]"
        )}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>PnL {isPositive ? '+' : ''}{priceChange.toFixed(2)}%</span>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          ${currentPrice.toFixed(8)}
        </div>
      </div>

      {/* Volume Panel - Taller with better colors */}
      {activeIndicators.includes('vol') && (
        <div className="h-16 w-full border-t border-border/30 pt-1">
          <div className="text-[10px] text-muted-foreground ml-1 mb-0.5 flex items-center gap-2">
            <span className="font-semibold">Vol</span>
            <span className="text-primary font-mono">
              {formatNumber(chartData[chartData.length - 1]?.volume ?? 0, { compact: true, maxDecimals: 2 })}
            </span>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <ComposedChart data={chartData} margin={{ top: 0, right: 80, left: 5, bottom: 0 }}>
              <Bar dataKey="volume" isAnimationActive={false} radius={[2, 2, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell 
                    key={i} 
                    fill={entry.isUp ? '#22c55e' : '#ef4444'} 
                    opacity={0.7}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* RSI Panel */}
      {activeIndicators.includes('rsi') && (
        <div className="h-16 w-full border-t border-border/30 pt-1">
          <div className="text-[10px] text-muted-foreground ml-1 mb-0.5 flex items-center gap-2">
            <span className="font-semibold">RSI (14)</span>
            <span className="text-primary font-mono">
              {chartData[chartData.length - 1]?.rsi?.toFixed(1) ?? '-'}
            </span>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <ComposedChart data={chartData} margin={{ top: 0, right: 80, left: 5, bottom: 0 }}>
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} />
              <YAxis domain={[0, 100]} hide />
              <Area
                type="monotone"
                dataKey="rsi"
                stroke="#ec4899"
                strokeWidth={1.5}
                fill="rgba(236, 72, 153, 0.15)"
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MACD Panel */}
      {activeIndicators.includes('macd') && (
        <div className="h-16 w-full border-t border-border/30 pt-1">
          <div className="text-[10px] text-muted-foreground ml-1 mb-0.5 flex items-center gap-2">
            <span className="font-semibold">MACD (12,26,9)</span>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <ComposedChart data={chartData} margin={{ top: 0, right: 80, left: 5, bottom: 0 }}>
              <Bar dataKey="macdHist" isAnimationActive={false} radius={[1, 1, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.macdHist !== undefined && entry.macdHist >= 0 ? '#22c55e80' : '#ef444480'} />
                ))}
              </Bar>
              <Line dataKey="macd" stroke="#3b82f6" strokeWidth={1} dot={false} isAnimationActive={false} />
              <Line dataKey="macdSignal" stroke="#f97316" strokeWidth={1} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer - Time label */}
      <div className="flex items-center justify-between px-1 pt-1 border-t border-border/30">
        <span className="text-xs text-muted-foreground">
          {TIME_RANGE_CONFIG[timeRange].label}
        </span>
        <span className="text-xs text-muted-foreground">
          {priceData?.last_updated 
            ? format(new Date(priceData.last_updated), 'HH:mm dd/MM')
            : format(new Date(), 'HH:mm dd/MM')
          }
        </span>
      </div>
    </div>
  );
}
