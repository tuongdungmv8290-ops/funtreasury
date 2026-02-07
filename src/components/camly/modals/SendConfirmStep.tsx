import { ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/formatNumber";

interface SendConfirmStepProps {
  senderAddress: string;
  recipient: string;
  recipientName: string;
  amount: string;
  camlyPrice: number;
  bnbBalance: number;
  isSending: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function SendConfirmStep({
  senderAddress, recipient, recipientName,
  amount, camlyPrice, bnbBalance,
  isSending, onConfirm, onBack,
}: SendConfirmStepProps) {
  const amountNum = parseFloat(amount) || 0;
  const usdValue = amountNum * camlyPrice;

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
        {/* From → To */}
        <div className="flex items-center gap-3">
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground">Từ</p>
            <p className="font-mono text-sm font-medium">{shortenAddress(senderAddress)}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground">Đến</p>
            {recipientName ? (
              <p className="font-semibold text-sm text-yellow-500">{recipientName}</p>
            ) : (
              <p className="font-mono text-sm font-medium">{shortenAddress(recipient)}</p>
            )}
            <p className="font-mono text-[10px] text-muted-foreground">{shortenAddress(recipient)}</p>
          </div>
        </div>

        <div className="border-t border-border pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Số lượng</span>
            <span className="font-mono font-bold">{formatNumber(amountNum, { compact: true })} CAMLY</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Giá trị</span>
            <span className="font-mono">≈ ${formatNumber(usdValue, { maxDecimals: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phí gas (ước tính)</span>
            <span className="font-mono text-xs">~0.0005 BNB</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Số dư BNB</span>
            <span>{bnbBalance.toFixed(4)} BNB</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} disabled={isSending} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
        </Button>
        <Button onClick={onConfirm} disabled={isSending} className="flex-1 bg-primary hover:bg-primary/90">
          {isSending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang gửi...</>
          ) : "Xác nhận gửi"}
        </Button>
      </div>
    </div>
  );
}
