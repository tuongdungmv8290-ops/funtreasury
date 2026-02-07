import { useState } from "react";
import { Send } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useCamlyWallet } from "@/hooks/useCamlyWallet";
import { useCamlyPrice } from "@/hooks/useCamlyPrice";
import { useAddressLabels } from "@/hooks/useAddressLabels";
import { supabase } from "@/integrations/supabase/client";
import { SendFormStep } from "./SendFormStep";
import { SendConfirmStep } from "./SendConfirmStep";
import { SendSuccessStep } from "./SendSuccessStep";

interface CamlySendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'form' | 'confirm' | 'success';

export function CamlySendModal({ open, onOpenChange }: CamlySendModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [recipient, setRecipient] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState("");

  const wallet = useCamlyWallet();
  const { data: priceData } = useCamlyPrice();
  const { addLabel } = useAddressLabels();
  const camlyPrice = priceData?.price_usd ?? 0;

  const resetForm = () => {
    setStep('form');
    setRecipient("");
    setRecipientName("");
    setAmount("");
    setTxHash("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleConfirmSend = async () => {
    setIsSending(true);
    try {
      const hash = await wallet.sendCamly(recipient, parseFloat(amount));
      if (hash) {
        setTxHash(hash);

        // Save label if name provided
        if (recipientName.trim()) {
          addLabel.mutate({ address: recipient, label: recipientName.trim() });
        }

        // Save transfer record
        const amountNum = parseFloat(amount) || 0;
        await supabase.from('camly_transfers' as any).insert({
          sender_address: wallet.address?.toLowerCase() || '',
          recipient_address: recipient.toLowerCase(),
          recipient_name: recipientName.trim() || null,
          amount: amountNum,
          usd_value: amountNum * camlyPrice,
          tx_hash: hash,
        });

        setStep('success');
      }
    } finally {
      setIsSending(false);
    }
  };

  const stepTitle = {
    form: 'Gửi CAMLY',
    confirm: 'Xác nhận giao dịch',
    success: 'Hoàn tất',
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading gold-text flex items-center gap-2">
            <Send className="w-5 h-5" />
            {stepTitle[step]}
          </DialogTitle>
          {step === 'form' && (
            <DialogDescription>Gửi CAMLY đến địa chỉ ví khác trên BNB Chain</DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">
          {step === 'form' && (
            <SendFormStep
              recipient={recipient} setRecipient={setRecipient}
              recipientName={recipientName} setRecipientName={setRecipientName}
              amount={amount} setAmount={setAmount}
              wallet={wallet} camlyPrice={camlyPrice}
              onNext={() => setStep('confirm')}
            />
          )}
          {step === 'confirm' && (
            <SendConfirmStep
              senderAddress={wallet.address || ''}
              recipient={recipient}
              recipientName={recipientName}
              amount={amount}
              camlyPrice={camlyPrice}
              bnbBalance={wallet.bnbBalance}
              isSending={isSending}
              onConfirm={handleConfirmSend}
              onBack={() => setStep('form')}
            />
          )}
          {step === 'success' && (
            <SendSuccessStep
              amount={amount}
              recipientName={recipientName}
              recipient={recipient}
              txHash={txHash}
              onClose={() => handleClose(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
