import { CryptoPrice } from "@/hooks/useCryptoPrices";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CryptoPriceTableProps {
  data: CryptoPrice[];
  isLoading?: boolean;
}

function formatPrice(price: number, symbol: string): string {
  // Use more decimals for low-value coins like CAMLY
  if (price < 0.01) {
    return `$${price.toFixed(8)}`;
  } else if (price < 1) {
    return `$${price.toFixed(6)}`;
  } else if (price < 100) {
    return `$${price.toFixed(4)}`;
  }
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompact(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function MiniSparkline({ prices, isPositive }: { prices: number[]; isPositive: boolean }) {
  if (!prices || prices.length === 0) return null;
  
  // Sample every nth point to get ~20 points
  const step = Math.max(1, Math.floor(prices.length / 20));
  const sampledPrices = prices.filter((_, i) => i % step === 0);
  
  const min = Math.min(...sampledPrices);
  const max = Math.max(...sampledPrices);
  const range = max - min || 1;
  
  const height = 32;
  const width = 80;
  
  const points = sampledPrices.map((price, i) => {
    const x = (i / (sampledPrices.length - 1)) * width;
    const y = height - ((price - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={isPositive ? 'hsl(var(--inflow))' : 'hsl(var(--outflow))'}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-6" /></TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
    </TableRow>
  );
}

export function CryptoPriceTable({ data, isLoading }: CryptoPriceTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-12 text-muted-foreground">#</TableHead>
              <TableHead className="text-muted-foreground">Coin</TableHead>
              <TableHead className="text-right text-muted-foreground">Price</TableHead>
              <TableHead className="text-right text-muted-foreground">24h %</TableHead>
              <TableHead className="text-right text-muted-foreground">Volume (24h)</TableHead>
              <TableHead className="text-right text-muted-foreground">Market Cap</TableHead>
              <TableHead className="text-right text-muted-foreground">Last 7 Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="w-12 text-muted-foreground font-medium">#</TableHead>
            <TableHead className="text-muted-foreground font-medium">Coin</TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">Price</TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">24h %</TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">Volume (24h)</TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">Market Cap</TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">Last 7 Days</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((coin, index) => {
            const isPositive = coin.price_change_percentage_24h >= 0;
            const isCamly = coin.symbol.toUpperCase() === 'CAMLY';
            
            return (
              <TableRow
                key={coin.id}
                className={cn(
                  "hover:bg-muted/50 transition-colors border-border/30",
                  isCamly && "border-2 border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-[0_0_25px_rgba(201,162,39,0.15)]"
                )}
              >
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img 
                      src={coin.image} 
                      alt={coin.name}
                      className={cn(
                        "w-8 h-8 rounded-full",
                        isCamly && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      )}
                    />
                    <div>
                      <div className={cn(
                        "font-semibold",
                        isCamly && "text-primary"
                      )}>
                        {coin.name}
                      </div>
                      <div className="text-sm text-muted-foreground uppercase">
                        {coin.symbol}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatPrice(coin.current_price, coin.symbol)}
                </TableCell>
                <TableCell className="text-right">
                  <div className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium",
                    isPositive 
                      ? "text-inflow bg-inflow/10" 
                      : "text-outflow bg-outflow/10"
                  )}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {formatCompact(coin.total_volume)}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {formatCompact(coin.market_cap)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <MiniSparkline 
                      prices={coin.sparkline_in_7d?.price || []} 
                      isPositive={isPositive}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
