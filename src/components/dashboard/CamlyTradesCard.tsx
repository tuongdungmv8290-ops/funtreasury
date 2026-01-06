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
import { Activity, TrendingUp, TrendingDown, ExternalLink, Database, Radio, Loader2, ArrowLeftRight, BarChart3 } from 'lucide-react';
import { formatNumber, formatUSDT } from '@/lib/formatNumber';
import { cn } from '@/lib/utils';
import camlyLogo from '@/assets/camly-coin-logo.png';
import { useEffect, useRef, useCallback, useMemo } from 'react';

const DEXSCREENER_TRADES_URL = 'https://dexscreener.com/bsc/0x0910320181889fefde0bb1ca63962b0a8882e413?tab=transactions';

export function CamlyTradesCard() {
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isError,
    refetch
  } = useCamlyTrades();
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Flatten all trades from pages
  const allTrades = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.recentTrades || []);
  }, [data?.pages]);

  // Get pagination and stats info from first page
  const pagination = data?.pages?.[0]?.pagination;
  const stats = data?.pages?.[0]?.stats;
  const total = pagination?.total || allTrades.length;
  const timeframe = pagination?.timeframe || '7d';

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const formatTxHash = (hash: string) => {
    if (!hash || hash.length <= 13) return hash || '—';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${day}/${month} ${hours}:${minutes}:${seconds}`;
  };

  // Check if trade is recent (< 1 minute)
  const isRecentTrade = (timestamp: string) => {
    const tradeTime = new Date(timestamp).getTime();
    const now = Date.now();
    return now - tradeTime < 60000; // 1 minute
  };

  const getTradeTypeInfo = (type: string) => {
    switch (type) {
      case 'buy':
        return {
          label: 'MUA',
          icon: TrendingUp,
          className: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
        };
      case 'sell':
        return {
          label: 'BÁN',
          icon: TrendingDown,
          className: 'bg-red-500/20 text-red-500 border-red-500/30'
        };
      default:
        return {
          label: 'CHUYỂN',
          icon: ArrowLeftRight,
          className: 'bg-blue-500/20 text-blue-500 border-blue-500/30'
        };
    }
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Database className="w-12 h-12 text-treasury-gold/40 mb-3" />
      <p className="text-sm text-muted-foreground font-medium">Chưa có giao dịch trong 7 ngày</p>
      <p className="text-xs text-muted-foreground/70 mt-1">Đang tải dữ liệu từ blockchain...</p>
      <Button 
        variant="outline" 
        size="sm" 
        className="mt-3"
        onClick={() => refetch()}
      >
        Thử lại
      </Button>
    </div>
  );

  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Database className="w-12 h-12 text-red-400/40 mb-3" />
      <p className="text-sm text-red-500 font-medium">Lỗi tải dữ liệu</p>
      <p className="text-xs text-muted-foreground/70 mt-1">Không thể kết nối blockchain</p>
      <Button 
        variant="outline" 
        size="sm" 
        className="mt-3"
        onClick={() => refetch()}
      >
        Thử lại
      </Button>
    </div>
  );

  // Calculate buy/sell ratio for 24h
  const buys24h = stats?.buys24h || 0;
  const sells24h = stats?.sells24h || 0;
  const total24h = buys24h + sells24h;
  const buyRatio = total24h > 0 ? (buys24h / total24h) * 100 : 50;

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
                    {total} trades / {timeframe}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Radio className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-500 font-medium">Live • Auto-refresh 15s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] font-medium text-emerald-600">MUA 24h</span>
              </div>
              <span className="text-sm font-bold text-emerald-600">{buys24h}</span>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 text-red-500" />
                <span className="text-[10px] font-medium text-red-500">BÁN 24h</span>
              </div>
              <span className="text-sm font-bold text-red-500">{sells24h}</span>
            </div>
            <div className="bg-treasury-gold/10 border border-treasury-gold/20 rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BarChart3 className="w-3 h-3 text-treasury-gold" />
                <span className="text-[10px] font-medium text-treasury-gold">Volume 24h</span>
              </div>
              <span className="text-sm font-bold text-treasury-gold">
                ${formatNumber(stats.volume24h || 0, { compact: true })}
              </span>
            </div>
          </div>
        )}

        {/* Buy/Sell Ratio Bar */}
        {total24h > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-emerald-600 font-medium">MUA {buyRatio.toFixed(0)}%</span>
              <span className="text-red-500 font-medium">BÁN {(100 - buyRatio).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-red-500/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${buyRatio}%` }}
              />
            </div>
          </div>
        )}

        {/* Recent Trades Title */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-treasury-gold/20">
          <Activity className="w-4 h-4 text-treasury-gold" />
          <span className="text-sm font-bold text-foreground">Recent Trades</span>
          <span className="text-xs text-muted-foreground">(7 ngày gần nhất)</span>
        </div>

        {/* Recent Trades Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-treasury-gold/10" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState />
        ) : allTrades.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="h-[500px]">
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
                {allTrades.map((trade, i) => {
                  const typeInfo = getTradeTypeInfo(trade.type);
                  const TypeIcon = typeInfo.icon;
                  
                  return (
                    <TableRow 
                      key={`${trade.txHash}-${i}`} 
                      className={cn(
                        "border-treasury-gold/10 transition-all duration-200",
                        "hover:bg-treasury-gold/10",
                        i % 2 === 0 ? "bg-transparent" : "bg-treasury-gold/5",
                        isRecentTrade(trade.timestamp) && "animate-pulse bg-treasury-gold/15"
                      )}
                    >
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          {isRecentTrade(trade.timestamp) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {formatDate(trade.timestamp)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className={cn(
                          "flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full w-fit mx-auto shadow-sm border",
                          typeInfo.className
                        )}>
                          <TypeIcon className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wide">
                            {typeInfo.label}
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
                          trade.type === 'buy' ? "text-emerald-600" : 
                          trade.type === 'sell' ? "text-red-500" : "text-blue-500"
                        )}>
                          {formatUSDT(trade.valueUsd)}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        {trade.txHash && !trade.txHash.includes('...') ? (
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
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {formatTxHash(trade.txHash || '—')}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {/* Load More Trigger */}
            <div 
              ref={loadMoreRef} 
              className="flex items-center justify-center py-4"
            >
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-treasury-gold" />
                  <span className="text-xs">Loading more trades...</span>
                </div>
              ) : hasNextPage ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  className="text-xs text-treasury-gold hover:text-amber-600"
                >
                  Load More
                </Button>
              ) : allTrades.length > 0 ? (
                <span className="text-xs text-muted-foreground">
                  Đã hiển thị tất cả {allTrades.length} giao dịch trong 7 ngày
                </span>
              ) : null}
            </div>
          </ScrollArea>
        )}

        {/* Footer - View All Button */}
        {allTrades.length > 0 && (
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
