import { useCamlyTrades } from '@/hooks/useCamlyTrades';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Activity, TrendingUp, TrendingDown, ExternalLink, Database, Radio } from 'lucide-react';
import { formatNumber, formatUSDT } from '@/lib/formatNumber';
import { cn } from '@/lib/utils';
import camlyLogo from '@/assets/camly-coin-logo.png';

const DEXSCREENER_TRADES_URL = 'https://dexscreener.com/bsc/0x0910320181889fefde0bb1ca63962b0a8882e413?tab=transactions';

export function CamlyTradesCard() {
  const { data, isLoading } = useCamlyTrades();

  const formatTxHash = (hash: string) => {
    if (!hash || hash.length <= 13) return hash || '—';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Database className="w-12 h-12 text-treasury-gold/40 mb-3" />
      <p className="text-sm text-muted-foreground font-medium">Chưa có giao dịch mới</p>
      <p className="text-xs text-muted-foreground/70 mt-1">Volume thấp – Vui lòng thử lại sau</p>
    </div>
  );

  // Get 20 most recent trades
  const recentTrades = data?.recentTrades?.slice(0, 20) || [];

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50/80 via-background to-orange-50/50 dark:from-amber-950/30 dark:via-background dark:to-orange-950/20 shadow-lg">
      <div className="absolute inset-0 rounded-xl border-2 border-treasury-gold/30" />
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-treasury-gold/40 shadow-lg">
              <img src={camlyLogo} alt="CAMLY" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-treasury-gold">CAMLY Analytics</h3>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 rounded-full border border-emerald-500/30">
                  <Activity className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-bold text-emerald-600">
                    {recentTrades.length} trades
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Radio className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-500 font-medium">Live • Auto-refresh 30s</span>
              </div>
            </div>
          </div>
          
        </div>

        {/* Recent Trades Title */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-treasury-gold/20">
          <Activity className="w-4 h-4 text-treasury-gold" />
          <span className="text-sm font-bold text-foreground">Recent Trades</span>
          <span className="text-xs text-muted-foreground">(20 lệnh mới nhất)</span>
        </div>

        {/* Recent Trades Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-treasury-gold/10" />
            ))}
          </div>
        ) : recentTrades.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                <TableRow className="border-treasury-gold/20 hover:bg-transparent">
                  <TableHead className="text-[11px] text-treasury-gold font-bold">Thời gian</TableHead>
                  <TableHead className="text-[11px] text-treasury-gold font-bold text-center w-20">Loại</TableHead>
                  <TableHead className="text-[11px] text-treasury-gold font-bold text-right">CAMLY</TableHead>
                  <TableHead className="text-[11px] text-treasury-gold font-bold text-right">USDT</TableHead>
                  <TableHead className="text-[11px] text-treasury-gold font-bold text-right">Tx Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTrades.map((trade, i) => (
                  <TableRow 
                    key={i} 
                    className={cn(
                      "border-treasury-gold/10 transition-all duration-200",
                      "hover:bg-treasury-gold/10",
                      i % 2 === 0 ? "bg-transparent" : "bg-treasury-gold/5"
                    )}
                  >
                    <TableCell className="py-2.5">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {formatDate(trade.timestamp)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className={cn(
                        "flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full w-fit mx-auto shadow-sm",
                        trade.type === 'buy' 
                          ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30" 
                          : "bg-red-500/20 text-red-500 border border-red-500/30"
                      )}>
                        {trade.type === 'buy' ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wide">
                          {trade.type === 'buy' ? 'MUA' : 'BÁN'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <span className="text-[12px] font-semibold">
                        {formatNumber(trade.amount, { compact: true })}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <span className={cn(
                        "text-[12px] font-bold",
                        trade.type === 'buy' ? "text-emerald-600" : "text-red-500"
                      )}>
                        {formatUSDT(trade.valueUsd)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      {trade.txHash ? (
                        <a
                          href={`https://bscscan.com/tx/${trade.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-treasury-gold hover:text-amber-600 transition-colors"
                        >
                          {formatTxHash(trade.txHash)}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        {/* Footer - View All Button */}
        {recentTrades.length > 0 && (
          <div className="pt-4 border-t border-treasury-gold/20 mt-2">
            <Button
              size="sm"
              className="w-full h-10 bg-gradient-to-r from-treasury-gold via-amber-500 to-yellow-500 hover:from-amber-600 hover:via-treasury-gold hover:to-amber-500 text-black text-sm font-bold shadow-lg shadow-treasury-gold/30 transition-all hover:scale-[1.01]"
              onClick={() => window.open(DEXSCREENER_TRADES_URL, '_blank')}
              title="Xem lịch sử mua bán realtime"
            >
              <Activity className="w-4 h-4 mr-2" />
              View All Trades on DexScreener
              <ExternalLink className="w-3.5 h-3.5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
