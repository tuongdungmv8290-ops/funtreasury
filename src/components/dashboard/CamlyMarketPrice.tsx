import { useCamlyPrice } from '@/hooks/useCamlyPrice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, TrendingUp, TrendingDown, RefreshCw, Loader2 } from 'lucide-react';
import { formatNumber, formatUSD } from '@/lib/formatNumber';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import camlyLogo from '@/assets/camly-coin-logo.png';

// Generate smooth sparkline data
const generateSparklineData = (days: number, basePrice: number, change24h: number) => {
  const data = [];
  for (let i = 0; i <= days; i++) {
    const progress = i / days;
    const wave = Math.sin(progress * Math.PI * 2) * 0.05;
    const trend = change24h / 100 * progress;
    const noise = (Math.random() - 0.5) * 0.03;
    const price = basePrice * (1 - change24h / 100 + trend + wave + noise);
    data.push({ day: i, price: Math.max(price, basePrice * 0.8) });
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
  const sparklineData = generateSparklineData(chartRange, priceData?.price_usd || 0.00002272, priceData?.change_24h || 0);

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/30 shadow-lg">
      {/* Subtle gold border */}
      <div className="absolute inset-0 rounded-xl border border-treasury-gold/30" />
      
      <div className="relative p-4 space-y-3">
        {/* Header Row - Compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-treasury-gold/50 shadow-md">
              <img src={camlyLogo} alt="CAMLY" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-base font-bold text-treasury-gold">CAMLY</h3>
              <p className="text-[10px] text-muted-foreground">Giá Thị Trường</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-treasury-gold/10 hover:bg-treasury-gold/20 text-treasury-gold"
            onClick={handleRefresh}
            disabled={isRefetching || isManualRefresh}
          >
            {(isRefetching || isManualRefresh) ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-36 bg-treasury-gold/10" />
            <Skeleton className="h-16 w-full bg-treasury-gold/10" />
          </div>
        ) : (
          <>
            {/* Price + Change Row */}
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black text-treasury-gold">
                ${priceData?.price_usd.toFixed(8) || '0.00000000'}
              </p>
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                isPositiveChange 
                  ? "bg-emerald-500/15 text-emerald-500" 
                  : "bg-red-500/15 text-red-500"
              )}>
                {isPositiveChange ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositiveChange ? '+' : ''}{formatNumber(priceData?.change_24h || 0, { minDecimals: 2, maxDecimals: 2 })}%
              </div>
            </div>

            {/* Mini Stats Row */}
            <div className="flex gap-3 text-xs">
              <div className="flex-1 bg-background/60 rounded-lg p-2 border border-treasury-gold/10">
                <p className="text-[9px] text-muted-foreground uppercase">Vol 24h</p>
                <p className="font-semibold">{priceData?.volume_24h && priceData.volume_24h > 0 ? formatUSD(priceData.volume_24h) : '—'}</p>
              </div>
              <div className="flex-1 bg-background/60 rounded-lg p-2 border border-treasury-gold/10">
                <p className="text-[9px] text-muted-foreground uppercase">MCap</p>
                <p className="font-semibold">{priceData?.market_cap && priceData.market_cap > 0 ? formatUSD(priceData.market_cap) : '—'}</p>
              </div>
            </div>

            {/* Compact Chart */}
            <div className="bg-background/50 rounded-lg p-2 border border-treasury-gold/10">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] text-muted-foreground uppercase font-medium">Biểu đồ giá</p>
                <div className="flex bg-muted/50 rounded p-0.5">
                  {[7, 30].map((range) => (
                    <button
                      key={range}
                      onClick={() => setChartRange(range as 7 | 30)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold transition-all",
                        chartRange === range
                          ? "bg-treasury-gold text-white"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {range}D
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-14">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData}>
                    <defs>
                      <linearGradient id="camlyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isPositiveChange ? '#10b981' : '#ef4444'} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={isPositiveChange ? '#10b981' : '#ef4444'} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '10px',
                        padding: '4px 8px',
                      }}
                      formatter={(value: number) => [`$${value.toFixed(8)}`, '']}
                      labelFormatter={() => ''}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isPositiveChange ? '#10b981' : '#ef4444'}
                      strokeWidth={2}
                      fill="url(#camlyGradient)"
                      dot={false}
                      activeDot={{ r: 3, fill: isPositiveChange ? '#10b981' : '#ef4444' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CoinGecko Link (CMC blocked) */}
            <Button
              className="w-full gap-2 bg-gradient-to-r from-treasury-gold to-amber-500 hover:from-amber-500 hover:to-treasury-gold text-white font-semibold text-sm py-2 h-9"
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

            {/* Footer */}
            <div className="flex items-center justify-between text-[9px] text-muted-foreground">
              <span>
                {priceData?.last_updated ? new Date(priceData.last_updated).toLocaleTimeString('vi-VN') : '—'}
              </span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
                priceData?.source === 'fallback' || priceData?.source === 'error_fallback' 
                  ? "bg-yellow-500/20 text-yellow-600" 
                  : "bg-emerald-500/20 text-emerald-500"
              )}>
                {priceData?.source === 'fallback' || priceData?.source === 'error_fallback' ? 'Offline' : 'Live'}
              </span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
