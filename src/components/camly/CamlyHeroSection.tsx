import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCamlyPrice } from "@/hooks/useCamlyPrice";
import { formatNumber, formatUSD } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";
import camlyLogo from "@/assets/camly-coin-gold-logo.png";

const PANCAKESWAP_URL = "https://pancakeswap.finance/swap?outputCurrency=0x816C6DA6B5da2d42d8a93a61b1df49df60cF5Be3";

export function CamlyHeroSection() {
  const { data: priceData, isLoading } = useCamlyPrice();

  const price = priceData?.price_usd ?? 0;
  const change24h = priceData?.change_24h ?? 0;
  const volume24h = priceData?.volume_24h ?? 0;
  const marketCap = priceData?.market_cap ?? 0;
  const isPositive = change24h >= 0;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "border-2 border-primary/50",
        "bg-gradient-to-br from-[#FFFEF7] via-background to-primary/5",
        "dark:from-background dark:via-card dark:to-primary/10",
        "shadow-[0_0_60px_rgba(212,175,55,0.3)]",
        "p-8 md:p-12"
      )}
    >
      {/* Background glow effect */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        {/* Logo Section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-4 ring-primary/50 shadow-[0_0_40px_rgba(212,175,55,0.4)]">
              <img
                src={camlyLogo}
                alt="CAMLY Coin"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl -z-10" />
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-heading font-bold gold-text">
            CAMLY
          </h1>
          <p className="text-muted-foreground text-sm">Love of Value</p>
        </div>

        {/* Price & Stats Section */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          {/* Price Display */}
          <div>
            <p className="text-muted-foreground text-sm uppercase tracking-wider mb-2">
              Current Price
            </p>
            {isLoading ? (
              <div className="h-12 w-48 bg-muted animate-pulse rounded-lg" />
            ) : (
              <div className="flex items-baseline gap-4 justify-center lg:justify-start">
                <span className="font-mono text-4xl md:text-5xl font-bold text-foreground">
                  ${formatNumber(price, { minDecimals: 6, maxDecimals: 8 })}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 text-lg font-medium",
                    isPositive ? "text-inflow" : "text-outflow"
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  {isPositive ? "+" : ""}
                  {change24h.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-card/50 dark:bg-card/30 rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                24h Volume
              </p>
              <p className="font-mono text-lg font-semibold text-foreground">
                {formatUSD(volume24h)}
              </p>
            </div>
            <div className="bg-card/50 dark:bg-card/30 rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Market Cap
              </p>
              <p className="font-mono text-lg font-semibold text-foreground">
                {marketCap > 0 ? formatUSD(marketCap) : "—"}
              </p>
            </div>
            <div className="bg-card/50 dark:bg-card/30 rounded-xl p-4 border border-border/50 col-span-2 md:col-span-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Network
              </p>
              <p className="font-medium text-foreground">
                BNB Smart Chain
              </p>
            </div>
          </div>

          {/* Trade Button */}
          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            <a 
              href={PANCAKESWAP_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/30 px-6 py-3 rounded-lg transition-colors"
            >
              Trade on PancakeSwap
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
