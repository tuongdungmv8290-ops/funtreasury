import { CryptoPrice } from "@/hooks/useCryptoPrices";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import camlyLogo from "@/assets/camly-coin-logo.png";

interface CamlyFeaturedCardProps {
  camlyData?: CryptoPrice;
  isLoading?: boolean;
}

function formatPrice(price: number): string {
  if (price < 0.0001) {
    return `$${price.toFixed(10)}`;
  } else if (price < 0.01) {
    return `$${price.toFixed(8)}`;
  }
  return `$${price.toFixed(6)}`;
}

function formatCompact(value: number): string {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export function CamlyFeaturedCard({ camlyData, isLoading }: CamlyFeaturedCardProps) {
  if (isLoading) {
    return (
      <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-background to-primary/5 shadow-[0_0_40px_rgba(201,162,39,0.2)]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-48" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!camlyData) {
    return null;
  }

  const isPositive = camlyData.price_change_percentage_24h >= 0;

  return (
    <Card className="relative overflow-hidden border-2 border-primary/50 bg-gradient-to-br from-primary/15 via-background to-primary/5 shadow-[0_0_40px_rgba(201,162,39,0.25)]">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <CardContent className="relative p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left: Logo + Price Info */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
              <img 
                src={camlyLogo} 
                alt="CAMLY" 
                className="relative w-16 h-16 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg"
              />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-primary animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-primary">CAMLY Coin</h3>
                <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full uppercase">
                  {camlyData.symbol}
                </span>
              </div>
              
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold font-mono">
                  {formatPrice(camlyData.current_price)}
                </span>
                <div className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold",
                  isPositive 
                    ? "text-inflow bg-inflow/15" 
                    : "text-outflow bg-outflow/15"
                )}>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(camlyData.price_change_percentage_24h).toFixed(2)}%
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Vol: <span className="font-mono font-medium text-foreground">{formatCompact(camlyData.total_volume)}</span></span>
                <span>MCap: <span className="font-mono font-medium text-foreground">{formatCompact(camlyData.market_cap)}</span></span>
              </div>
            </div>
          </div>
          
          {/* Right: Trade Links */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-primary/50 hover:bg-primary/10 hover:border-primary"
              onClick={() => window.open('https://pancakeswap.finance/swap?outputCurrency=0x610b3b2b17603a7f6ddd9cca375b1f9ea52ada45', '_blank')}
            >
              <img 
                src="https://pancakeswap.finance/favicon.ico" 
                alt="PancakeSwap" 
                className="w-4 h-4 mr-2"
              />
              PancakeSwap
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-primary/50 hover:bg-primary/10 hover:border-primary"
              onClick={() => window.open('https://dexscreener.com/bsc/0x610b3b2b17603a7f6ddd9cca375b1f9ea52ada45', '_blank')}
            >
              <img 
                src="https://dexscreener.com/favicon.ico" 
                alt="DexScreener" 
                className="w-4 h-4 mr-2"
              />
              DexScreener
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
