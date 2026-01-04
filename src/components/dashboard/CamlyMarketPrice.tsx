import { useCamlyPrice } from '@/hooks/useCamlyPrice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, TrendingUp, TrendingDown, RefreshCw, BarChart3, Loader2 } from 'lucide-react';
import { formatNumber, formatUSD } from '@/lib/formatNumber';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import camlyLogo from '@/assets/camly-coin-logo.png';

// Generate mock sparkline data (in real scenario, this would come from API)
const generateSparklineData = (days: number, basePrice: number, change24h: number) => {
  const data = [];
  const volatility = 0.15; // 15% volatility range
  
  for (let i = days; i >= 0; i--) {
    // Create realistic price movement
    const dayVariation = (Math.random() - 0.5) * volatility;
    const trendFactor = (days - i) / days; // Trend towards current price
    const price = basePrice * (1 - change24h / 100 * (1 - trendFactor) + dayVariation * (1 - trendFactor));
    
    data.push({
      day: i,
      price: Math.max(price, basePrice * 0.5), // Prevent negative prices
    });
  }
  
  // Last point should be current price
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
  
  // Generate sparkline data based on current price
  const sparklineData = generateSparklineData(
    chartRange, 
    priceData?.price_usd || 0.00002272, 
    priceData?.change_24h || 0
  );

  return (
    <Card className="relative overflow-hidden border-2 border-treasury-gold/40 bg-gradient-to-br from-treasury-gold/5 via-background to-treasury-gold/10 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Decorative glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-treasury-gold/20 blur-3xl" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-treasury-gold/15 blur-2xl" />
      
      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg ring-2 ring-treasury-gold/30">
              <img 
                src={camlyLogo} 
                alt="CAMLY Coin" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="gold-text">Giá Thị Trường CAMLY</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-treasury-gold hover:bg-treasury-gold/10"
            onClick={handleRefresh}
            disabled={isRefetching || isManualRefresh}
          >
            {(isRefetching || isManualRefresh) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            {/* Main Price Row */}
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Giá USD</p>
                <p className="text-3xl md:text-4xl font-bold gold-text tracking-tight">
                  ${priceData?.price_usd.toFixed(8) || '0.00000000'}
                </p>
              </div>
              
              {/* 24h Change Badge */}
              <div className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-sm",
                isPositiveChange 
                  ? "bg-inflow/20 text-inflow" 
                  : "bg-outflow/20 text-outflow"
              )}>
                {isPositiveChange ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {isPositiveChange ? '+' : ''}{formatNumber(priceData?.change_24h || 0, { minDecimals: 2, maxDecimals: 2 })}%
              </div>
            </div>

            {/* Sparkline Chart */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Biểu đồ giá
                </p>
                <div className="flex items-center bg-secondary/80 border border-border/60 rounded-lg p-0.5">
                  <button
                    onClick={() => setChartRange(7)}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-semibold transition-all",
                      chartRange === 7
                        ? "bg-treasury-gold text-white shadow"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    7D
                  </button>
                  <button
                    onClick={() => setChartRange(30)}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-semibold transition-all",
                      chartRange === 30
                        ? "bg-treasury-gold text-white shadow"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    30D
                  </button>
                </div>
              </div>
              
              <div className="h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px',
                        padding: '6px 10px',
                      }}
                      formatter={(value: number) => [`$${value.toFixed(8)}`, 'Giá']}
                      labelFormatter={() => ''}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={isPositiveChange ? 'hsl(var(--inflow))' : 'hsl(var(--outflow))'}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: isPositiveChange ? 'hsl(var(--inflow))' : 'hsl(var(--outflow))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-border/50">
              {/* Volume 24h */}
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground font-medium">Volume 24h</p>
                <p className="text-sm font-semibold text-foreground">
                  {priceData?.volume_24h && priceData.volume_24h > 0 
                    ? formatUSD(priceData.volume_24h)
                    : '—'
                  }
                </p>
              </div>

              {/* Market Cap (if available) */}
              {priceData?.market_cap && priceData.market_cap > 0 && (
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground font-medium">Market Cap</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatUSD(priceData.market_cap)}
                  </p>
                </div>
              )}
            </div>

            {/* CoinMarketCap Link */}
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full gap-2 border-treasury-gold/50 text-treasury-gold hover:bg-treasury-gold/10 hover:text-treasury-gold font-semibold"
                asChild
              >
                <a 
                  href="https://coinmarketcap.com/currencies/camly-coin/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Xem chi tiết trên CMC
                </a>
              </Button>
            </div>

            {/* Last updated & Source */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
              <span>
                Cập nhật: {priceData?.last_updated 
                  ? new Date(priceData.last_updated).toLocaleTimeString('vi-VN')
                  : '—'
                }
              </span>
              <span className="bg-secondary/80 px-2 py-0.5 rounded text-[9px] uppercase">
                {priceData?.source === 'fallback' || priceData?.source === 'error_fallback' 
                  ? 'Offline' 
                  : 'Live'
                }
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
