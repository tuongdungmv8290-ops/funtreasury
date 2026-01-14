import { Copy, ExternalLink, Check } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CAMLY_CONTRACT, PANCAKESWAP_URL, ONEINCH_URL } from "@/hooks/useCamlyWallet";
import { cn } from "@/lib/utils";

interface CamlyBuyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CamlyBuyModal({ open, onOpenChange }: CamlyBuyModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(CAMLY_CONTRACT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading gold-text">
            Mua CAMLY
          </DialogTitle>
          <DialogDescription>
            Chọn sàn giao dịch để mua CAMLY trên BNB Chain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Contract Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Contract Address (BSC)
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted/50 px-3 py-2 rounded-lg text-xs font-mono break-all">
                {CAMLY_CONTRACT}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-inflow" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* DEX Links */}
          <div className="space-y-3">
            <a
              href={PANCAKESWAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "border border-border/50 bg-card/50",
                "hover:border-primary hover:bg-primary/5 transition-colors",
                "group"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold">
                  🥞
                </div>
                <div>
                  <p className="font-semibold">PancakeSwap</p>
                  <p className="text-sm text-muted-foreground">
                    DEX lớn nhất trên BNB Chain
                  </p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
            </a>

            <a
              href={ONEINCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "border border-border/50 bg-card/50",
                "hover:border-primary hover:bg-primary/5 transition-colors",
                "group"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  1"
                </div>
                <div>
                  <p className="font-semibold">1inch</p>
                  <p className="text-sm text-muted-foreground">
                    Aggregator tìm giá tốt nhất
                  </p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
            </a>
          </div>

          {/* Help Text */}
          <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium mb-1">💡 Hướng dẫn:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Kết nối ví MetaMask/Trust với BNB Chain</li>
              <li>Chọn sàn giao dịch ở trên</li>
              <li>Swap BNB hoặc USDT sang CAMLY</li>
              <li>Nếu token chưa hiện, paste Contract Address vào ví</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
