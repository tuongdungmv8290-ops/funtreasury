import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Copy, X, ArrowRight, Link } from 'lucide-react';
import { toast } from 'sonner';
import { generateGiftReceiptPDF } from '@/lib/giftReceiptPDF';
import type { GiftData } from '@/hooks/useGifts';
import camlyLogo from '@/assets/camly-coin-gold-logo.png';

interface GiftCelebrationModalProps {
  open: boolean;
  onClose: () => void;
  gift: GiftData | null;
}

export function GiftCelebrationModal({ open, onClose, gift }: GiftCelebrationModalProps) {
  if (!gift) return null;

  const copyLink = () => {
    const text = [
      `🎁 FUN Rewards - Chứng nhận tặng thưởng`,
      `Người tặng: ${gift.sender_name || 'N/A'}`,
      `Người nhận: ${gift.receiver_name || 'N/A'}`,
      `Số lượng: ${gift.amount.toLocaleString()} ${gift.token_symbol}`,
      `Thời gian: ${new Date(gift.created_at).toLocaleString('vi-VN')}`,
      gift.message ? `Lời nhắn: "${gift.message}"` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  const senderInitial = (gift.sender_name || '?')[0].toUpperCase();
  const receiverInitial = (gift.receiver_name || '?')[0].toUpperCase();

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden border-0 bg-transparent [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#F97316', '#FBBF24', '#A78BFA', '#FB923C'][i % 7],
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Gradient Header */}
        <div className="relative z-10 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 px-6 pt-6 pb-8 text-center text-white">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <img src={camlyLogo} alt="Camly" className="w-14 h-14 mx-auto mb-2 drop-shadow-lg" />
          <h2 className="text-xl font-bold">🎉 Chúc mừng!</h2>
          <p className="text-sm opacity-90 mt-1">Bạn đã chuyển thành công!</p>
        </div>

        {/* Content Card */}
        <div className="relative z-10 bg-background rounded-t-2xl -mt-4 px-6 py-5 space-y-4">
          {/* Sender → Receiver Row */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <Avatar className="w-12 h-12 border-2 border-amber-400">
                <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">
                  {senderInitial}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground max-w-[80px] truncate">
                {gift.sender_name || 'N/A'}
              </span>
            </div>

            <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />

            <div className="flex flex-col items-center gap-1">
              <Avatar className="w-12 h-12 border-2 border-amber-400">
                <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">
                  {receiverInitial}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground max-w-[80px] truncate">
                {gift.receiver_name || 'N/A'}
              </span>
            </div>
          </div>

          {/* Amount Card */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <img src={camlyLogo} alt="" className="w-7 h-7" />
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {gift.amount.toLocaleString()}
              </span>
              <span className="text-sm text-amber-600/80 dark:text-amber-400/80 font-medium">
                {gift.token_symbol}
              </span>
            </div>
          </div>

          {/* Message */}
          {gift.message && (
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-sm text-foreground italic">"{gift.message}"</p>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-center text-muted-foreground">
            {new Date(gift.created_at).toLocaleString('vi-VN')}
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 gap-2" onClick={copyLink}>
              <Link className="w-4 h-4" /> Sao chép link
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-white gap-2"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
