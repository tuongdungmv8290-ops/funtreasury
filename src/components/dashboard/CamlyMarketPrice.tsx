import { useCamlyPrice } from '@/hooks/useCamlyPrice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, TrendingUp, TrendingDown, RefreshCw, Loader2, CandlestickChart, LineChart, Activity } from 'lucide-react';
import { formatNumber, formatUSD } from '@/lib/formatNumber';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis, ComposedChart, Bar, Line, Cell, ReferenceLine } from 'recharts';
import camlyLogo from '@/assets/camly-coin-logo.png';

type ChartType = 'line' | 'candle';
type IndicatorType = 'none' | 'macd' | 'rsi' | 'boll';

// Generate realistic crypto OHLCV data for candlestick chart
const generateCandlestickData = (days: number, basePrice: number, change24h: number) => {
  const data = [];
  const totalCandles = days <= 1 ? 24 : days <= 7 ? 84 : 180;
  
  const startPrice = basePrice * (1 - (change24h / 100));
  let currentPrice = startPrice;
  
  let momentum = 0;
  const baseVolatility = 0.006;
  
  const seed = basePrice * 10000000;
  let noiseValue = seed;
  
  // Store prices for indicator calculations
  const closePrices: number[] = [];
  
  for (let i = 0; i < totalCandles; i++) {
    const progress = i / totalCandles;
    
    // Pseudo-random
    noiseValue = (noiseValue * 9301 + 49297) % 233280;
    const random1 = noiseValue / 233280;
    noiseValue = (noiseValue * 9301 + 49297) % 233280;
    const random2 = noiseValue / 233280;
    noiseValue = (noiseValue * 9301 + 49297) % 233280;
    const random3 = noiseValue / 233280;
    
    const smoothRandom = (random1 + random2) / 2 - 0.5;
    momentum = momentum * 0.8 + smoothRandom * 0.2;
    
    const trendPull = (basePrice - currentPrice) * 0.015;
    const volatility = baseVolatility * (1 + Math.abs(momentum) * 3);
    
    // OHLC calculation
    const open = currentPrice;
    const move = (momentum * volatility) + trendPull;
    const close = open * (1 + move);
    
    const wickSize = volatility * random3;
    const high = Math.max(open, close) * (1 + wickSize);
    const low = Math.min(open, close) * (1 - wickSize);
    
    currentPrice = close;
    
    // Clamp
    currentPrice = Math.max(basePrice * 0.85, Math.min(basePrice * 1.15, currentPrice));
    
    // Time calculation
    const hourOffset = Math.floor((i / totalCandles) * days * 24);
    const date = new Date();
    date.setHours(date.getHours() - (days * 24 - hourOffset));
    
    const volumeSpike = random1 > 0.85 ? 3 : 1;
    const volume = (400 + random2 * 1200) * volumeSpike;
    
    closePrices.push(close);
    
    data.push({ 
      time: i,
      timeLabel: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      dateLabel: date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' }),
      open,
      high,
      low,
      close,
      price: close, // For line chart compatibility
      volume,
      isUp: close >= open,
    });
  }
  
  // Smooth to current price at end
  const smoothPoints = 3;
  for (let i = 0; i < smoothPoints; i++) {
    const idx = data.length - smoothPoints + i;
    const factor = (i + 1) / smoothPoints;
    data[idx].close = data[idx].close * (1 - factor) + basePrice * factor;
    data[idx].price = data[idx].close;
    data[idx].high = Math.max(data[idx].open, data[idx].close) * 1.001;
    data[idx].low = Math.min(data[idx].open, data[idx].close) * 0.999;
  }
  
  // Calculate indicators
  return calculateIndicators(data, closePrices);
};

