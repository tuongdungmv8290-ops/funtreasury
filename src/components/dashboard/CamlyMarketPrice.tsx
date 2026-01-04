import { useCamlyPrice } from '@/hooks/useCamlyPrice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, TrendingUp, TrendingDown, RefreshCw, DollarSign, BarChart3, Loader2 } from 'lucide-react';
import { formatNumber, formatUSD } from '@/lib/formatNumber';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function CamlyMarketPrice() {
  const { data: priceData, isLoading, isRefetching, refetch } = useCamlyPrice();
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsManualRefresh(true);
    await refetch();
    setIsManualRefresh(false);
  };

  const isPositiveChange = (priceData?.change_24h || 0) >= 0;

  return (
    <Card className="relative overflow-hidden border-2 border-treasury-gold/40 bg-gradient-to-br from-treasury-gold/5 via-background to-treasury-gold/10 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Decorative glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-treasury-gold/20 blur-3xl" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-treasury-gold/15 blur-2xl" />
      
      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-treasury-gold to-treasury-gold-dark flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
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
            <Skeleton className="h-6 w-28" />
          </div>
        ) : (
          <>
            {/* Main Price */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Giá USD</p>
              <p className="text-3xl md:text-4xl font-bold gold-text tracking-tight">
                ${priceData?.price_usd.toFixed(8) || '0.00000000'}
              </p>
            </div>

            {/* 24h Change */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  {isPositiveChange ? (
                    <TrendingUp className="w-3 h-3 text-inflow" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-outflow" />
                  )}
                  Thay đổi 24h
                </p>
                <p className={cn(
                  "text-lg font-bold",
                  isPositiveChange ? "text-inflow" : "text-outflow"
                )}>
                  {isPositiveChange ? '+' : ''}{formatNumber(priceData?.change_24h || 0, { minDecimals: 2, maxDecimals: 2 })}%
                </p>
              </div>

              {/* Volume 24h */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Volume 24h
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {priceData?.volume_24h && priceData.volume_24h > 0 
                    ? formatUSD(priceData.volume_24h)
                    : '—'
                  }
                </p>
              </div>
            </div>

            {/* Market Cap (if available) */}
            {priceData?.market_cap && priceData.market_cap > 0 && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground font-medium mb-1">Market Cap</p>
                <p className="text-base font-semibold text-foreground">
                  {formatUSD(priceData.market_cap)}
                </p>
              </div>
            )}

            {/* CoinMarketCap Link */}
            <div className="pt-3">
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
