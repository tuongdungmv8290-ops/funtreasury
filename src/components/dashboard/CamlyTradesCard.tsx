import { useCamlyTrades } from '@/hooks/useCamlyTrades';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Activity, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { formatNumber, formatUSD } from '@/lib/formatNumber';
import { cn } from '@/lib/utils';
import camlyLogo from '@/assets/camly-coin-logo.png';

export function CamlyTradesCard() {
  const { data, isLoading } = useCamlyTrades();

  const formatAddress = (address: string) => {
    if (address.length <= 13) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50/50 via-background to-orange-50/50 dark:from-amber-950/20 dark:via-background dark:to-orange-950/20 shadow-lg">
      <div className="absolute inset-0 rounded-xl border border-treasury-gold/20" />
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-treasury-gold/30">
            <img src={camlyLogo} alt="CAMLY" className="w-full h-full object-cover" />
          </div>
          <h3 className="text-sm font-bold text-treasury-gold">CAMLY Analytics</h3>
        </div>

        <Tabs defaultValue="trades" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8 bg-muted/50">
            <TabsTrigger value="trades" className="text-xs gap-1 data-[state=active]:bg-treasury-gold data-[state=active]:text-white">
              <Activity className="w-3 h-3" />
              Recent Trades
            </TabsTrigger>
            <TabsTrigger value="holders" className="text-xs gap-1 data-[state=active]:bg-treasury-gold data-[state=active]:text-white">
              <Users className="w-3 h-3" />
              Top Holders
            </TabsTrigger>
          </TabsList>

          {/* Recent Trades Tab */}
          <TabsContent value="trades" className="mt-3 space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full bg-treasury-gold/5" />
              ))
            ) : (
              <>
                {data?.recentTrades.slice(0, 5).map((trade, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-background/60 border border-border/50 hover:border-treasury-gold/30 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        trade.type === 'buy' 
                          ? "bg-emerald-500/15 text-emerald-500" 
                          : "bg-red-500/15 text-red-500"
                      )}>
                        {trade.type === 'buy' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                      </div>
                      <div>
                        <p className={cn(
                          "text-xs font-semibold",
                          trade.type === 'buy' ? "text-emerald-500" : "text-red-500"
                        )}>
                          {trade.type.toUpperCase()}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {formatTimeAgo(trade.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold">
                        {formatNumber(trade.amount, { compact: true })} CAMLY
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        {formatUSD(trade.valueUsd)}
                      </p>
                    </div>
                  </div>
                ))}
                
                <a
                  href={`https://dexscreener.com/bsc/0x31f8d38df6514b6cc3c360ace3a2efa7496214f6`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 text-[10px] text-treasury-gold hover:underline pt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View all on DexScreener
                </a>
              </>
            )}
          </TabsContent>

          {/* Top Holders Tab */}
          <TabsContent value="holders" className="mt-3 space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full bg-treasury-gold/5" />
              ))
            ) : (
              <>
                {data?.topHolders.slice(0, 5).map((holder, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-background/60 border border-border/50 hover:border-treasury-gold/30 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-treasury-gold/10 flex items-center justify-center text-treasury-gold text-[10px] font-bold">
                        #{i + 1}
                      </div>
                      <div>
                        <p className="text-xs font-mono font-medium">
                          {formatAddress(holder.address)}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {formatNumber(holder.balance, { compact: true })} CAMLY
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-treasury-gold">
                        {holder.percentage.toFixed(2)}%
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        {formatUSD(holder.valueUsd)}
                      </p>
                    </div>
                  </div>
                ))}
                
                <a
                  href={`https://bscscan.com/token/0x31f8d38df6514b6cc3c360ace3a2efa7496214f6#balances`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 text-[10px] text-treasury-gold hover:underline pt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View all on BSCScan
                </a>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