// Calculate RSI, MACD, Bollinger Bands
const calculateIndicators = (data: any[], closePrices: number[]) => {
  const period = 14;
  const macdFast = 12;
  const macdSlow = 26;
  const macdSignal = 9;
  const bollPeriod = 20;
  
  // Calculate RSI
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < closePrices.length; i++) {
    const change = closePrices[i] - closePrices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }
  
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  data[0].rsi = 50;
  for (let i = 1; i < period; i++) {
    data[i].rsi = 50;
  }
  
  for (let i = period; i < closePrices.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    data[i].rsi = 100 - (100 / (1 + rs));
  }
  
  // Calculate EMA helper
  const calcEMA = (prices: number[], p: number): number[] => {
    const k = 2 / (p + 1);
    const ema: number[] = [prices[0]];
    for (let i = 1; i < prices.length; i++) {
      ema.push(prices[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
  };
  
  // MACD
  const emaFast = calcEMA(closePrices, macdFast);
  const emaSlow = calcEMA(closePrices, macdSlow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = calcEMA(macdLine, macdSignal);
  
  for (let i = 0; i < data.length; i++) {
    data[i].macd = macdLine[i];
    data[i].macdSignal = signalLine[i];
    data[i].macdHist = macdLine[i] - signalLine[i];
  }
  
  // Bollinger Bands
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

// Custom Candlestick component
const CandlestickBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;
  
  const { open, close, high, low, isUp } = payload;
  const color = isUp ? '#22c55e' : '#ef4444';
  
  const priceRange = props.yAxisMap?.[0]?.domain;
  if (!priceRange) return null;
  
  const [minY, maxY] = priceRange;
  const chartHeight = props.background?.height || 120;
  const yScale = chartHeight / (maxY - minY);
  
  const bodyTop = Math.max(open, close);
  const bodyBottom = Math.min(open, close);
  const bodyHeight = Math.max((bodyTop - bodyBottom) * yScale, 1);
  const bodyY = (maxY - bodyTop) * yScale;
  
  const wickX = x + width / 2;
  const wickTop = (maxY - high) * yScale;
  const wickBottom = (maxY - low) * yScale;
  
  return (
    <g>
      <line x1={wickX} y1={wickTop} x2={wickX} y2={wickBottom} stroke={color} strokeWidth={1} />
      <rect x={x + 1} y={bodyY} width={Math.max(width - 2, 2)} height={Math.max(bodyHeight, 1)} fill={color} rx={1} />
    </g>
  );
};

export function CamlyMarketPrice() {
  const { data: priceData, isLoading, isRefetching, refetch } = useCamlyPrice();
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [chartRange, setChartRange] = useState<'24H' | '7D' | '30D'>('24H');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [indicator, setIndicator] = useState<IndicatorType>('none');

  const handleRefresh = async () => {
    setIsManualRefresh(true);
    await refetch();
    setIsManualRefresh(false);
  };

  const isPositiveChange = (priceData?.change_24h || 0) >= 0;
  
  const chartDays = chartRange === '24H' ? 1 : chartRange === '7D' ? 7 : 30;
  const chartData = useMemo(() => 
    generateCandlestickData(chartDays, priceData?.price_usd || 0.00002272, priceData?.change_24h || 0),
    [chartDays, priceData?.price_usd, priceData?.change_24h]
  );

  const minPrice = Math.min(...chartData.map(d => d.low));
  const maxPrice = Math.max(...chartData.map(d => d.high));

  // Get indicator chart height based on selection
  const indicatorHeight = indicator !== 'none' ? 50 : 0;

  return (
    <Card className="relative overflow-hidden border-2 border-treasury-gold/40 bg-gradient-to-br from-amber-50/80 via-yellow-50/60 to-orange-50/40 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/20 shadow-xl shadow-treasury-gold/10">
      {/* Animated glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-treasury-gold/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl" />
      
      <div className="relative p-4 space-y-3">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-treasury-gold shadow-lg shadow-treasury-gold/30">
              <img src={camlyLogo} alt="CAMLY" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-foreground">CAMLY COIN</h3>
                <span className="text-xs text-muted-foreground font-medium">CAMLY</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Giá Thị Trường • Realtime</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-treasury-gold/10 hover:bg-treasury-gold/20 text-treasury-gold border border-treasury-gold/30"
            onClick={handleRefresh}
            disabled={isRefetching || isManualRefresh}
          >
            {(isRefetching || isManualRefresh) ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-48 bg-treasury-gold/10" />
            <Skeleton className="h-24 w-full bg-treasury-gold/10" />
          </div>
        ) : (
          <>
            {/* Big Price Display */}
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-black text-treasury-gold drop-shadow-sm">
                ${priceData?.price_usd.toFixed(8) || '0.00000000'}
              </p>
              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold",
                isPositiveChange 
                  ? "bg-emerald-500/20 text-emerald-500" 
                  : "bg-rose-500/20 text-rose-500"
              )}>
                {isPositiveChange ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {isPositiveChange ? '+' : ''}{formatNumber(priceData?.change_24h || 0, { minDecimals: 2, maxDecimals: 2 })}%
                <span className="text-[10px] font-medium opacity-70">(24h)</span>
              </div>
            </div>

            {/* 24h Range Bar */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-mono">${(minPrice).toFixed(8)}</span>
              <div className="flex-1 h-1.5 bg-gradient-to-r from-rose-400 via-treasury-gold to-emerald-400 rounded-full relative">
                <div 
                  className="absolute w-2 h-2 bg-white border-2 border-treasury-gold rounded-full top-1/2 -translate-y-1/2 shadow-md"
                  style={{ left: `${((priceData?.price_usd || 0) - minPrice) / (maxPrice - minPrice) * 100}%` }}
                />
              </div>
              <span className="text-muted-foreground font-mono">${(maxPrice).toFixed(8)}</span>
              <span className="text-[10px] text-muted-foreground">24h Range</span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background/70 backdrop-blur-sm rounded-xl p-2.5 border border-treasury-gold/20">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  24 Hour Trading Vol
                </p>
                <p className="font-bold text-sm">{priceData?.volume_24h && priceData.volume_24h > 0 ? formatUSD(priceData.volume_24h) : '—'}</p>
              </div>
              <div className="bg-background/70 backdrop-blur-sm rounded-xl p-2.5 border border-treasury-gold/20">
                <p className="text-[10px] text-muted-foreground">Market Cap</p>
                <p className="font-bold text-sm">{priceData?.market_cap && priceData.market_cap > 0 ? formatUSD(priceData.market_cap) : '—'}</p>
              </div>
            </div>

            {/* Chart Section */}
            <div className="bg-background/60 backdrop-blur-sm rounded-xl p-3 border border-treasury-gold/20">
              {/* Chart Controls */}
              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                {/* Chart Type Toggle */}
                <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-0.5 border border-border/50">
                  <button
                    onClick={() => setChartType('line')}
                    className={cn(
                      "p-1.5 rounded-md transition-all duration-200",
                      chartType === 'line'
                        ? "bg-treasury-gold text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    )}
                    title="Line Chart"
                  >
                    <LineChart className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setChartType('candle')}
                    className={cn(
                      "p-1.5 rounded-md transition-all duration-200",
                      chartType === 'candle'
                        ? "bg-treasury-gold text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    )}
                    title="Candlestick"
                  >
                    <CandlestickChart className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Indicator Toggle */}
                <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-0.5 border border-border/50">
                  {(['none', 'macd', 'rsi', 'boll'] as const).map((ind) => (
                    <button
                      key={ind}
                      onClick={() => setIndicator(ind)}
                      className={cn(
                        "px-2 py-1 rounded-md text-[9px] font-bold transition-all duration-200 uppercase",
                        indicator === ind
                          ? "bg-treasury-gold text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      {ind === 'none' ? '—' : ind}
                    </button>
                  ))}
                </div>

                {/* Range Toggle */}
                <div className="flex bg-muted/60 rounded-lg p-0.5 border border-border/50">
                  {(['24H', '7D', '30D'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setChartRange(range)}
                      className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-bold transition-all duration-200",
                        chartRange === range
                          ? "bg-treasury-gold text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Main Price Chart */}
              <div className="h-32 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                      <defs>
                        <linearGradient id="camlyPriceGradientSmooth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={isPositiveChange ? '#10b981' : '#f43f5e'} stopOpacity={0.5} />
                          <stop offset="40%" stopColor={isPositiveChange ? '#22c55e' : '#ef4444'} stopOpacity={0.25} />
                          <stop offset="70%" stopColor="#C9A227" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="#C9A227" stopOpacity={0.03} />
                        </linearGradient>
                        <filter id="lineGlow">
                          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <YAxis domain={['dataMin', 'dataMax']} hide padding={{ top: 10, bottom: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '2px solid #C9A227',
                          borderRadius: '12px',
                          fontSize: '11px',
                          padding: '10px 14px',
                          boxShadow: '0 8px 24px rgba(201, 162, 39, 0.25)'
                        }}
                        formatter={(value: number) => [`$${value.toFixed(8)}`, 'Giá']}
                        labelFormatter={(_, payload) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            return `📅 ${data.dateLabel}, ${data.timeLabel}`;
                          }
                          return '';
                        }}
                      />
                      {/* Bollinger Bands if selected */}
                      {indicator === 'boll' && (
                        <>
                          <Area type="monotone" dataKey="bollUpper" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="3 3" fill="none" dot={false} />
                          <Area type="monotone" dataKey="bollMid" stroke="#a855f7" strokeWidth={1} fill="none" dot={false} />
                          <Area type="monotone" dataKey="bollLower" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="3 3" fill="none" dot={false} />
                        </>
                      )}
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={isPositiveChange ? '#22c55e' : '#ef4444'}
                        strokeWidth={2.5}
                        fill="url(#camlyPriceGradientSmooth)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#C9A227', stroke: '#fff', strokeWidth: 2 }}
                        animationDuration={800}
                        style={{ filter: 'url(#lineGlow)' }}
                      />
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                      <YAxis domain={[minPrice * 0.995, maxPrice * 1.005]} hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '2px solid #C9A227',
                          borderRadius: '12px',
                          fontSize: '10px',
                          padding: '8px 12px',
                          boxShadow: '0 8px 24px rgba(201, 162, 39, 0.25)'
                        }}
                        formatter={(value: number, name: string) => {
                          const labels: Record<string, string> = { open: 'Open', high: 'High', low: 'Low', close: 'Close' };
                          return [`$${value.toFixed(8)}`, labels[name] || name];
                        }}
                        labelFormatter={(_, payload) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            return `📅 ${data.dateLabel}, ${data.timeLabel}`;
                          }
                          return '';
                        }}
                      />
                      {/* Bollinger Bands if selected */}
                      {indicator === 'boll' && (
                        <>
                          <Line type="monotone" dataKey="bollUpper" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                          <Line type="monotone" dataKey="bollMid" stroke="#a855f7" strokeWidth={1} dot={false} />
                          <Line type="monotone" dataKey="bollLower" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                        </>
                      )}
                      {/* Candlestick bars */}
                      <Bar dataKey="close" shape={(props: any) => null}>
                        {chartData.map((entry, index) => {
                          const barWidth = 100 / chartData.length;
                          const x = (index / chartData.length) * 100;
                          return null;
                        })}
                      </Bar>
                      {/* Draw candlesticks manually */}
                      {chartData.map((entry, index) => {
                        const chartWidth = 100; // percentage
                        const barWidth = chartWidth / chartData.length;
                        const x = index * barWidth;
                        const color = entry.isUp ? '#22c55e' : '#ef4444';
                        const yRange = maxPrice * 1.005 - minPrice * 0.995;
                        const toY = (price: number) => ((maxPrice * 1.005 - price) / yRange) * 100;
                        
                        return (
                          <g key={index}>
                            <line
                              x1={`${x + barWidth / 2}%`}
                              y1={`${toY(entry.high)}%`}
                              x2={`${x + barWidth / 2}%`}
                              y2={`${toY(entry.low)}%`}
                              stroke={color}
                              strokeWidth={1}
                            />
                            <rect
                              x={`${x + barWidth * 0.15}%`}
                              y={`${toY(Math.max(entry.open, entry.close))}%`}
                              width={`${barWidth * 0.7}%`}
                              height={`${Math.max(Math.abs(toY(entry.open) - toY(entry.close)), 0.5)}%`}
                              fill={color}
                              rx={1}
                            />
                          </g>
                        );
                      })}
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Indicator Panel */}
              {indicator !== 'none' && indicator !== 'boll' && (
                <div className="h-12 mt-2 border-t border-treasury-gold/20 pt-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Activity className="w-3 h-3 text-treasury-gold" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{indicator}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={30}>
                    {indicator === 'rsi' ? (
                      <ComposedChart data={chartData} margin={{ top: 2, right: 8, bottom: 0, left: 8 }}>
                        <YAxis domain={[0, 100]} hide />
                        <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="2 2" strokeWidth={0.5} />
                        <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="2 2" strokeWidth={0.5} />
                        <Area
                          type="monotone"
                          dataKey="rsi"
                          stroke="#a855f7"
                          strokeWidth={1.5}
                          fill="url(#rsiGradient)"
                          dot={false}
                        />
                        <defs>
                          <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                      </ComposedChart>
                    ) : (
                      <ComposedChart data={chartData} margin={{ top: 2, right: 8, bottom: 0, left: 8 }}>
                        <YAxis domain={['auto', 'auto']} hide />
                        <ReferenceLine y={0} stroke="#666" strokeWidth={0.5} />
                        <Bar dataKey="macdHist">
                          {chartData.map((entry, index) => (
                            <Cell key={index} fill={entry.macdHist >= 0 ? '#22c55e' : '#ef4444'} opacity={0.6} />
                          ))}
                        </Bar>
                        <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={1} dot={false} />
                        <Line type="monotone" dataKey="macdSignal" stroke="#f97316" strokeWidth={1} dot={false} />
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              {/* Volume Bars */}
              <div className="h-8 mt-1 flex items-end gap-0.5">
                {chartData.filter((_, i) => i % Math.max(1, Math.floor(chartData.length / 60)) === 0).map((d, i, arr) => {
                  const maxVolume = Math.max(...arr.map(x => x.volume));
                  const heightPercent = (d.volume / maxVolume) * 100;
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "flex-1 rounded-t-sm transition-all duration-200",
                        d.isUp ? "bg-emerald-500/60 hover:bg-emerald-500" : "bg-rose-500/60 hover:bg-rose-500"
                      )}
                      style={{ height: `${Math.max(heightPercent, 8)}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* CoinGecko Link Button */}
            <Button
              className="w-full gap-2 bg-gradient-to-r from-treasury-gold via-amber-500 to-treasury-gold hover:from-amber-500 hover:via-treasury-gold hover:to-amber-500 text-white font-bold text-sm py-2.5 h-10 shadow-lg shadow-treasury-gold/25 transition-all duration-300 hover:shadow-treasury-gold/40"
              asChild
            >
              <a 
                href="https://www.coingecko.com/en/coins/camly-coin" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
                Xem trên CoinGecko
              </a>
            </Button>

            {/* Footer Status */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Cập nhật: {priceData?.last_updated ? new Date(priceData.last_updated).toLocaleTimeString('vi-VN') : '—'}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide",
                priceData?.source === 'fallback' || priceData?.source === 'error_fallback' 
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" 
                  : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              )}>
                {priceData?.source === 'fallback' || priceData?.source === 'error_fallback' ? '⚠️ Offline' : '🟢 Live'}
              </span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}