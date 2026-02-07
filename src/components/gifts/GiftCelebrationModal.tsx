import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, X, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import type { GiftData } from '@/hooks/useGifts';

interface GiftCelebrationModalProps {
  open: boolean;
  onClose: () => void;
  gift: GiftData | null;
}

export function GiftCelebrationModal({ open, onClose, gift }: GiftCelebrationModalProps) {
  if (!gift) return null;

  const bscScanUrl = gift.tx_hash
    ? `https://bscscan.com/tx/${gift.tx_hash}`
    : null;

  const copyInfo = () => {
    const text = [
      `🎁 FUN Rewards - Chứng nhận tặng thưởng`,
      `Người tặng: ${gift.sender_name || 'N/A'}`,
      `Người nhận: ${gift.receiver_name || 'N/A'}`,
      `Số lượng: ${gift.amount} ${gift.token_symbol}`,
      `Giá trị: ~$${gift.usd_value.toFixed(2)}`,
      gift.message ? `Lời nhắn: "${gift.message}"` : '',
      gift.tx_hash ? `Tx: ${bscScanUrl}` : '',
      `Thời gian: ${new Date(gift.created_at).toLocaleString('vi-VN')}`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    toast.success('Đã copy thông tin!');
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-lg p-0 overflow-hidden border-2 border-treasury-gold/50 bg-background [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Fireworks / Confetti CSS */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                backgroundColor: [
                  'hsl(var(--primary))',
                  '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1',
                  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
                ][i % 9],
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
          {/* Sparkle bursts */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`spark-${i}`}
              className="absolute w-1 h-8 bg-gradient-to-b from-treasury-gold to-transparent animate-firework"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 40}%`,
                transform: `rotate(${i * 45}deg)`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 md:p-8 text-center">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <PartyPopper className="w-14 h-14 mx-auto mb-3 text-treasury-gold animate-bounce" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold gold-text">
              🎉 Chúc mừng!
            </h2>
            <p className="text-muted-foreground mt-1">Bạn đã chuyển thành công!</p>
          </div>

          {/* Receipt Card */}
          <div className="bg-secondary/50 rounded-xl border border-border/60 p-5 text-left space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Người chuyển</span>
              <span className="font-semibold text-foreground">{gift.sender_name || 'N/A'}</span>
            </div>
            <div className="border-t border-border/40" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Người nhận</span>
              <span className="font-semibold text-foreground">{gift.receiver_name || 'N/A'}</span>
            </div>
            <div className="border-t border-border/40" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Số lượng</span>
              <span className="font-mono font-bold gold-text text-lg">
                {gift.amount} {gift.token_symbol}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Giá trị USD</span>
              <span className="font-mono text-foreground">~${gift.usd_value.toFixed(2)}</span>
            </div>
            {gift.message && (
              <>
                <div className="border-t border-border/40" />
                <div>
                  <span className="text-sm text-muted-foreground">Lời nhắn</span>
                  <p className="mt-1 text-foreground italic">"{gift.message}"</p>
                </div>
              </>
            )}
            <div className="border-t border-border/40" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Thời gian</span>
              <span className="text-sm text-foreground">
                {new Date(gift.created_at).toLocaleString('vi-VN')}
              </span>
            </div>
            {gift.tx_hash && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tx Hash</span>
                <a
                  href={bscScanUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {gift.tx_hash.slice(0, 8)}...{gift.tx_hash.slice(-6)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" size="sm" onClick={copyInfo} className="gap-2">
              <Copy className="w-4 h-4" /> Copy
            </Button>
            {bscScanUrl && (
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href={bscScanUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" /> BscScan
                </a>
              </Button>
            )}
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-treasury-gold to-treasury-gold-dark text-white gap-2"
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
