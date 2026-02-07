import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, Home, ArrowRight, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { GiftData } from '@/hooks/useGifts';
import camlyLogo from '@/assets/camly-coin-gold-logo.png';

interface GiftReceiptModalProps {
  open: boolean;
  onClose: () => void;
  gift: GiftData | null;
  postTitle?: string;
}

export function GiftReceiptModal({ open, onClose, gift, postTitle }: GiftReceiptModalProps) {
  const navigate = useNavigate();

  if (!gift) return null;

  const senderInitial = (gift.sender_name || '?')[0].toUpperCase();
  const receiverInitial = (gift.receiver_name || '?')[0].toUpperCase();

  const copyLink = () => {
    const text = [
      `🎁 FUN Rewards — Biên Nhận Tặng Thưởng`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `Người tặng: ${gift.sender_name || 'N/A'}`,
      `Người nhận: ${gift.receiver_name || 'N/A'}`,
      `Số lượng: ${gift.amount.toLocaleString()} ${gift.token_symbol}`,
      `Giá trị: ~$${gift.usd_value.toFixed(2)} USD`,
      gift.message ? `Lời nhắn: "${gift.message}"` : '',
      `Thời gian: ${new Date(gift.created_at).toLocaleString('vi-VN')}`,
      gift.tx_hash ? `Tx: https://bscscan.com/tx/${gift.tx_hash}` : '',
      `━━━━━━━━━━━━━━━━━━━━━`,
      `FUN Ecosystem • funtreasury.lovable.app`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép biên nhận!');
  };

  const goHome = () => {
    onClose();
    navigate('/rewards');
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent [&>button]:hidden">
        {/* Gold Gradient Header */}
        <div className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 px-6 pt-6 pb-8 text-center relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-30" />
          <div className="relative z-10">
            <FileText className="w-10 h-10 mx-auto mb-2 text-white drop-shadow-md" />
            <h2 className="text-xl font-bold text-white drop-shadow-sm">Biên Nhận Tặng Thưởng</h2>
            <p className="text-sm text-white/80 mt-1">FUN Rewards Certificate</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-background rounded-t-2xl -mt-4 relative z-10 px-6 py-5 space-y-5">
          {/* Sender → Receiver */}
          <div className="flex items-center justify-center gap-5">
            <div className="flex flex-col items-center gap-1.5">
              <Avatar className="w-14 h-14 border-2 border-amber-400 shadow-md">
                <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-lg">
                  {senderInitial}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Người tặng</p>
                <p className="text-sm font-semibold text-foreground max-w-[90px] truncate">
                  {gift.sender_name || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-amber-600" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <Avatar className="w-14 h-14 border-2 border-amber-400 shadow-md">
                <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-lg">
                  {receiverInitial}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Người nhận</p>
                <p className="text-sm font-semibold text-foreground max-w-[90px] truncate">
                  {gift.receiver_name || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Amount Card with Logo */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <img src={camlyLogo} alt="Token" className="w-10 h-10 drop-shadow" />
              <div>
                <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {gift.amount.toLocaleString()}
                </span>
                <span className="text-lg text-amber-500/80 dark:text-amber-400/80 font-semibold ml-2">
                  {gift.token_symbol}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ≈ ${gift.usd_value.toFixed(2)} USD
            </p>
          </div>

          {/* Message */}
          {gift.message && (
            <div className="bg-secondary/40 rounded-lg p-3 border border-border/40">
              <p className="text-xs text-muted-foreground mb-1">Lời nhắn</p>
              <p className="text-sm text-foreground italic">"{gift.message}"</p>
            </div>
          )}

          {/* Linked Post */}
          {(gift.post_id || postTitle) && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">📝 Bài viết liên kết</p>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {postTitle || `Bài viết #${gift.post_id?.slice(0, 8)}...`}
              </p>
            </div>
          )}

          {/* Transaction Hash */}
          {gift.tx_hash && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono truncate flex-1">
                Tx: {gift.tx_hash.slice(0, 16)}...{gift.tx_hash.slice(-8)}
              </span>
              <a
                href={`https://bscscan.com/tx/${gift.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 shrink-0"
              >
                BscScan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Timestamp & Status */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-3">
            <span>{new Date(gift.created_at).toLocaleString('vi-VN')}</span>
            <span className={gift.status === 'confirmed' ? 'text-green-600 font-medium' : ''}>
              {gift.status === 'confirmed' ? '✓ Đã xác nhận' : gift.status}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 gap-2" onClick={copyLink}>
              <Copy className="w-4 h-4" /> Sao chép link
            </Button>
            <Button
              className="flex-1 gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-white"
              onClick={goHome}
            >
              <Home className="w-4 h-4" /> Về trang chủ
            </Button>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-center text-muted-foreground pt-1">
            FUN Ecosystem • BNB Chain • funtreasury.lovable.app
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
