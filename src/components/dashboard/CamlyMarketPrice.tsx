import { useCamlyPrice } from '@/hooks/useCamlyPrice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, TrendingUp, TrendingDown, RefreshCw, Loader2, CandlestickChart, LineChart, Activity, Radio, Maximize2, X } from 'lucide-react';
import { formatNumber, formatUSD } from '@/lib/formatNumber';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { Area, ResponsiveContainer, Tooltip, YAxis, XAxis, ComposedChart, Bar, Line, Cell, ReferenceLine } from 'recharts';
import camlyLogo from '@/assets/camly-coin-logo.png';

type ChartType = 'line' | 'candle';
type IndicatorType = 'none' | 'macd' | 'rsi' | 'boll';
type TimeRange = '5m' | '15m' | '1H' | '4H' | '1D' | '1W' | '1M';

const TIME_RANGE_CONFIG: Record<TimeRange, { label: string; minutes: number; candles: number }> = {
  '5m': { label: '5 phút', minutes: 5, candles: 60 },
  '15m': { label: '15 phút', minutes: 15, candles: 48 },
  '1H': { label: '1 giờ', minutes: 60, candles: 48 },
  '4H': { label: '4 giờ', minutes: 240, candles: 42 },
  '1D': { label: '1 ngày', minutes: 1440, candles: 30 },
  '1W': { label: 'Tuần', minutes: 10080, candles: 52 },
  '1M': { label: 'Tháng', minutes: 43200, candles: 30 },
};

