import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GiftReceiptModal } from './GiftReceiptModal';
import type { GiftData } from '@/hooks/useGifts';

interface GiftReceiptButtonProps {
  gift: GiftData;
  variant?: 'icon' | 'full';
}

export function GiftReceiptButton({ gift, variant = 'icon' }: GiftReceiptButtonProps) {
  const [showReceipt, setShowReceipt] = useState(false);

  return (
    <>
      {variant === 'icon' ? (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowReceipt(true)} title="Biên nhận">
          <FileText className="w-4 h-4 text-muted-foreground hover:text-primary" />
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowReceipt(true)} className="gap-2">
          <FileText className="w-4 h-4" /> Biên nhận
        </Button>
      )}

      <GiftReceiptModal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        gift={gift}
      />
    </>
  );
}
