import { useEffect } from "react";
import { Wallet, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";
import { useAddressLabels } from "@/hooks/useAddressLabels";

interface SendFormStepProps {
  recipient: string;
  setRecipient: (v: string) => void;
  recipientName: string;
  setRecipientName: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  wallet: {
    isConnected: boolean;
    isConnecting: boolean;
    isCorrectChain: boolean;
    connectWallet: () => void;
    switchToBSC: () => void;
    camlyBalance: number;
    bnbBalance: number;
  };
  camlyPrice: number;
  onNext: () => void;
}

export function SendFormStep({
  recipient, setRecipient,
  recipientName, setRecipientName,
  amount, setAmount,
  wallet, camlyPrice, onNext,
}: SendFormStepProps) {
  const { getLabel } = useAddressLabels();

  const amountNum = parseFloat(amount) || 0;
  const usdValue = amountNum * camlyPrice;
  const isValidAddress = recipient.length === 42 && recipient.startsWith("0x");
  const hasEnoughBalance = amountNum <= wallet.camlyBalance;
  const canProceed = isValidAddress && amountNum > 0 && hasEnoughBalance && wallet.isCorrectChain;

  // Auto-fill recipient name from address_labels
  useEffect(() => {
    if (isValidAddress) {
      const { label, isLabeled } = getLabel(recipient);
      if (isLabeled && !recipientName) {
        setRecipientName(label);
      }
    }
  }, [recipient, isValidAddress]);

  if (!wallet.isConnected) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
          <Wallet className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Cần kết nối ví</p>
          <p className="text-sm text-muted-foreground">
            Vui lòng kết nối ví MetaMask hoặc Trust Wallet để gửi CAMLY
          </p>
        </div>
        <Button onClick={wallet.connectWallet} disabled={wallet.isConnecting} className="w-full">
          {wallet.isConnecting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang kết nối...</>
          ) : "Kết nối ví"}
        </Button>
      </div>
    );
  }

  if (!wallet.isCorrectChain) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-outflow/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-outflow" />
        </div>
        <div>
          <p className="font-medium">Sai mạng</p>
          <p className="text-sm text-muted-foreground">Vui lòng chuyển sang BNB Smart Chain</p>
        </div>
        <Button onClick={wallet.switchToBSC} className="w-full">Chuyển sang BNB Chain</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance */}
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
        <p className="text-sm text-muted-foreground">Số dư khả dụng</p>
        <p className="font-mono text-xl font-bold text-primary">
          {formatNumber(wallet.camlyBalance, { compact: true })} CAMLY
        </p>
        <p className="text-xs text-muted-foreground">
          ≈ ${formatNumber(wallet.camlyBalance * camlyPrice, { maxDecimals: 2 })}
        </p>
      </div>

      {/* Recipient Address */}
      <div className="space-y-2">
        <Label htmlFor="recipient">Địa chỉ người nhận</Label>
        <Input
          id="recipient"
          placeholder="0x..."
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className={cn(
            "font-mono text-sm",
            recipient && !isValidAddress && "border-outflow focus-visible:ring-outflow"
          )}
        />
        {recipient && !isValidAddress && (
          <p className="text-xs text-outflow">Địa chỉ ví không hợp lệ</p>
        )}
      </div>

      {/* Recipient Name */}
      <div className="space-y-2">
        <Label htmlFor="recipientName">Tên người nhận (tùy chọn)</Label>
        <Input
          id="recipientName"
          placeholder="VD: Nguyễn Văn A, Team Member..."
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Tên sẽ được lưu lại để hiển thị trong lịch sử</p>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="amount">Số lượng CAMLY</Label>
          <Button
            variant="ghost" size="sm"
            onClick={() => setAmount(wallet.camlyBalance.toString())}
            className="text-xs text-primary h-auto py-1"
          >MAX</Button>
        </div>
        <Input
          id="amount" type="number" placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={cn("font-mono", amountNum > 0 && !hasEnoughBalance && "border-outflow focus-visible:ring-outflow")}
        />
        {amountNum > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">≈ ${formatNumber(usdValue, { maxDecimals: 4 })}</span>
            {!hasEnoughBalance && <span className="text-outflow">Số dư không đủ</span>}
          </div>
        )}
      </div>

      {/* Gas Note */}
      <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
        ⛽ Phí gas sẽ được thanh toán bằng BNB. Số dư BNB: {wallet.bnbBalance.toFixed(4)} BNB
      </p>

      {/* Next Button */}
      <Button onClick={onNext} disabled={!canProceed} className="w-full bg-primary hover:bg-primary/90">
        Tiếp tục
      </Button>
    </div>
  );
}
