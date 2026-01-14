import { Copy, Check, Wallet, QrCode, Loader2 } from "lucide-react";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCamlyWallet, CAMLY_CONTRACT } from "@/hooks/useCamlyWallet";
import { cn } from "@/lib/utils";

interface CamlyReceiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CamlyReceiveModal({ open, onOpenChange }: CamlyReceiveModalProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

  const wallet = useCamlyWallet();

  const handleCopyAddress = async () => {
    if (!wallet.address) return;
    await navigator.clipboard.writeText(wallet.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyContract = async () => {
    await navigator.clipboard.writeText(CAMLY_CONTRACT);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading gold-text flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Nhận CAMLY
          </DialogTitle>
          <DialogDescription>
            Chia sẻ địa chỉ ví của bạn để nhận CAMLY trên BNB Chain
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
                  Vui lòng kết nối ví để xem địa chỉ nhận CAMLY
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
          ) : (
            <>
              {/* QR Code */}
              <div className="flex justify-center">
                <div className={cn(
                  "p-4 rounded-2xl",
                  "bg-white",
                  "ring-4 ring-primary/30",
                  "shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                )}>
                  <QRCodeSVG
                    value={wallet.address || ''}
                    size={180}
                    level="H"
                    includeMargin={false}
                    fgColor="#1a1a1a"
                    bgColor="#ffffff"
                  />
                </div>
              </div>

              {/* Network Badge */}
              <div className="flex justify-center">
                <span className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-sm font-medium">
                  BNB Smart Chain
                </span>
              </div>

              {/* Wallet Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Địa chỉ ví của bạn
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted/50 px-3 py-2 rounded-lg text-xs font-mono break-all">
                    {wallet.address}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyAddress}
                    className="shrink-0"
                  >
                    {copiedAddress ? (
                      <Check className="w-4 h-4 text-inflow" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* CAMLY Contract */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  CAMLY Contract (để thêm vào ví)
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted/50 px-3 py-2 rounded-lg text-xs font-mono break-all">
                    {CAMLY_CONTRACT}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyContract}
                    className="shrink-0"
                  >
                    {copiedContract ? (
                      <Check className="w-4 h-4 text-inflow" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                <p className="font-medium mb-1">💡 Hướng dẫn:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Chia sẻ địa chỉ ví hoặc QR code với người gửi</li>
                  <li>Đảm bảo người gửi đang trên BNB Smart Chain</li>
                  <li>Nếu token chưa hiện, thêm CAMLY Contract vào ví</li>
                </ol>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
