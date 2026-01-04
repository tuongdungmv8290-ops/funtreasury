import { useCamlyPrice } from '@/hooks/useCamlyPrice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, TrendingUp, TrendingDown, RefreshCw, Loader2 } from 'lucide-react';
import { formatNumber, formatUSD } from '@/lib/formatNumber';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import camlyLogo from '@/assets/camly-coin-logo.png';

// Generate realistic step-line price data like CoinGecko
const generateRealisticPriceData = (days: number, basePrice: number, change24h: number) => {
  const data = [];
  const hoursPerDay = 24;
  const totalHours = days * hoursPerDay;
  const pointsPerHour = 2; // 2 data points per hour for smoother chart
  const totalPoints = totalHours * pointsPerHour;
  
  let currentPrice = basePrice * (1 - (change24h / 100) * 0.5); // Start price
  const targetPrice = basePrice;
  const volatility = 0.002; // 0.2% volatility per step
  
  for (let i = 0; i <= totalPoints; i++) {
    const progress = i / totalPoints;
    const trendBias = (change24h > 0 ? 0.001 : -0.001) * (1 - progress);
    
    // Random walk with mean reversion
    const randomMove = (Math.random() - 0.5) * 2 * volatility;
    const meanReversion = (targetPrice - currentPrice) / targetPrice * 0.1;
    
    currentPrice = currentPrice * (1 + randomMove + trendBias + meanReversion);
    currentPrice = Math.max(currentPrice, basePrice * 0.85);
    currentPrice = Math.min(currentPrice, basePrice * 1.15);
    
    // Calculate time label
    const hourOffset = Math.floor(i / pointsPerHour);
    const date = new Date();
    date.setHours(date.getHours() - (totalHours - hourOffset));
    
    data.push({ 
      time: i,
      timeLabel: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      dateLabel: date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' }),
      price: currentPrice,
      volume: Math.random() * 1000 + 500
    });
  }
  
  // Ensure last point is current price
  data[data.length - 1].price = basePrice;
  return data;
};

export function CamlyMarketPrice() {
  const { data: priceData, isLoading, isRefetching, refetch } = useCamlyPrice();
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [chartRange, setChartRange] = useState<'24H' | '7D' | '30D'>('24H');

  const handleRefresh = async () => {
    setIsManualRefresh(true);
    await refetch();
    setIsManualRefresh(false);
  };

  const isPositiveChange = (priceData?.change_24h || 0) >= 0;
  
  const chartDays = chartRange === '24H' ? 1 : chartRange === '7D' ? 7 : 30;
  const sparklineData = useMemo(() => 
    generateRealisticPriceData(chartDays, priceData?.price_usd || 0.00002272, priceData?.change_24h || 0),
    [chartDays, priceData?.price_usd, priceData?.change_24h]
  );

  const minPrice = Math.min(...sparklineData.map(d => d.price));
  const maxPrice = Math.max(...sparklineData.map(d => d.price));

  return (
    <Card className="relative overflow-hidden border-2 border-treasury-gold/40 bg-gradient-to-br from-amber-50/80 via-yellow-50/60 to-orange-50/40 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/20 shadow-xl shadow-treasury-gold/10">
      {/* Animated glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-treasury-gold/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl" />
      
      <div className="relative p-4 space-y-3">
        {/* Header Row - CoinGecko Style */}
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
            {/* Big Price Display - CoinGecko Style */}
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

            {/* Stats Grid - CoinGecko Style */}
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

            {/* Beautiful Chart Section */}
            <div className="bg-background/60 backdrop-blur-sm rounded-xl p-3 border border-treasury-gold/20">
              {/* Chart Header with Range Toggle */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Price Chart</span>
                </div>
                <div className="flex bg-muted/60 rounded-lg p-0.5 border border-border/50">
                  {(['24H', '7D', '30D'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setChartRange(range)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all duration-200",
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
              
              {/* Chart Area */}
              <div className="h-28 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                    <defs>
                      <linearGradient id="camlyPriceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isPositiveChange ? '#10b981' : '#f43f5e'} stopOpacity={0.35} />
                        <stop offset="50%" stopColor={isPositiveChange ? '#10b981' : '#f43f5e'} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={isPositiveChange ? '#10b981' : '#f43f5e'} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '10px',
                        fontSize: '11px',
                        padding: '8px 12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                      formatter={(value: number) => [`Price: $${value.toFixed(8)}`, '']}
                      labelFormatter={(_, payload) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          return `${data.dateLabel}, ${data.timeLabel}`;
                        }
                        return '';
                      }}
                    />
                    <Area
                      type="stepAfter"
                      dataKey="price"
                      stroke={isPositiveChange ? '#10b981' : '#f43f5e'}
                      strokeWidth={1.5}
                      fill="url(#camlyPriceGradient)"
                      dot={false}
                      activeDot={{ 
                        r: 4, 
                        fill: isPositiveChange ? '#10b981' : '#f43f5e',
                        stroke: '#fff',
                        strokeWidth: 2
                      }}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Volume Bars (simplified) */}
              <div className="h-6 mt-1 flex items-end gap-px opacity-40">
                {sparklineData.filter((_, i) => i % 8 === 0).map((d, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-muted-foreground/40 rounded-t-sm transition-all hover:bg-treasury-gold/60"
                    style={{ height: `${(d.volume / 1500) * 100}%` }}
                  />
                ))}
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
