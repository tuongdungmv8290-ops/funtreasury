import { useState } from "react";
import { Send, Wallet, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCamlyWallet } from "@/hooks/useCamlyWallet";
import { useCamlyPrice } from "@/hooks/useCamlyPrice";
import { formatNumber } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";
import { ethers } from "ethers";

interface CamlySendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CamlySendModal({ open, onOpenChange }: CamlySendModalProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);

  const wallet = useCamlyWallet();
  const { data: priceData } = useCamlyPrice();
  const camlyPrice = priceData?.price_usd ?? 0;

  const amountNum = parseFloat(amount) || 0;
  const usdValue = amountNum * camlyPrice;
  const isValidAddress = recipient.length === 42 && recipient.startsWith("0x");
  const hasEnoughBalance = amountNum <= wallet.camlyBalance;
  const canSend = isValidAddress && amountNum > 0 && hasEnoughBalance && wallet.isCorrectChain;

  const handleMax = () => {
    setAmount(wallet.camlyBalance.toString());
  };

  const handleSend = async () => {
    if (!canSend) return;

    setIsSending(true);
    try {
      const txHash = await wallet.sendCamly(recipient, amountNum);
      if (txHash) {
        setRecipient("");
        setAmount("");
        onOpenChange(false);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading gold-text flex items-center gap-2">
            <Send className="w-5 h-5" />
            Gửi CAMLY
          </DialogTitle>
          <DialogDescription>
            Gửi CAMLY đến địa chỉ ví khác trên BNB Chain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Wallet Connection Required */}
          {!wallet.isConnected ? (
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
              <Button
                onClick={wallet.connectWallet}
                disabled={wallet.isConnecting}
                className="w-full"
              >
                {wallet.isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang kết nối...
                  </>
                ) : (
                  "Kết nối ví"
                )}
              </Button>
            </div>
          ) : !wallet.isCorrectChain ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-outflow/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-outflow" />
              </div>
              <div>
                <p className="font-medium">Sai mạng</p>
                <p className="text-sm text-muted-foreground">
                  Vui lòng chuyển sang BNB Smart Chain để tiếp tục
                </p>
              </div>
              <Button onClick={wallet.switchToBSC} className="w-full">
                Chuyển sang BNB Chain
              </Button>
            </div>
          ) : (
            <>
              {/* Balance Display */}
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

              {/* Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="amount">Số lượng CAMLY</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMax}
                    className="text-xs text-primary h-auto py-1"
                  >
                    MAX
                  </Button>
                </div>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={cn(
                    "font-mono",
                    amountNum > 0 && !hasEnoughBalance && "border-outflow focus-visible:ring-outflow"
                  )}
                />
                {amountNum > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      ≈ ${formatNumber(usdValue, { maxDecimals: 4 })}
                    </span>
                    {!hasEnoughBalance && (
                      <span className="text-outflow">Số dư không đủ</span>
                    )}
                  </div>
                )}
              </div>

              {/* Gas Note */}
              <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                ⛽ Phí gas sẽ được thanh toán bằng BNB. Số dư BNB: {wallet.bnbBalance.toFixed(4)} BNB
              </p>

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={!canSend || isSending}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Gửi CAMLY
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
