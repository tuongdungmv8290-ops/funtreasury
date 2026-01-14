import { useMemo } from "react";
import { CryptoPrice } from "@/hooks/useCryptoPrices";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";

interface DeFiStatsCardsProps {
  data: CryptoPrice[];
  isLoading?: boolean;
}

function formatCompact(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toFixed(2)}`;
}

export function DeFiStatsCards({ data, isLoading }: DeFiStatsCardsProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalMarketCap: 0,
        totalVolume24h: 0,
        topGainer: null as CryptoPrice | null,
      };
    }

    const totalMarketCap = data.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);
    const totalVolume24h = data.reduce((sum, coin) => sum + (coin.total_volume || 0), 0);
    
    // Find top gainer (highest 24h % change)
    const topGainer = data.reduce((best, coin) => {
      const coinChange = coin.price_change_percentage_24h ?? 0;
      const bestChange = best?.price_change_percentage_24h ?? 0;
      if (!best || coinChange > bestChange) {
        return coin;
      }
      return best;
    }, null as CryptoPrice | null);

    return { totalMarketCap, totalVolume24h, topGainer };
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* DeFi Market Cap */}
      <Card className="bg-gradient-to-br from-primary/10 via-card/80 to-card border-primary/30 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t('defi.marketCap')}</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatCompact(stats.totalMarketCap)}
          </div>
        </CardContent>
      </Card>

      {/* 24h Volume */}
      <Card className="bg-gradient-to-br from-inflow/10 via-card/80 to-card border-inflow/30 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BarChart3 className="w-4 h-4 text-inflow" />
            <span className="text-sm font-medium">{t('defi.volume24h')}</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatCompact(stats.totalVolume24h)}
          </div>
        </CardContent>
      </Card>

      {/* Top Gainer */}
      <Card className="bg-gradient-to-br from-accent/10 via-card/80 to-card border-accent/30 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4 text-inflow" />
            <span className="text-sm font-medium">{t('defi.topGainer')}</span>
          </div>
          {stats.topGainer ? (
            <div className="flex items-center gap-2">
              <img 
                src={stats.topGainer.image} 
                alt={stats.topGainer.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-lg font-bold text-foreground uppercase">
                {stats.topGainer.symbol}
              </span>
              <span className="text-lg font-bold text-inflow">
                +{(stats.topGainer.price_change_percentage_24h ?? 0).toFixed(2)}%
              </span>
            </div>
          ) : (
            <div className="text-lg font-bold text-muted-foreground">--</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
