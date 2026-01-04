import { useCamlyTrades } from '@/hooks/useCamlyTrades';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Activity, TrendingUp, TrendingDown, ExternalLink, Database, Radio } from 'lucide-react';
import { formatNumber, formatUSD } from '@/lib/formatNumber';
import { cn } from '@/lib/utils';
import camlyLogo from '@/assets/camly-coin-logo.png';

const DEXSCREENER_HOLDERS_URL = 'https://dexscreener.com/bsc/0x0910320181889fefde0bb1ca63962b0a8882e413?tab=holders';
const DEXSCREENER_TRADES_URL = 'https://dexscreener.com/bsc/0x0910320181889fefde0bb1ca63962b0a8882e413?tab=transactions';
const BSCSCAN_TOKEN_URL = 'https://bscscan.com/token/0x31f8d38df6514b6cc3c360ace3a2efa7496214f6';

export function CamlyTradesCard() {
  const { data, isLoading } = useCamlyTrades();

  const formatAddress = (address: string) => {
    if (address.length <= 13) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Database className="w-10 h-10 text-treasury-gold/40 mb-2" />
      <p className="text-sm text-muted-foreground">Chưa có data mới</p>
      <p className="text-xs text-muted-foreground/70">Volume thấp – Vui lòng thử lại sau</p>
    </div>
  );

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50/80 via-background to-orange-50/50 dark:from-amber-950/30 dark:via-background dark:to-orange-950/20 shadow-lg">
      <div className="absolute inset-0 rounded-xl border-2 border-treasury-gold/30" />
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-treasury-gold/40 shadow-lg">
              <img src={camlyLogo} alt="CAMLY" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-treasury-gold">CAMLY Analytics</h3>
              <div className="flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                <span className="text-[9px] text-emerald-500 font-medium">Live • Auto-refresh 30s</span>
              </div>
            </div>
          </div>
          
          {/* Count Badges */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-1 bg-treasury-gold/15 rounded-full border border-treasury-gold/30">
              <Users className="w-3 h-3 text-treasury-gold" />
              <span className="text-[10px] font-bold text-treasury-gold">
                {data?.topHolders?.length || 0}
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/15 rounded-full border border-emerald-500/30">
              <Activity className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-600">
                {data?.recentTrades?.length || 0}
              </span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="trades" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8 bg-treasury-gold/10 border border-treasury-gold/20">
            <TabsTrigger 
              value="holders" 
              className="text-xs gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-treasury-gold data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <Users className="w-3 h-3" />
              Top Holders
              {data?.topHolders && data.topHolders.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[8px] font-bold">
                  {data.topHolders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="trades" 
              className="text-xs gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-treasury-gold data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <Activity className="w-3 h-3" />
              Recent Trades
              {data?.recentTrades && data.recentTrades.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[8px] font-bold">
                  {data.recentTrades.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Top Holders Tab */}
          <TabsContent value="holders" className="mt-3">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full bg-treasury-gold/10" />
                ))}
              </div>
            ) : !data?.topHolders || data.topHolders.length === 0 ? (
              <EmptyState />
            ) : (
              <ScrollArea className="h-[180px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-treasury-gold/20 hover:bg-transparent">
                      <TableHead className="text-[10px] text-treasury-gold font-bold w-8">#</TableHead>
                      <TableHead className="text-[10px] text-treasury-gold font-bold">Address</TableHead>
                      <TableHead className="text-[10px] text-treasury-gold font-bold text-right">CAMLY</TableHead>
                      <TableHead className="text-[10px] text-treasury-gold font-bold text-right">USD</TableHead>
                      <TableHead className="text-[10px] text-treasury-gold font-bold text-right w-14">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topHolders.slice(0, 5).map((holder, i) => (
                      <TableRow 
                        key={i} 
                        className="border-treasury-gold/10 hover:bg-treasury-gold/5 transition-colors"
                      >
                        <TableCell className="py-2">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                            i === 0 && "bg-yellow-500 text-white",
                            i === 1 && "bg-gray-400 text-white",
                            i === 2 && "bg-amber-600 text-white",
                            i > 2 && "bg-treasury-gold/20 text-treasury-gold"
                          )}>
                            {i + 1}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <a
                            href={`https://bscscan.com/address/${holder.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-mono text-foreground hover:text-treasury-gold transition-colors flex items-center gap-1"
                          >
                            {formatAddress(holder.address)}
                            <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                          </a>
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <span className="text-[11px] font-medium">
                            {formatNumber(holder.balance, { compact: true })}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <span className="text-[11px] font-medium text-emerald-600">
                            {formatUSD(holder.valueUsd)}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <span className="text-[11px] font-bold text-treasury-gold">
                            {holder.percentage.toFixed(2)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="pt-3 pb-1">
                  <Button
                    size="sm"
                    className="w-full h-8 bg-gradient-to-r from-treasury-gold to-amber-500 hover:from-amber-600 hover:to-treasury-gold text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02]"
                    onClick={() => window.open(DEXSCREENER_HOLDERS_URL, '_blank')}
                    title="Xem danh sách người nắm giữ"
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    View All Holders on DexScreener
                    <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Recent Trades Tab */}
          <TabsContent value="trades" className="mt-3">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full bg-treasury-gold/10" />
                ))}
              </div>
            ) : !data?.recentTrades || data.recentTrades.length === 0 ? (
              <EmptyState />
            ) : (
              <ScrollArea className="h-[180px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-treasury-gold/20 hover:bg-transparent">
                      <TableHead className="text-[10px] text-treasury-gold font-bold">Date</TableHead>
                      <TableHead className="text-[10px] text-treasury-gold font-bold text-center">Type</TableHead>
                      <TableHead className="text-[10px] text-treasury-gold font-bold text-right">CAMLY</TableHead>
                      <TableHead className="text-[10px] text-treasury-gold font-bold text-right">USDT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentTrades.slice(0, 5).map((trade, i) => (
                      <TableRow 
                        key={i} 
                        className="border-treasury-gold/10 hover:bg-treasury-gold/5 transition-colors"
                      >
                        <TableCell className="py-2">
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(trade.timestamp)}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className={cn(
                            "flex items-center justify-center gap-1 px-2 py-0.5 rounded-full w-fit mx-auto",
                            trade.type === 'buy' 
                              ? "bg-emerald-500/20 text-emerald-600" 
                              : "bg-red-500/20 text-red-500"
                          )}>
                            {trade.type === 'buy' ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span className="text-[10px] font-bold uppercase">
                              {trade.type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <span className="text-[11px] font-semibold">
                            {formatNumber(trade.amount, { compact: true })}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <span className="text-[11px] font-bold text-treasury-gold">
                            {formatUSD(trade.valueUsd)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="pt-3 pb-1">
                  <Button
                    size="sm"
                    className="w-full h-8 bg-gradient-to-r from-treasury-gold to-amber-500 hover:from-amber-600 hover:to-treasury-gold text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02]"
                    onClick={() => window.open(DEXSCREENER_TRADES_URL, '_blank')}
                    title="Xem lịch sử mua bán realtime"
                  >
                    <Activity className="w-3.5 h-3.5 mr-1.5" />
                    View All Trades on DexScreener
                    <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
