import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateGiftReceiptPDF } from '@/lib/giftReceiptPDF';
import { toast } from 'sonner';
import type { GiftData } from '@/hooks/useGifts';

interface GiftReceiptButtonProps {
  gift: GiftData;
  variant?: 'icon' | 'full';
}

export function GiftReceiptButton({ gift, variant = 'icon' }: GiftReceiptButtonProps) {
  const handleExport = () => {
    try {
      generateGiftReceiptPDF(gift);
      toast.success('Đã tải PDF chứng nhận!');
    } catch {
      toast.error('Lỗi xuất PDF');
    }
  };

  if (variant === 'icon') {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExport} title="Xuất PDF">
        <FileText className="w-4 h-4 text-muted-foreground hover:text-primary" />
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
      <FileText className="w-4 h-4" /> Tải chứng nhận
    </Button>
  );
}
