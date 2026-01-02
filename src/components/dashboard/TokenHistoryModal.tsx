import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowDownLeft, ArrowUpRight, Copy, ExternalLink, Loader2, Check } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TokenHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenSymbol: string;
  tokenName: string;
}

// Format date as DD/MM/YYYY HH:mm
function formatDateVN(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Shorten address like MetaMask
function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function TokenHistoryModal({ open, onOpenChange, tokenSymbol, tokenName }: TokenHistoryModalProps) {
  const { data: transactions, isLoading } = useTransactions({ tokenSymbol });
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Get last 10 transactions for this token
  const recentTxs = transactions?.slice(0, 10) || [];

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      toast.success('Đã copy tx hash!');
      setTimeout(() => setCopiedHash(null), 2000);
    } catch {
      toast.error('Không thể copy');
    }
  };

  const getExplorerUrl = (txHash: string) => {
    // For now, default to BscScan. Later can add multi-chain support
    return `https://bscscan.com/tx/${txHash}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-primary">📜</span>
            Lịch sử giao dịch {tokenName}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Đang tải lịch sử...</span>
            </div>
          ) : recentTxs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Không có giao dịch {tokenSymbol} nào</p>
              <p className="text-xs mt-1">Nhấn Sync để cập nhật từ blockchain</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                <div className="col-span-3">Ngày</div>
                <div className="col-span-3">TX Hash</div>
                <div className="col-span-2">From/To</div>
                <div className="col-span-2 text-right">Số lượng</div>
                <div className="col-span-2 text-right">Loại</div>
              </div>

              {/* Transaction rows */}
              {recentTxs.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-12 gap-2 px-3 py-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all text-sm items-center"
                >
                  {/* Date */}
                  <div className="col-span-3 text-foreground font-medium">
                    {formatDateVN(tx.timestamp)}
                  </div>

                  {/* TX Hash with copy & link */}
                  <div className="col-span-3 flex items-center gap-1">
                    <span className="font-mono text-xs text-muted-foreground">
                      {shortenAddress(tx.tx_hash)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopyHash(tx.tx_hash)}
                    >
                      {copiedHash === tx.tx_hash ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      )}
                    </Button>
                    <a
                      href={getExplorerUrl(tx.tx_hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* From/To address */}
                  <div className="col-span-2 text-xs text-muted-foreground">
                    {tx.direction === 'IN' ? (
                      <span title={tx.from_address}>From: {shortenAddress(tx.from_address)}</span>
                    ) : (
                      <span title={tx.to_address}>To: {shortenAddress(tx.to_address)}</span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className={cn(
                    "col-span-2 text-right font-mono font-semibold",
                    tx.direction === 'IN' ? "text-green-500" : "text-red-500"
                  )}>
                    {tx.direction === 'IN' ? '+' : '-'}
                    {tx.amount < 0.000001 
                      ? tx.amount.toExponential(2) 
                      : tx.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </div>

                  {/* Direction badge */}
                  <div className="col-span-2 flex justify-end">
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                      tx.direction === 'IN' 
                        ? "bg-green-500/10 text-green-500 border border-green-500/30" 
                        : "bg-red-500/10 text-red-500 border border-red-500/30"
                    )}>
                      {tx.direction === 'IN' ? (
                        <>
                          <ArrowDownLeft className="w-3 h-3" />
                          IN
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3 h-3" />
                          OUT
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {recentTxs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">
              Hiển thị {recentTxs.length} giao dịch gần nhất
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
