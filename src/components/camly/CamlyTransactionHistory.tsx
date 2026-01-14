import { ArrowDownLeft, ArrowUpRight, ExternalLink, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/useTransactions";
import { formatNumber } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface CamlyTransactionHistoryProps {
  limit?: number;
  onViewAll?: () => void;
}

export function CamlyTransactionHistory({ limit = 5, onViewAll }: CamlyTransactionHistoryProps) {
  const { data: transactions, isLoading } = useTransactions({
    tokenSymbol: 'CAMLY',
    days: 90,
  });

  const displayedTxs = transactions?.slice(0, limit) || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!displayedTxs || displayedTxs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Chưa có giao dịch CAMLY nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayedTxs.map((tx) => {
        const isIncoming = tx.direction === 'IN';
        
        return (
          <div
            key={tx.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl",
              "border border-border/30 bg-card/30",
              "hover:bg-card/50 transition-colors",
              "group"
            )}
          >
            {/* Direction Icon */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isIncoming ? "bg-inflow/10" : "bg-outflow/10"
            )}>
              {isIncoming ? (
                <ArrowDownLeft className="w-5 h-5 text-inflow" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-outflow" />
              )}
            </div>

            {/* Transaction Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                {isIncoming ? 'Nhận' : 'Gửi'} CAMLY
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {format(tx.timestamp, 'dd/MM/yyyy HH:mm', { locale: vi })}
              </p>
            </div>

            {/* Amount */}
            <div className="text-right">
              <p className={cn(
                "font-mono font-medium text-sm",
                isIncoming ? "text-inflow" : "text-outflow"
              )}>
                {isIncoming ? '+' : '-'}{formatNumber(tx.amount, { compact: true })}
              </p>
              <p className="text-xs text-muted-foreground">
                ≈ ${formatNumber(tx.usd_value, { maxDecimals: 2 })}
              </p>
            </div>

            {/* View on Explorer */}
            <a
              href={`https://bscscan.com/tx/${tx.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </a>
          </div>
        );
      })}

      {/* View All Button */}
      {transactions && transactions.length > limit && onViewAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAll}
          className="w-full text-muted-foreground hover:text-primary"
        >
          Xem tất cả {transactions.length} giao dịch
        </Button>
      )}
    </div>
  );
}
