import { CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/formatNumber";

interface SendSuccessStepProps {
  amount: string;
  recipientName: string;
  recipient: string;
  txHash: string;
  onClose: () => void;
}

export function SendSuccessStep({ amount, recipientName, recipient, txHash, onClose }: SendSuccessStepProps) {
  const amountNum = parseFloat(amount) || 0;
  const displayName = recipientName || `${recipient.slice(0, 6)}...${recipient.slice(-4)}`;

  return (
    <div className="text-center py-4 space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>

      <div>
        <p className="text-lg font-bold">Gửi thành công!</p>
        <p className="text-sm text-muted-foreground mt-1">
          Đã gửi <span className="font-mono font-semibold text-primary">{formatNumber(amountNum, { compact: true })} CAMLY</span> đến{" "}
          <span className="font-semibold text-yellow-500">{displayName}</span>
        </p>
      </div>

      {txHash && (
        <a
          href={`https://bscscan.com/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Xem trên BscScan <ExternalLink className="w-3 h-3" />
        </a>
      )}

      <Button onClick={onClose} className="w-full">Đóng</Button>
    </div>
  );
}
