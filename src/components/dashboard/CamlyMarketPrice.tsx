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

const generateCandlestickData = (days: number, basePrice: number, change24h: number) => {
  const data = [];
  const totalCandles = days <= 1 ? 48 : days <= 7 ? 84 : 120;
  
  const startPrice = basePrice * (1 - (change24h / 100));
  let currentPrice = startPrice;
  let momentum = 0;
  const baseVolatility = 0.008;
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
    
    const trendPull = (basePrice - currentPrice) * 0.02;
    const volatility = baseVolatility * (1 + Math.abs(momentum) * 4);
    
    const open = currentPrice;
    const move = (momentum * volatility) + trendPull;
    const close = open * (1 + move);
    
    const wickSize = volatility * random3 * 1.5;
    const high = Math.max(open, close) * (1 + wickSize);
    const low = Math.min(open, close) * (1 - wickSize);
    
    currentPrice = close;
    currentPrice = Math.max(basePrice * 0.85, Math.min(basePrice * 1.15, currentPrice));
    
    const hourOffset = Math.floor((i / totalCandles) * days * 24);
    const date = new Date();
    date.setHours(date.getHours() - (days * 24 - hourOffset));
    
    const volumeSpike = random1 > 0.85 ? 3.5 : 1;
    const volume = (500 + random2 * 1500) * volumeSpike;
    
    closePrices.push(close);
    
    data.push({ 
      time: i,
      timeLabel: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      dateLabel: date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' }),
      fullDateTime: date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      open, high, low, close,
      price: close,
      volume,
      isUp: close >= open,
    });
  }
  
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

const CustomCandleTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  
  return (
    <div className="bg-card/95 backdrop-blur-md border-2 border-treasury-gold rounded-xl p-3 shadow-2xl shadow-treasury-gold/20">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-treasury-gold/30">
        <span className="text-[10px] text-muted-foreground">📅</span>
        <span className="text-xs font-bold text-treasury-gold">{data.fullDateTime}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
        <div className="flex justify-between"><span className="text-muted-foreground">Open:</span><span className="font-mono font-semibold">${data.open?.toFixed(8)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">High:</span><span className="font-mono font-semibold text-emerald-500">${data.high?.toFixed(8)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Low:</span><span className="font-mono font-semibold text-rose-500">${data.low?.toFixed(8)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Close:</span><span className={cn("font-mono font-bold", data.isUp ? "text-emerald-500" : "text-rose-500")}>${data.close?.toFixed(8)}</span></div>
      </div>
      <div className="mt-2 pt-2 border-t border-treasury-gold/30 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Vol:</span>
        <span className="text-[11px] font-semibold">{formatNumber(data.volume, { compact: true })}</span>
        <span className={cn("ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded", data.isUp ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500")}>
          {data.isUp ? '▲ BUY' : '▼ SELL'}
        </span>
      </div>
    </div>
  );
};

export function CamlyMarketPrice() {
  const { data: priceData, isLoading, isRefetching, refetch } = useCamlyPrice();
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [chartRange, setChartRange] = useState<'24H' | '7D' | '30D'>('24H');
  const [chartType, setChartType] = useState<ChartType>('candle');
  const [indicator, setIndicator] = useState<IndicatorType>('none');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleRefresh = async () => {
    setIsManualRefresh(true);
    await refetch();
    setIsManualRefresh(false);
  };

  const isPositiveChange = (priceData?.change_24h || 0) >= 0;
  const chartDays = chartRange === '24H' ? 1 : chartRange === '7D' ? 7 : 30;
  const chartData = useMemo(() => 
    generateCandlestickData(chartDays, priceData?.price_usd || 0.00002247, priceData?.change_24h || 0),
    [chartDays, priceData?.price_usd, priceData?.change_24h]
  );

  const minPrice = Math.min(...chartData.map(d => d.low));
  const maxPrice = Math.max(...chartData.map(d => d.high));
  const priceRange = maxPrice - minPrice;

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50/90 via-yellow-50/70 to-orange-50/50 dark:from-amber-950/50 dark:via-yellow-950/40 dark:to-orange-950/30 shadow-2xl">
      <div className="absolute inset-0 rounded-xl border-2 border-treasury-gold/50 shadow-[inset_0_0_30px_rgba(201,162,39,0.1)]" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-treasury-gold/25 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl" />
      
      <div className="relative p-4 space-y-3">
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
            <div className="flex items-baseline gap-3 flex-wrap">
              <p className="text-4xl font-black bg-gradient-to-r from-treasury-gold via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-sm">
                ${priceData?.price_usd?.toFixed(8) || '0.00002247'}
              </p>
              <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-md", isPositiveChange ? "bg-gradient-to-r from-emerald-500/25 to-emerald-400/15 text-emerald-500 border border-emerald-500/30" : "bg-gradient-to-r from-rose-500/25 to-rose-400/15 text-rose-500 border border-rose-500/30")}>
                {isPositiveChange ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isPositiveChange ? '+' : ''}{formatNumber(priceData?.change_24h || 0, { minDecimals: 2, maxDecimals: 2 })}%
                <span className="text-[10px] font-semibold opacity-70">(24h)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-mono text-[10px]">${minPrice.toFixed(8)}</span>
              <div className="flex-1 h-2 bg-gradient-to-r from-rose-500 via-treasury-gold to-emerald-500 rounded-full relative shadow-inner">
                <div className="absolute w-3 h-3 bg-white border-2 border-treasury-gold rounded-full top-1/2 -translate-y-1/2 shadow-lg shadow-treasury-gold/50 transition-all duration-500" style={{ left: `${Math.max(5, Math.min(95, ((priceData?.price_usd || 0) - minPrice) / priceRange * 100))}%` }} />
              </div>
              <span className="text-muted-foreground font-mono text-[10px]">${maxPrice.toFixed(8)}</span>
            </div>

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

            <div className="bg-gradient-to-br from-background/70 to-background/50 backdrop-blur-sm rounded-xl p-3 border border-treasury-gold/30 shadow-lg">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-treasury-gold/10 rounded-lg p-0.5 border border-treasury-gold/30">
                  <button onClick={() => setChartType('line')} className={cn("p-1.5 rounded-md transition-all duration-200", chartType === 'line' ? "bg-gradient-to-r from-treasury-gold to-amber-500 text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-treasury-gold/20")} title="Line"><LineChart className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setChartType('candle')} className={cn("p-1.5 rounded-md transition-all duration-200", chartType === 'candle' ? "bg-gradient-to-r from-treasury-gold to-amber-500 text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-treasury-gold/20")} title="Candle"><CandlestickChart className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex items-center gap-0.5 bg-treasury-gold/10 rounded-lg p-0.5 border border-treasury-gold/30">
                  {(['none', 'boll', 'macd', 'rsi'] as const).map((ind) => (
                    <button key={ind} onClick={() => setIndicator(ind)} className={cn("px-2 py-1 rounded-md text-[9px] font-bold transition-all duration-200 uppercase", indicator === ind ? "bg-gradient-to-r from-treasury-gold to-amber-500 text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-treasury-gold/20")}>{ind === 'none' ? '—' : ind}</button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex bg-treasury-gold/10 rounded-lg p-0.5 border border-treasury-gold/30">
                    {(['24H', '7D', '30D'] as const).map((range) => (
                      <button key={range} onClick={() => setChartRange(range)} className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold transition-all duration-200", chartRange === range ? "bg-gradient-to-r from-treasury-gold to-amber-500 text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-treasury-gold/20")}>{range}</button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setIsFullscreen(true)} 
                    className="p-1.5 rounded-md bg-treasury-gold/10 border border-treasury-gold/30 text-treasury-gold hover:bg-treasury-gold/20 transition-all duration-200"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="h-36 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                      <defs>
                        <linearGradient id="camlyPriceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={isPositiveChange ? '#10b981' : '#f43f5e'} stopOpacity={0.6} />
                          <stop offset="30%" stopColor="#C9A227" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#C9A227" stopOpacity={0.02} />
                        </linearGradient>
                        <filter id="lineGlow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                      </defs>
                      <YAxis domain={['dataMin', 'dataMax']} hide padding={{ top: 15, bottom: 15 }} />
                      <Tooltip content={<CustomCandleTooltip />} />
                      {indicator === 'boll' && (<><Area type="monotone" dataKey="bollUpper" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 2" fill="none" dot={false} /><Area type="monotone" dataKey="bollMid" stroke="#a855f7" strokeWidth={1.5} fill="none" dot={false} /><Area type="monotone" dataKey="bollLower" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 2" fill="none" dot={false} /></>)}
                      <Area type="monotone" dataKey="price" stroke={isPositiveChange ? '#22c55e' : '#ef4444'} strokeWidth={2.5} fill="url(#camlyPriceGrad)" dot={false} activeDot={{ r: 6, fill: '#C9A227', stroke: '#fff', strokeWidth: 3 }} animationDuration={1000} style={{ filter: 'url(#lineGlow)' }} />
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                      <defs>
                        <linearGradient id="candleGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" /><stop offset="100%" stopColor="#16a34a" /></linearGradient>
                        <linearGradient id="candleRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#dc2626" /></linearGradient>
                      </defs>
                      <YAxis domain={[minPrice * 0.998, maxPrice * 1.002]} hide />
                      <Tooltip content={<CustomCandleTooltip />} />
                      {indicator === 'boll' && (<><Line type="monotone" dataKey="bollUpper" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 2" dot={false} /><Line type="monotone" dataKey="bollMid" stroke="#a855f7" strokeWidth={1.5} dot={false} /><Line type="monotone" dataKey="bollLower" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 2" dot={false} /></>)}
                      <Bar dataKey="close" shape={() => null} />
                      {chartData.map((entry, index) => {
                        const barWidth = 100 / chartData.length;
                        const x = index * barWidth;
                        const yRange = maxPrice * 1.002 - minPrice * 0.998;
                        const toY = (price: number) => ((maxPrice * 1.002 - price) / yRange) * 100;
                        return (
                          <g key={index}>
                            <line x1={`${x + barWidth / 2}%`} y1={`${toY(entry.high)}%`} x2={`${x + barWidth / 2}%`} y2={`${toY(entry.low)}%`} stroke={entry.isUp ? '#22c55e' : '#ef4444'} strokeWidth={1} opacity={0.8} />
                            <rect x={`${x + barWidth * 0.1}%`} y={`${toY(Math.max(entry.open, entry.close))}%`} width={`${barWidth * 0.8}%`} height={`${Math.max(Math.abs(toY(entry.open) - toY(entry.close)), 0.3)}%`} fill={entry.isUp ? 'url(#candleGreen)' : 'url(#candleRed)'} rx={1} />
                          </g>
                        );
                      })}
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>

              {indicator !== 'none' && indicator !== 'boll' && (
                <div className="h-14 mt-2 border-t border-treasury-gold/30 pt-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Activity className="w-3 h-3 text-treasury-gold" />
                    <span className="text-[9px] font-bold text-treasury-gold uppercase">{indicator}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={35}>
                    {indicator === 'rsi' ? (
                      <ComposedChart data={chartData} margin={{ top: 2, right: 10, bottom: 0, left: 10 }}>
                        <defs><linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} /><stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} /></linearGradient></defs>
                        <YAxis domain={[0, 100]} hide />
                        <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={0.8} />
                        <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={0.8} />
                        <Area type="monotone" dataKey="rsi" stroke="#a855f7" strokeWidth={1.5} fill="url(#rsiGrad)" dot={false} />
                      </ComposedChart>
                    ) : (
                      <ComposedChart data={chartData} margin={{ top: 2, right: 10, bottom: 0, left: 10 }}>
                        <YAxis domain={['auto', 'auto']} hide />
                        <ReferenceLine y={0} stroke="#666" strokeWidth={0.5} />
                        <Bar dataKey="macdHist">{chartData.map((entry, index) => (<Cell key={index} fill={entry.macdHist >= 0 ? '#22c55e' : '#ef4444'} opacity={0.7} />))}</Bar>
                        <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="macdSignal" stroke="#f97316" strokeWidth={1.5} dot={false} />
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              <div className="h-10 mt-2 flex items-end gap-0.5 border-t border-treasury-gold/20 pt-2">
                {chartData.filter((_, i) => i % Math.max(1, Math.floor(chartData.length / 50)) === 0).map((d, i, arr) => {
                  const maxVolume = Math.max(...arr.map(x => x.volume));
                  const heightPercent = (d.volume / maxVolume) * 100;
                  return (<div key={i} className={cn("flex-1 rounded-t transition-all duration-300", d.isUp ? "bg-emerald-500/70 hover:bg-emerald-500" : "bg-rose-500/70 hover:bg-rose-500")} style={{ height: `${Math.max(heightPercent, 10)}%` }} />);
                })}
              </div>
            </div>

            <Button className="w-full gap-2 bg-gradient-to-r from-treasury-gold via-amber-500 to-yellow-500 hover:from-amber-600 hover:via-treasury-gold hover:to-amber-500 text-white font-bold text-sm py-3 h-11 shadow-xl shadow-treasury-gold/30 transition-all duration-300 hover:shadow-treasury-gold/50 hover:scale-[1.02]" asChild>
              <a href="https://www.coingecko.com/en/coins/camly-coin" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />Xem trên CoinGecko<span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[9px] font-bold">LIVE</span>
              </a>
            </Button>

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
                        ${priceData?.price_usd?.toFixed(8) || '0.00002247'}
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
                    {(['24H', '7D', '30D'] as const).map((range) => (
                      <button key={range} onClick={() => setChartRange(range)} className={cn("px-3 py-1.5 rounded-md text-xs font-bold", chartRange === range ? "bg-gradient-to-r from-treasury-gold to-amber-500 text-white shadow-md" : "text-muted-foreground hover:bg-treasury-gold/20")}>{range}</button>
                    ))}
                  </div>
                  <button onClick={() => setIsFullscreen(false)} className="p-2 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"><X className="w-5 h-5" /></button>
                </div>
              </div>
            </DialogHeader>

            {/* Fullscreen Chart Area */}
            <div className="flex-1 p-4">
              <div className="h-full bg-gradient-to-br from-background/80 to-background/60 rounded-xl border border-treasury-gold/30 p-4">
                <ResponsiveContainer width="100%" height={indicator !== 'none' && indicator !== 'boll' ? '75%' : '85%'}>
                  {chartType === 'line' ? (
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <defs>
                        <linearGradient id="camlyPriceGradFull" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={isPositiveChange ? '#10b981' : '#f43f5e'} stopOpacity={0.5} />
                          <stop offset="50%" stopColor="#C9A227" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#C9A227" stopOpacity={0.02} />
                        </linearGradient>
                        <filter id="lineGlowFull"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                      </defs>
                      <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={{ stroke: '#C9A227', strokeOpacity: 0.2 }} interval="preserveStartEnd" />
                      <YAxis domain={['dataMin', 'dataMax']} tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(v) => `$${v.toFixed(8)}`} tickLine={false} axisLine={{ stroke: '#C9A227', strokeOpacity: 0.2 }} width={90} padding={{ top: 20, bottom: 20 }} />
                      <Tooltip content={<CustomCandleTooltip />} />
                      {indicator === 'boll' && (<><Area type="monotone" dataKey="bollUpper" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} /><Area type="monotone" dataKey="bollMid" stroke="#a855f7" strokeWidth={2} fill="none" dot={false} /><Area type="monotone" dataKey="bollLower" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} /></>)}
                      <Area type="monotone" dataKey="price" stroke={isPositiveChange ? '#22c55e' : '#ef4444'} strokeWidth={3} fill="url(#camlyPriceGradFull)" dot={false} activeDot={{ r: 8, fill: '#C9A227', stroke: '#fff', strokeWidth: 3 }} animationDuration={1000} style={{ filter: 'url(#lineGlowFull)' }} />
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <defs>
                        <linearGradient id="candleGreenFull" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" /><stop offset="100%" stopColor="#16a34a" /></linearGradient>
                        <linearGradient id="candleRedFull" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#dc2626" /></linearGradient>
                      </defs>
                      <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={{ stroke: '#C9A227', strokeOpacity: 0.2 }} interval="preserveStartEnd" />
                      <YAxis domain={[minPrice * 0.997, maxPrice * 1.003]} tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(v) => `$${v.toFixed(8)}`} tickLine={false} axisLine={{ stroke: '#C9A227', strokeOpacity: 0.2 }} width={90} />
                      <Tooltip content={<CustomCandleTooltip />} />
                      {indicator === 'boll' && (<><Line type="monotone" dataKey="bollUpper" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="5 3" dot={false} /><Line type="monotone" dataKey="bollMid" stroke="#a855f7" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="bollLower" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="5 3" dot={false} /></>)}
                      <Bar dataKey="close" shape={() => null} />
                      {chartData.map((entry, index) => {
                        const barWidth = 100 / chartData.length;
                        const x = index * barWidth;
                        const yRange = maxPrice * 1.003 - minPrice * 0.997;
                        const toY = (price: number) => ((maxPrice * 1.003 - price) / yRange) * 100;
                        return (
                          <g key={index}>
                            <line x1={`${x + barWidth / 2}%`} y1={`${toY(entry.high)}%`} x2={`${x + barWidth / 2}%`} y2={`${toY(entry.low)}%`} stroke={entry.isUp ? '#22c55e' : '#ef4444'} strokeWidth={1.5} opacity={0.9} />
                            <rect x={`${x + barWidth * 0.15}%`} y={`${toY(Math.max(entry.open, entry.close))}%`} width={`${barWidth * 0.7}%`} height={`${Math.max(Math.abs(toY(entry.open) - toY(entry.close)), 0.2)}%`} fill={entry.isUp ? 'url(#candleGreenFull)' : 'url(#candleRedFull)'} rx={2} />
                          </g>
                        );
                      })}
                    </ComposedChart>
                  )}
                </ResponsiveContainer>

                {/* Fullscreen Indicator Panel */}
                {indicator !== 'none' && indicator !== 'boll' && (
                  <div className="h-[15%] border-t border-treasury-gold/30 pt-3 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-treasury-gold" />
                      <span className="text-sm font-bold text-treasury-gold uppercase">{indicator}</span>
                      {indicator === 'rsi' && <span className="text-xs text-muted-foreground">(70=Overbought, 30=Oversold)</span>}
                      {indicator === 'macd' && <span className="text-xs text-muted-foreground">(Blue=MACD, Orange=Signal)</span>}
                    </div>
                    <ResponsiveContainer width="100%" height="70%">
                      {indicator === 'rsi' ? (
                        <ComposedChart data={chartData} margin={{ top: 5, right: 30, bottom: 5, left: 30 }}>
                          <defs><linearGradient id="rsiGradFull" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} /><stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} /></linearGradient></defs>
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} width={30} />
                          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} label={{ value: '70', position: 'right', fontSize: 10, fill: '#ef4444' }} />
                          <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1} label={{ value: '30', position: 'right', fontSize: 10, fill: '#22c55e' }} />
                          <ReferenceLine y={50} stroke="#666" strokeDasharray="2 4" strokeWidth={0.5} />
                          <Area type="monotone" dataKey="rsi" stroke="#a855f7" strokeWidth={2} fill="url(#rsiGradFull)" dot={false} />
                        </ComposedChart>
                      ) : (
                        <ComposedChart data={chartData} margin={{ top: 5, right: 30, bottom: 5, left: 30 }}>
                          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} width={30} />
                          <ReferenceLine y={0} stroke="#666" strokeWidth={1} />
                          <Bar dataKey="macdHist">{chartData.map((entry, index) => (<Cell key={index} fill={entry.macdHist >= 0 ? '#22c55e' : '#ef4444'} opacity={0.7} />))}</Bar>
                          <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="macdSignal" stroke="#f97316" strokeWidth={2} dot={false} />
                        </ComposedChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Fullscreen Volume */}
                <div className="h-12 mt-3 flex items-end gap-0.5 border-t border-treasury-gold/20 pt-2">
                  {chartData.map((d, i, arr) => {
                    const maxVolume = Math.max(...arr.map(x => x.volume));
                    const heightPercent = (d.volume / maxVolume) * 100;
                    return (<div key={i} className={cn("flex-1 rounded-t transition-all", d.isUp ? "bg-emerald-500/60 hover:bg-emerald-500" : "bg-rose-500/60 hover:bg-rose-500")} style={{ height: `${Math.max(heightPercent, 5)}%` }} />);
                  })}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
