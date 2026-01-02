import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowDownLeft, ArrowUpRight, Copy, ExternalLink, Loader2, Check } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatTokenAmount, formatUSD } from '@/lib/formatNumber';

interface TokenHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenSymbol: string;
  tokenName: string;
  tokenPrice?: number;
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

export function TokenHistoryModal({ 
  open, 
  onOpenChange, 
  tokenSymbol, 
  tokenName,
  tokenPrice = 0 
}: TokenHistoryModalProps) {
  const { data: transactions, isLoading } = useTransactions({ tokenSymbol });
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Get last 20 transactions for this token
  const recentTxs = transactions?.slice(0, 20) || [];

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
    return `https://bscscan.com/tx/${txHash}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden bg-card border-border">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-lg">📜</span>
            </div>
            <div>
              <span className="text-foreground">Lịch sử giao dịch</span>
              <span className="text-primary ml-2 font-bold">{tokenSymbol}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[65vh] pr-2 -mr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground text-lg">Đang tải lịch sử...</span>
            </div>
          ) : recentTxs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📭</span>
              </div>
              <p className="text-lg">Không có giao dịch {tokenSymbol} nào</p>
              <p className="text-sm mt-2">Nhấn Sync để cập nhật từ blockchain</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header row - MetaMask style */}
              <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-semibold text-muted-foreground bg-secondary/30 rounded-lg sticky top-0 z-10 backdrop-blur-sm">
                <div className="col-span-2">Thời gian</div>
                <div className="col-span-3">TX Hash</div>
                <div className="col-span-2">Địa chỉ</div>
                <div className="col-span-3 text-right">Số lượng / USDT</div>
                <div className="col-span-2 text-center">Loại</div>
              </div>

              {/* Transaction rows - MetaMask inspired design */}
              {recentTxs.map((tx, index) => {
                const usdValue = tx.amount * tokenPrice;
                return (
                  <div
                    key={tx.id}
                    className={cn(
                      "grid grid-cols-12 gap-3 px-4 py-4 rounded-xl border transition-all duration-200 items-center group",
                      tx.direction === 'IN' 
                        ? "bg-green-500/5 border-green-500/20 hover:border-green-500/40 hover:bg-green-500/10" 
                        : "bg-red-500/5 border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Date */}
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-foreground">
                        {formatDateVN(tx.timestamp).split(' ')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateVN(tx.timestamp).split(' ')[1]}
                      </p>
                    </div>

                    {/* TX Hash with copy & link */}
                    <div className="col-span-3 flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {shortenAddress(tx.tx_hash)}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-secondary"
                          onClick={() => handleCopyHash(tx.tx_hash)}
                        >
                          {copiedHash === tx.tx_hash ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                          )}
                        </Button>
                        <a
                          href={getExplorerUrl(tx.tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-secondary transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-primary" />
                        </a>
                      </div>
                    </div>

                    {/* From/To address */}
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">
                        {tx.direction === 'IN' ? 'From' : 'To'}
                      </p>
                      <p className="text-sm font-mono text-foreground" title={tx.direction === 'IN' ? tx.from_address : tx.to_address}>
                        {shortenAddress(tx.direction === 'IN' ? tx.from_address : tx.to_address)}
                      </p>
                    </div>

                    {/* Amount + USD Value */}
                    <div className="col-span-3 text-right">
                      <p className={cn(
                        "font-mono font-bold text-sm",
                        tx.direction === 'IN' ? "text-green-500" : "text-red-500"
                      )}>
                        {tx.direction === 'IN' ? '+' : '-'}
                        {formatTokenAmount(tx.amount, tokenSymbol)} {tokenSymbol}
                      </p>
                      <p className={cn(
                        "text-xs font-mono",
                        tx.direction === 'IN' ? "text-green-500/70" : "text-red-500/70"
                      )}>
                        ≈ {formatUSD(usdValue)}
                      </p>
                    </div>

                    {/* Direction badge - MetaMask style */}
                    <div className="col-span-2 flex justify-center">
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold",
                        tx.direction === 'IN' 
                          ? "bg-green-500/20 text-green-500" 
                          : "bg-red-500/20 text-red-500"
                      )}>
                        {tx.direction === 'IN' ? (
                          <>
                            <ArrowDownLeft className="w-4 h-4" />
                            NHẬN
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-4 h-4" />
                            GỬI
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {recentTxs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Hiển thị <span className="font-bold text-foreground">{recentTxs.length}</span> giao dịch gần nhất
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500/30" />
                Nhận
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500/30" />
                Gửi
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
