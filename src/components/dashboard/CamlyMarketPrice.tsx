import { useCamlyPrice } from '@/hooks/useCamlyPrice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, TrendingUp, TrendingDown, RefreshCw, BarChart3, Loader2, Crown } from 'lucide-react';
import { formatNumber, formatUSD } from '@/lib/formatNumber';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import camlyLogo from '@/assets/camly-coin-logo.png';

// Generate mock sparkline data (in real scenario, this would come from API)
const generateSparklineData = (days: number, basePrice: number, change24h: number) => {
  const data = [];
  const volatility = 0.12;
  
  for (let i = days; i >= 0; i--) {
    const dayVariation = (Math.random() - 0.5) * volatility;
    const trendFactor = (days - i) / days;
    const price = basePrice * (1 - change24h / 100 * (1 - trendFactor) + dayVariation * (1 - trendFactor));
    
    data.push({
      day: `Day ${days - i + 1}`,
      price: Math.max(price, basePrice * 0.5),
    });
  }
  
  data[data.length - 1].price = basePrice;
  return data;
};

export function CamlyMarketPrice() {
  const { data: priceData, isLoading, isRefetching, refetch } = useCamlyPrice();
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [chartRange, setChartRange] = useState<7 | 30>(7);

  const handleRefresh = async () => {
    setIsManualRefresh(true);
    await refetch();
    setIsManualRefresh(false);
  };

  const isPositiveChange = (priceData?.change_24h || 0) >= 0;
  
  const sparklineData = generateSparklineData(
    chartRange, 
    priceData?.price_usd || 0.00002272, 
    priceData?.change_24h || 0
  );

  return (
    <Card className="relative overflow-hidden border-0 shadow-2xl">
      {/* Premium Gold Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-yellow-500/15 to-orange-500/20" />
      <div className="absolute inset-0 bg-gradient-to-tr from-treasury-gold/30 via-transparent to-amber-400/20" />
      
      {/* Animated Glow Effects */}
      <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br from-treasury-gold/40 to-amber-500/30 blur-3xl animate-pulse" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-gradient-to-tr from-yellow-500/30 to-treasury-gold/40 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-treasury-gold/10 blur-3xl" />
      
      {/* Gold Border Glow */}
      <div className="absolute inset-0 rounded-xl border-2 border-treasury-gold/50 shadow-[inset_0_0_20px_rgba(218,165,32,0.1)]" />

      <div className="relative p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo with Premium Ring */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-treasury-gold via-amber-400 to-yellow-500 animate-spin-slow opacity-75 blur-sm" style={{ animationDuration: '8s' }} />
              <div className="relative w-14 h-14 rounded-full overflow-hidden ring-3 ring-treasury-gold/60 shadow-xl">
                <img 
                  src={camlyLogo} 
                  alt="CAMLY Coin" 
                  className="w-full h-full object-cover"
                />
              </div>
              <Crown className="absolute -top-2 -right-2 w-5 h-5 text-treasury-gold drop-shadow-lg" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-treasury-gold via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                CAMLY
              </h3>
              <p className="text-xs text-muted-foreground font-medium">Giá Thị Trường Realtime</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-treasury-gold/10 hover:bg-treasury-gold/20 text-treasury-gold border border-treasury-gold/30"
            onClick={handleRefresh}
            disabled={isRefetching || isManualRefresh}
          >
            {(isRefetching || isManualRefresh) ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-14 w-48 bg-treasury-gold/10" />
            <Skeleton className="h-8 w-32 bg-treasury-gold/10" />
            <Skeleton className="h-24 w-full bg-treasury-gold/10" />
          </div>
        ) : (
          <>
            {/* Main Price Display */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Giá USD</p>
                <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-treasury-gold via-amber-400 to-yellow-500 bg-clip-text text-transparent tracking-tight drop-shadow-sm">
                  ${priceData?.price_usd.toFixed(8) || '0.00000000'}
                </p>
              </div>
              
              {/* 24h Change Badge - Premium Style */}
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-base shadow-lg",
                isPositiveChange 
                  ? "bg-gradient-to-r from-emerald-500/20 to-green-500/30 text-emerald-400 border border-emerald-500/30" 
                  : "bg-gradient-to-r from-red-500/20 to-rose-500/30 text-red-400 border border-red-500/30"
              )}>
                {isPositiveChange ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <span>{isPositiveChange ? '+' : ''}{formatNumber(priceData?.change_24h || 0, { minDecimals: 2, maxDecimals: 2 })}%</span>
                <span className="text-xs opacity-70">24h</span>
              </div>
            </div>

            {/* Stats Row - Premium Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 backdrop-blur-sm rounded-xl p-3 border border-treasury-gold/20">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Volume 24h</p>
                <p className="text-lg font-bold text-foreground">
                  {priceData?.volume_24h && priceData.volume_24h > 0 
                    ? formatUSD(priceData.volume_24h)
                    : '—'
                  }
                </p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-xl p-3 border border-treasury-gold/20">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Market Cap</p>
                <p className="text-lg font-bold text-foreground">
                  {priceData?.market_cap && priceData.market_cap > 0 
                    ? formatUSD(priceData.market_cap)
                    : '—'
                  }
                </p>
              </div>
            </div>

            {/* Premium Sparkline Chart */}
            <div className="bg-background/40 backdrop-blur-sm rounded-xl p-4 border border-treasury-gold/20">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-semibold flex items-center gap-2 uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4 text-treasury-gold" />
                  Biểu đồ giá
                </p>
                <div className="flex items-center bg-background/80 border border-treasury-gold/30 rounded-lg p-0.5">
                  <button
                    onClick={() => setChartRange(7)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                      chartRange === 7
                        ? "bg-gradient-to-r from-treasury-gold to-amber-500 text-white shadow-lg"
                        : "text-muted-foreground hover:text-treasury-gold"
                    )}
                  >
                    7D
                  </button>
                  <button
                    onClick={() => setChartRange(30)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                      chartRange === 30
                        ? "bg-gradient-to-r from-treasury-gold to-amber-500 text-white shadow-lg"
                        : "text-muted-foreground hover:text-treasury-gold"
                    )}
                  >
                    30D
                  </button>
                </div>
              </div>
              
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop 
                          offset="5%" 
                          stopColor={isPositiveChange ? '#10b981' : '#ef4444'} 
                          stopOpacity={0.4}
                        />
                        <stop 
                          offset="95%" 
                          stopColor={isPositiveChange ? '#10b981' : '#ef4444'} 
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--treasury-gold) / 0.3)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        padding: '8px 12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                      }}
                      formatter={(value: number) => [`$${value.toFixed(8)}`, 'Giá']}
                      labelFormatter={(label) => label}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isPositiveChange ? '#10b981' : '#ef4444'}
                      strokeWidth={2.5}
                      fill="url(#priceGradient)"
                      dot={false}
                      activeDot={{ 
                        r: 6, 
                        fill: isPositiveChange ? '#10b981' : '#ef4444',
                        stroke: '#fff',
                        strokeWidth: 2
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CoinMarketCap Link - Premium Button */}
            <Button
              className="w-full gap-2 bg-gradient-to-r from-treasury-gold via-amber-500 to-yellow-500 hover:from-amber-500 hover:via-yellow-500 hover:to-treasury-gold text-white font-bold text-base py-6 shadow-lg hover:shadow-xl transition-all"
              asChild
            >
              <a 
                href="https://coinmarketcap.com/currencies/camly-coin/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-5 h-5" />
                Xem chi tiết trên CoinMarketCap
              </a>
            </Button>

            {/* Status Footer */}
            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-muted-foreground">
                Cập nhật: {priceData?.last_updated 
                  ? new Date(priceData.last_updated).toLocaleTimeString('vi-VN')
                  : '—'
                }
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-[10px]">Auto refresh: 1 phút</span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                  priceData?.source === 'fallback' || priceData?.source === 'error_fallback' 
                    ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" 
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                )}>
                  {priceData?.source === 'fallback' || priceData?.source === 'error_fallback' 
                    ? '⚡ Offline' 
                    : '🔴 Live'
                  }
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