const generateCandlestickData = (timeRange: TimeRange, basePrice: number, change24h: number) => {
  const config = TIME_RANGE_CONFIG[timeRange];
  const data = [];
  const totalCandles = config.candles;
  
  const startPrice = basePrice * (1 - (change24h / 100) * 0.5);
  let currentPrice = startPrice;
  let momentum = 0;
  const baseVolatility = 0.006;
  const seed = basePrice * 10000000;
  let noiseValue = seed;
  const closePrices: number[] = [];
  
  for (let i = 0; i < totalCandles; i++) {
    noiseValue = (noiseValue * 9301 + 49297) % 233280;
    const random1 = noiseValue / 233280;
    noiseValue = (noiseValue * 9301 + 49297) % 233280;
    const random2 = noiseValue / 233280;
    noiseValue = (noiseValue * 9301 + 49297) % 233280;
    const random3 = noiseValue / 233280;
    
    const smoothRandom = (random1 + random2) / 2 - 0.5;
    momentum = momentum * 0.75 + smoothRandom * 0.25;
    
    const trendPull = (basePrice - currentPrice) * 0.015;
    const volatility = baseVolatility * (1 + Math.abs(momentum) * 3);
    
    const open = currentPrice;
    const move = (momentum * volatility) + trendPull;
    const close = open * (1 + move);
    
    const wickSize = volatility * random3 * 1.2;
    const high = Math.max(open, close) * (1 + wickSize);
    const low = Math.min(open, close) * (1 - wickSize);
    
    currentPrice = close;
    currentPrice = Math.max(basePrice * 0.88, Math.min(basePrice * 1.12, currentPrice));
    
    // Calculate time based on candle interval
    const minutesBack = (totalCandles - i) * config.minutes;
    const date = new Date();
    date.setMinutes(date.getMinutes() - minutesBack);
    
    const volumeSpike = random1 > 0.88 ? 3 : 1;
    const volume = (800 + random2 * 2000) * volumeSpike;
    
    closePrices.push(close);
    
    // Format time label based on interval
    let timeLabel = '';
    let dateLabel = '';
    if (config.minutes <= 60) {
      timeLabel = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      dateLabel = date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });
    } else if (config.minutes <= 1440) {
      timeLabel = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      dateLabel = date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });
    } else {
      timeLabel = date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });
      dateLabel = date.toLocaleDateString('vi-VN', { year: 'numeric' });
    }
    
    data.push({ 
      time: i,
      timeLabel,
      dateLabel,
      fullDateTime: `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })}, ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
      open, high, low, close,
      price: close,
      volume,
      isUp: close >= open,
    });
  }
  
  // Smooth transition to current price
  const smoothPoints = 3;
  for (let i = 0; i < smoothPoints; i++) {
    const idx = data.length - smoothPoints + i;
    const factor = (i + 1) / smoothPoints;
    data[idx].close = data[idx].close * (1 - factor) + basePrice * factor;
    data[idx].price = data[idx].close;
    data[idx].high = Math.max(data[idx].open, data[idx].close) * 1.001;
    data[idx].low = Math.min(data[idx].open, data[idx].close) * 0.999;
  }
  
  return calculateIndicators(data, closePrices);
};

const calculateIndicators = (data: any[], closePrices: number[]) => {
  const period = 14;
  const macdFast = 12;
  const macdSlow = 26;
  const macdSignal = 9;
  const bollPeriod = 20;
  
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < closePrices.length; i++) {
    const change = closePrices[i] - closePrices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }
  
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = 0; i < Math.min(period, data.length); i++) {
    data[i].rsi = 50;
  }
  
  for (let i = period; i < closePrices.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    data[i].rsi = 100 - (100 / (1 + rs));
  }
  
  const calcEMA = (prices: number[], p: number): number[] => {
    const k = 2 / (p + 1);
    const ema: number[] = [prices[0]];
    for (let i = 1; i < prices.length; i++) {
      ema.push(prices[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
  };
  
  const emaFast = calcEMA(closePrices, macdFast);
  const emaSlow = calcEMA(closePrices, macdSlow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = calcEMA(macdLine, macdSignal);
  
  for (let i = 0; i < data.length; i++) {
    data[i].macd = macdLine[i];
    data[i].macdSignal = signalLine[i];
    data[i].macdHist = macdLine[i] - signalLine[i];
  }
  
  for (let i = 0; i < data.length; i++) {
    if (i < bollPeriod - 1) {
      data[i].bollMid = closePrices[i];
      data[i].bollUpper = closePrices[i] * 1.02;
      data[i].bollLower = closePrices[i] * 0.98;
    } else {
      const slice = closePrices.slice(i - bollPeriod + 1, i + 1);
      const sma = slice.reduce((a, b) => a + b, 0) / bollPeriod;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / bollPeriod;
      const stdDev = Math.sqrt(variance);
      data[i].bollMid = sma;
      data[i].bollUpper = sma + stdDev * 2;
      data[i].bollLower = sma - stdDev * 2;
    }
  }
  
  return data;
};

// Enhanced tooltip with detailed time
const CustomCandleTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  
  return (
    <div className="bg-card/98 backdrop-blur-xl border-2 border-treasury-gold rounded-xl p-3 shadow-2xl shadow-treasury-gold/30">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-treasury-gold/40">
        <span className="text-xs">📅</span>
        <span className="text-sm font-black text-treasury-gold">{data.fullDateTime}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center gap-4">
          <span className="text-xs text-muted-foreground">Open:</span>
          <span className="font-mono font-bold text-sm">${data.open?.toFixed(8)}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-xs text-muted-foreground">High:</span>
          <span className="font-mono font-bold text-sm text-emerald-500">${data.high?.toFixed(8)}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-xs text-muted-foreground">Low:</span>
          <span className="font-mono font-bold text-sm text-rose-500">${data.low?.toFixed(8)}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-xs text-muted-foreground">Close:</span>
          <span className={cn("font-mono font-black text-sm", data.isUp ? "text-emerald-500" : "text-rose-500")}>${data.close?.toFixed(8)}</span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-treasury-gold/40 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">📊 Vol:</span>
          <span className="text-xs font-bold">{formatNumber(data.volume, { compact: true })}</span>
        </div>
        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", data.isUp ? "bg-emerald-500/25 text-emerald-500" : "bg-rose-500/25 text-rose-500")}>
          {data.isUp ? '▲ BUY' : '▼ SELL'}
        </span>
      </div>
    </div>
  );
};

export function CamlyMarketPrice() {
  const { data: priceData, isLoading, isRefetching, refetch } = useCamlyPrice();
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [chartRange, setChartRange] = useState<TimeRange>('1H');
  const [chartType, setChartType] = useState<ChartType>('candle');
  const [indicator, setIndicator] = useState<IndicatorType>('none');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleRefresh = async () => {
    setIsManualRefresh(true);
    await refetch();
    setIsManualRefresh(false);
  };

  const handleRangeChange = (range: TimeRange) => {
    if (range !== chartRange) {
      setIsTransitioning(true);
      setTimeout(() => {
        setChartRange(range);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 150);
    }
  };

  const isPositiveChange = (priceData?.change_24h || 0) >= 0;
  const chartData = useMemo(() => 
    generateCandlestickData(chartRange, priceData?.price_usd || 0.00002247, priceData?.change_24h || 0),
    [chartRange, priceData?.price_usd, priceData?.change_24h]
  );

  const minPrice = Math.min(...chartData.map(d => d.low));
  const maxPrice = Math.max(...chartData.map(d => d.high));
  const priceRange = maxPrice - minPrice;
  const currentPrice = priceData?.price_usd || 0.00002247;

  // Time range buttons for compact view
  const compactRanges: TimeRange[] = ['5m', '15m', '1H', '4H', '1D'];
  const allRanges: TimeRange[] = ['5m', '15m', '1H', '4H', '1D', '1W', '1M'];

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50/90 via-yellow-50/70 to-orange-50/50 dark:from-amber-950/50 dark:via-yellow-950/40 dark:to-orange-950/30 shadow-2xl">
      <div className="absolute inset-0 rounded-xl border-2 border-treasury-gold/50 shadow-[inset_0_0_30px_rgba(201,162,39,0.1)]" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-treasury-gold/25 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl" />
      
      <div className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-treasury-gold/50 rounded-full blur-md animate-pulse" />
              <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-treasury-gold shadow-lg shadow-treasury-gold/40">
                <img src={camlyLogo} alt="CAMLY" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-foreground tracking-tight">CAMLY COIN</h3>
                <span className="text-[10px] text-muted-foreground font-semibold px-1.5 py-0.5 bg-muted/60 rounded">CAMLY</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-muted-foreground font-medium">Giá Thị Trường</p>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 rounded-full">
                  <Radio className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-500">LIVE</span>
                </div>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-treasury-gold/15 hover:bg-treasury-gold/30 text-treasury-gold border border-treasury-gold/40 shadow-md" onClick={handleRefresh} disabled={isRefetching || isManualRefresh}>
            {(isRefetching || isManualRefresh) ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-56 bg-treasury-gold/15" />
            <Skeleton className="h-32 w-full bg-treasury-gold/15" />
          </div>
        ) : (
          <>
            {/* Price Display */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <p className="text-4xl font-black bg-gradient-to-r from-treasury-gold via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-sm">
                ${currentPrice.toFixed(8)}
              </p>
              <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-md", isPositiveChange ? "bg-gradient-to-r from-emerald-500/25 to-emerald-400/15 text-emerald-500 border border-emerald-500/30" : "bg-gradient-to-r from-rose-500/25 to-rose-400/15 text-rose-500 border border-rose-500/30")}>
                {isPositiveChange ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isPositiveChange ? '+' : ''}{formatNumber(priceData?.change_24h || 0, { minDecimals: 2, maxDecimals: 2 })}%
                <span className="text-[10px] font-semibold opacity-70">(24h)</span>
              </div>
            </div>

            {/* Price Range Bar */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-mono text-[10px]">${minPrice.toFixed(8)}</span>
              <div className="flex-1 h-2 bg-gradient-to-r from-rose-500 via-treasury-gold to-emerald-500 rounded-full relative shadow-inner">
                <div className="absolute w-3 h-3 bg-white border-2 border-treasury-gold rounded-full top-1/2 -translate-y-1/2 shadow-lg shadow-treasury-gold/50 transition-all duration-500" style={{ left: `${Math.max(5, Math.min(95, ((currentPrice) - minPrice) / priceRange * 100))}%` }} />
              </div>
              <span className="text-muted-foreground font-mono text-[10px]">${maxPrice.toFixed(8)}</span>
            </div>

            {/* Volume & Market Cap */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm rounded-xl p-3 border border-treasury-gold/30 shadow-md">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">📊 Volume 24h</p>
                <p className="font-bold text-base text-foreground">{priceData?.volume_24h && priceData.volume_24h > 0 ? formatUSD(priceData.volume_24h) : '—'}</p>
              </div>
              <div className="bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm rounded-xl p-3 border border-treasury-gold/30 shadow-md">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">💎 Market Cap</p>
                <p className="font-bold text-base text-foreground">{priceData?.market_cap && priceData.market_cap > 0 ? formatUSD(priceData.market_cap) : '—'}</p>
              </div>
            </div>

            {/* Chart Section - Bitget Style */}
            <div className="bg-gradient-to-br from-background/70 to-background/50 backdrop-blur-sm rounded-xl p-3 border border-treasury-gold/30 shadow-lg">
              {/* Chart Controls */}
              <div className="flex items-center justify-between mb-2 gap-2">
                {/* Time Range - Bitget Style */}
                <div className="flex items-center gap-1 text-[10px]">
                  {compactRanges.map((range) => (
                    <button 
                      key={range} 
                      onClick={() => handleRangeChange(range)} 
                      className={cn(
                        "px-2.5 py-1 rounded-md font-semibold transition-all duration-200",
                        chartRange === range 
                          ? "bg-foreground text-background shadow-md" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {TIME_RANGE_CONFIG[range].label}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-1">
                  {/* Chart Type Toggle */}
                  <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5">
                    <button onClick={() => setChartType('line')} className={cn("p-1 rounded transition-all", chartType === 'line' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")} title="Line"><LineChart className="w-3 h-3" /></button>
                    <button onClick={() => setChartType('candle')} className={cn("p-1 rounded transition-all", chartType === 'candle' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")} title="Candle"><CandlestickChart className="w-3 h-3" /></button>
                  </div>
                  <button 
                    onClick={() => setIsFullscreen(true)} 
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              {/* Main Chart - Bitget Style with Y-axis prices */}
              <div className={cn("h-44 transition-all duration-300 ease-out relative", isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100")}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <ComposedChart data={chartData} margin={{ top: 5, right: 60, bottom: 0, left: 5 }}>
                      <defs>
                        <linearGradient id="camlyPriceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={isPositiveChange ? '#10b981' : '#f43f5e'} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={isPositiveChange ? '#10b981' : '#f43f5e'} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="timeLabel" 
                        tick={{ fontSize: 8, fill: '#888' }}
                        tickLine={false} 
                        axisLine={{ stroke: '#333', strokeOpacity: 0.3 }} 
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        domain={[minPrice * 0.999, maxPrice * 1.001]} 
                        orientation="right"
                        tick={{ fontSize: 8, fill: '#888' }}
                        tickFormatter={(value) => value.toFixed(8)}
                        tickLine={false}
                        axisLine={false}
                        width={55}
                        tickCount={5}
                      />
                      <Tooltip content={<CustomCandleTooltip />} />
                      {/* Current Price Line */}
                      <ReferenceLine y={currentPrice} stroke={isPositiveChange ? '#22c55e' : '#ef4444'} strokeDasharray="4 2" strokeWidth={1} label={{ value: currentPrice.toFixed(8), position: 'right', fontSize: 8, fill: isPositiveChange ? '#22c55e' : '#ef4444', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="price" stroke={isPositiveChange ? '#22c55e' : '#ef4444'} strokeWidth={2} fill="url(#camlyPriceGrad)" dot={false} activeDot={{ r: 4, fill: '#C9A227', stroke: '#fff', strokeWidth: 2 }} animationDuration={600} />
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={chartData} margin={{ top: 5, right: 60, bottom: 0, left: 5 }}>
                      <defs>
                        <linearGradient id="candleGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" /><stop offset="100%" stopColor="#16a34a" /></linearGradient>
                        <linearGradient id="candleRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#dc2626" /></linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="timeLabel" 
                        tick={{ fontSize: 8, fill: '#888' }} 
                        tickLine={false} 
                        axisLine={{ stroke: '#333', strokeOpacity: 0.3 }} 
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        domain={[minPrice * 0.998, maxPrice * 1.002]} 
                        orientation="right"
                        tick={{ fontSize: 8, fill: '#888' }}
                        tickFormatter={(value) => value.toFixed(8)}
                        tickLine={false}
                        axisLine={false}
                        width={55}
                        tickCount={5}
                      />
                      <Tooltip content={<CustomCandleTooltip />} />
                      {/* Current Price Line */}
                      <ReferenceLine y={currentPrice} stroke={isPositiveChange ? '#22c55e' : '#ef4444'} strokeDasharray="4 2" strokeWidth={1} />
                      <Bar dataKey="close" shape={() => null} animationDuration={500} />
                      {chartData.map((entry, index) => {
                        const barWidth = 100 / chartData.length;
                        const x = index * barWidth;
                        const yRange = maxPrice * 1.002 - minPrice * 0.998;
                        const toY = (price: number) => ((maxPrice * 1.002 - price) / yRange) * 100;
                        return (
                          <g key={index}>
                            {/* Wick */}
                            <line 
                              x1={`${x + barWidth / 2}%`} 
                              y1={`${toY(entry.high)}%`} 
                              x2={`${x + barWidth / 2}%`} 
                              y2={`${toY(entry.low)}%`} 
                              stroke={entry.isUp ? '#22c55e' : '#ef4444'} 
                              strokeWidth={1} 
                            />
                            {/* Candle Body */}
                            <rect 
                              x={`${x + barWidth * 0.2}%`} 
                              y={`${toY(Math.max(entry.open, entry.close))}%`} 
                              width={`${barWidth * 0.6}%`} 
                              height={`${Math.max(Math.abs(toY(entry.open) - toY(entry.close)), 0.3)}%`} 
                              fill={entry.isUp ? '#22c55e' : '#ef4444'} 
                            />
                          </g>
                        );
                      })}
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
                
                {/* Current Price Badge - Floating on right */}
                <div 
                  className={cn(
                    "absolute right-0 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-bold rounded-l-md shadow-lg z-10",
                    isPositiveChange 
                      ? "bg-emerald-500 text-white" 
                      : "bg-rose-500 text-white"
                  )}
                >
                  {currentPrice.toFixed(8)}
                </div>
              </div>
              
              {/* Volume Bars - Bitget Style */}
              <div className="h-10 mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 0, right: 60, bottom: 0, left: 5 }}>
                    <XAxis dataKey="timeLabel" hide />
                    <YAxis domain={[0, 'dataMax']} hide />
                    <Bar dataKey="volume" animationDuration={400}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={index} 
                          fill={entry.isUp ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)'} 
                        />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              {/* Vol Label */}
              <div className="text-[9px] text-muted-foreground mt-0.5">Vol</div>
            </div>

            {/* Footer Status */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                Cập nhật: {priceData?.last_updated ? new Date(priceData.last_updated).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
              </span>
              <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide shadow-sm", priceData?.source === 'fallback' || priceData?.source === 'error_fallback' ? "bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30" : "bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30")}>
                {priceData?.source === 'fallback' || priceData?.source === 'error_fallback' ? '⚠️ Offline' : '🟢 Realtime'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Chart Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 bg-gradient-to-br from-background via-background to-amber-950/10 border-2 border-treasury-gold/50">
          <div className="relative h-full flex flex-col">
            {/* Fullscreen Header */}
            <DialogHeader className="p-4 border-b border-treasury-gold/30 bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-950/30 dark:to-orange-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-treasury-gold/50 rounded-full blur-md animate-pulse" />
                    <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-treasury-gold shadow-lg">
                      <img src={camlyLogo} alt="CAMLY" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                      CAMLY COIN
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 rounded-full text-[10px]">
                        <Radio className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                        <span className="font-bold text-emerald-500">LIVE</span>
                      </span>
                    </DialogTitle>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-2xl font-black bg-gradient-to-r from-treasury-gold via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                        ${currentPrice.toFixed(8)}
                      </span>
                      <span className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold", isPositiveChange ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500")}>
                        {isPositiveChange ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {isPositiveChange ? '+' : ''}{formatNumber(priceData?.change_24h || 0, { minDecimals: 2, maxDecimals: 2 })}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Fullscreen Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-treasury-gold/10 rounded-lg p-1 border border-treasury-gold/30">
                    <button onClick={() => setChartType('line')} className={cn("p-2 rounded-md transition-all", chartType === 'line' ? "bg-gradient-to-r from-treasury-gold to-amber-500 text-white shadow-md" : "text-muted-foreground hover:bg-treasury-gold/20")}><LineChart className="w-4 h-4" /></button>
                    <button onClick={() => setChartType('candle')} className={cn("p-2 rounded-md transition-all", chartType === 'candle' ? "bg-gradient-to-r from-treasury-gold to-amber-500 text-white shadow-md" : "text-muted-foreground hover:bg-treasury-gold/20")}><CandlestickChart className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-0.5 bg-treasury-gold/10 rounded-lg p-1 border border-treasury-gold/30">
                    {(['none', 'boll', 'macd', 'rsi'] as const).map((ind) => (
                      <button key={ind} onClick={() => setIndicator(ind)} className={cn("px-3 py-1.5 rounded-md text-xs font-bold uppercase", indicator === ind ? "bg-gradient-to-r from-treasury-gold to-amber-500 text-white shadow-md" : "text-muted-foreground hover:bg-treasury-gold/20")}>{ind === 'none' ? '—' : ind}</button>
                    ))}
                  </div>
                  <div className="flex bg-treasury-gold/10 rounded-lg p-1 border border-treasury-gold/30">
                    {allRanges.map((range) => (
                      <button key={range} onClick={() => handleRangeChange(range)} className={cn("px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200", chartRange === range ? "bg-gradient-to-r from-treasury-gold to-amber-500 text-white shadow-md" : "text-muted-foreground hover:bg-treasury-gold/20")}>{range}</button>
                    ))}
                  </div>
                  <button onClick={() => setIsFullscreen(false)} className="p-2 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"><X className="w-5 h-5" /></button>
                </div>
              </div>
            </DialogHeader>

            {/* Fullscreen Chart Area */}
            <div className="flex-1 p-4">
              <div className="h-full bg-gradient-to-br from-background/80 to-background/60 rounded-xl border border-treasury-gold/30 p-4 relative">
                {/* Min/Max Legend for Fullscreen */}
                <div className="absolute top-2 right-4 flex items-center gap-4 text-xs z-10">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/15 rounded-lg border border-emerald-500/30">
                    <div className="w-5 h-0.5" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #22c55e 0, #22c55e 4px, transparent 4px, transparent 8px)' }} />
                    <span className="text-emerald-500 font-bold">Max: ${maxPrice.toFixed(8)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/15 rounded-lg border border-rose-500/30">
                    <div className="w-5 h-0.5" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #ef4444 0, #ef4444 4px, transparent 4px, transparent 8px)' }} />
                    <span className="text-rose-500 font-bold">Min: ${minPrice.toFixed(8)}</span>
                  </div>
                </div>
                
                <div className={cn("h-full transition-all duration-300 ease-out", isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100")}>
                  <ResponsiveContainer width="100%" height={indicator !== 'none' && indicator !== 'boll' ? '80%' : '90%'}>
                    {chartType === 'line' ? (
                      <ComposedChart data={chartData} margin={{ top: 30, right: 20, bottom: 20, left: 20 }}>
                        <defs>
                          <linearGradient id="camlyPriceGradFull" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={isPositiveChange ? '#10b981' : '#f43f5e'} stopOpacity={0.5} />
                            <stop offset="50%" stopColor="#C9A227" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#C9A227" stopOpacity={0.02} />
                          </linearGradient>
                          <filter id="lineGlowFull"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                        </defs>
                        <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#888' }} tickLine={false} axisLine={{ stroke: '#C9A227', strokeOpacity: 0.3 }} interval="preserveStartEnd" />
                        <YAxis domain={['dataMin', 'dataMax']} hide padding={{ top: 20, bottom: 20 }} />
                        <Tooltip content={<CustomCandleTooltip />} />
                        {/* Min/Max Price Lines */}
                        <ReferenceLine y={maxPrice} stroke="#22c55e" strokeDasharray="8 4" strokeWidth={2} />
                        <ReferenceLine y={minPrice} stroke="#ef4444" strokeDasharray="8 4" strokeWidth={2} />
                        {indicator === 'boll' && (<><Area type="monotone" dataKey="bollUpper" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} /><Area type="monotone" dataKey="bollMid" stroke="#a855f7" strokeWidth={2} fill="none" dot={false} /><Area type="monotone" dataKey="bollLower" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} /></>)}
                        <Area type="monotone" dataKey="price" stroke={isPositiveChange ? '#22c55e' : '#ef4444'} strokeWidth={3} fill="url(#camlyPriceGradFull)" dot={false} activeDot={{ r: 8, fill: '#C9A227', stroke: '#fff', strokeWidth: 3 }} animationDuration={800} animationEasing="ease-out" style={{ filter: 'url(#lineGlowFull)' }} />
                      </ComposedChart>
                    ) : (
                      <ComposedChart data={chartData} margin={{ top: 30, right: 20, bottom: 20, left: 20 }}>
                        <defs>
                          <linearGradient id="candleGreenFull" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" /><stop offset="100%" stopColor="#16a34a" /></linearGradient>
                          <linearGradient id="candleRedFull" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#dc2626" /></linearGradient>
                        </defs>
                        <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#888' }} tickLine={false} axisLine={{ stroke: '#C9A227', strokeOpacity: 0.3 }} interval="preserveStartEnd" />
                        <YAxis domain={[minPrice * 0.997, maxPrice * 1.003]} hide />
                        <Tooltip content={<CustomCandleTooltip />} />
                        {/* Min/Max Price Lines */}
                        <ReferenceLine y={maxPrice} stroke="#22c55e" strokeDasharray="8 4" strokeWidth={2} />
                        <ReferenceLine y={minPrice} stroke="#ef4444" strokeDasharray="8 4" strokeWidth={2} />
                        {indicator === 'boll' && (<><Line type="monotone" dataKey="bollUpper" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="5 3" dot={false} /><Line type="monotone" dataKey="bollMid" stroke="#a855f7" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="bollLower" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="5 3" dot={false} /></>)}
                        <Bar dataKey="close" shape={() => null} animationDuration={600} animationEasing="ease-out" />
                        {chartData.map((entry, index) => {
                          const barWidth = 100 / chartData.length;
                          const x = index * barWidth;
                          const yRange = maxPrice * 1.003 - minPrice * 0.997;
                          const toY = (price: number) => ((maxPrice * 1.003 - price) / yRange) * 100;
                          return (
                            <g key={index}>
                              <line x1={`${x + barWidth / 2}%`} y1={`${toY(entry.high)}%`} x2={`${x + barWidth / 2}%`} y2={`${toY(entry.low)}%`} stroke={entry.isUp ? '#22c55e' : '#ef4444'} strokeWidth={2} opacity={0.95} />
                              <rect x={`${x + barWidth * 0.15}%`} y={`${toY(Math.max(entry.open, entry.close))}%`} width={`${barWidth * 0.7}%`} height={`${Math.max(Math.abs(toY(entry.open) - toY(entry.close)), 0.3)}%`} fill={entry.isUp ? 'url(#candleGreenFull)' : 'url(#candleRedFull)'} rx={2} stroke={entry.isUp ? '#16a34a' : '#dc2626'} strokeWidth={0.8} />
                            </g>
                          );
                        })}
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* Fullscreen Indicator Panel - Simplified */}
                {indicator !== 'none' && indicator !== 'boll' && (
                  <div className="h-[10%] border-t border-treasury-gold/30 pt-2 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      {indicator === 'rsi' ? (
                        <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                          <defs><linearGradient id="rsiGradFull" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} /><stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} /></linearGradient></defs>
                          <YAxis domain={[0, 100]} hide />
                          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                          <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} />
                          <Area type="monotone" dataKey="rsi" stroke="#a855f7" strokeWidth={2} fill="url(#rsiGradFull)" dot={false} />
                        </ComposedChart>
                      ) : (
                        <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                          <YAxis domain={['auto', 'auto']} hide />
                          <ReferenceLine y={0} stroke="#666" strokeWidth={0.5} />
                          <Bar dataKey="macdHist">{chartData.map((entry, index) => (<Cell key={index} fill={entry.macdHist >= 0 ? '#22c55e' : '#ef4444'} opacity={0.7} />))}</Bar>
                          <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="macdSignal" stroke="#f97316" strokeWidth={2} dot={false} />
                        </ComposedChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
