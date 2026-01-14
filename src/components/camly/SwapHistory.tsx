import { useState } from 'react';
import { ExternalLink, Clock, CheckCircle2, XCircle, Loader2, History, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/formatNumber';
import { useSwapHistory, SwapTransaction } from '@/hooks/useSwapHistory';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SwapHistoryProps {
  walletAddress: string | null;
  limit?: number;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  
  return new Date(timestamp).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getStatusIcon(status: SwapTransaction['status']) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-inflow" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-outflow" />;
    case 'pending':
      return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
  }
}

function getStatusText(status: SwapTransaction['status']) {
  switch (status) {
    case 'success':
      return 'Thành công';
    case 'failed':
      return 'Thất bại';
    case 'pending':
      return 'Đang xử lý';
  }
}

function getStatusColor(status: SwapTransaction['status']) {
  switch (status) {
    case 'success':
      return 'bg-inflow/10 text-inflow border-inflow/30';
    case 'failed':
      return 'bg-outflow/10 text-outflow border-outflow/30';
    case 'pending':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
  }
}

export function SwapHistory({ walletAddress, limit = 5 }: SwapHistoryProps) {
  const { swaps, clearHistory } = useSwapHistory(walletAddress);
  const [expanded, setExpanded] = useState(false);

  if (!walletAddress) {
    return null;
  }

  const displayedSwaps = expanded ? swaps : swaps.slice(0, limit);
  const hasMore = swaps.length > limit;

  if (swaps.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-muted/30 border border-dashed text-center">
        <History className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Chưa có giao dịch swap nào
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Swap token để xem lịch sử tại đây
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-foreground">Lịch sử Swap On-Chain</h4>
          <Badge variant="outline" className="text-xs">
            {swaps.length}
          </Badge>
        </div>
        
        {swaps.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-outflow">
                <Trash2 className="w-3 h-3 mr-1" />
                Xóa lịch sử
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa lịch sử swap?</AlertDialogTitle>
                <AlertDialogDescription>
                  Thao tác này sẽ xóa toàn bộ lịch sử swap của ví này. Lưu ý: Các giao dịch vẫn còn trên blockchain.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={clearHistory} className="bg-outflow hover:bg-outflow/90">
                  Xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Swap List */}
      <div className="space-y-2">
        {displayedSwaps.map((swap) => (
          <div
            key={swap.id}
            className={cn(
              "p-3 rounded-lg border transition-colors",
              "bg-card/50 hover:bg-muted/30",
              swap.status === 'pending' && "border-amber-500/30 bg-amber-500/5"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              {/* Left: Token info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {swap.fromToken.symbol} → {swap.toToken.symbol}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={cn("text-[10px] px-1.5 py-0", getStatusColor(swap.status))}
                  >
                    {getStatusIcon(swap.status)}
                    <span className="ml-1">{getStatusText(swap.status)}</span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(parseFloat(swap.fromToken.amount), { maxDecimals: 6 })} {swap.fromToken.symbol}
                  {' → '}
                  {formatNumber(parseFloat(swap.toToken.amount), { maxDecimals: 6 })} {swap.toToken.symbol}
                </p>
              </div>

              {/* Right: Time & Link */}
              <div className="flex items-center gap-2 text-right">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(swap.timestamp)}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {swap.txHash.slice(0, 8)}...{swap.txHash.slice(-6)}
                  </p>
                </div>
                <a
                  href={`https://bscscan.com/tx/${swap.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs text-muted-foreground hover:text-primary"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Thu gọn
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Xem thêm ({swaps.length - limit} giao dịch)
            </>
          )}
        </Button>
      )}
    </div>
  );
}
