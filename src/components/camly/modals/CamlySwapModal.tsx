import { Copy, ExternalLink, Check, ArrowDownUp } from "lucide-react";
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
import { useCamlyPrice } from "@/hooks/useCamlyPrice";
import { cn } from "@/lib/utils";

interface CamlySwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CamlySwapModal({ open, onOpenChange }: CamlySwapModalProps) {
  const [copied, setCopied] = useState(false);
  const { data: priceData } = useCamlyPrice();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(CAMLY_CONTRACT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const camlyPrice = priceData?.price_usd ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading gold-text flex items-center gap-2">
            <ArrowDownUp className="w-5 h-5" />
            Hoán đổi CAMLY
          </DialogTitle>
          <DialogDescription>
            Swap giữa CAMLY và các token khác trên BNB Chain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Rate */}
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Tỷ giá hiện tại</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-bold text-primary">
                1 CAMLY = ${camlyPrice.toFixed(8)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              1 BNB ≈ {(710 / camlyPrice).toLocaleString('en-US', { maximumFractionDigits: 0 })} CAMLY
            </p>
          </div>

          {/* Contract Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Contract Address
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
                  <p className="font-semibold">Swap trên PancakeSwap</p>
                  <p className="text-sm text-muted-foreground">
                    Thanh khoản tốt nhất
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
                  <p className="font-semibold">Swap trên 1inch</p>
                  <p className="text-sm text-muted-foreground">
                    Tìm giá tốt nhất từ nhiều DEX
                  </p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
            </a>
          </div>

          {/* Supported Pairs */}
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Cặp giao dịch phổ biến:</p>
            <div className="flex flex-wrap gap-2">
              {['BNB/CAMLY', 'USDT/CAMLY', 'BUSD/CAMLY'].map((pair) => (
                <span
                  key={pair}
                  className="px-2 py-1 bg-background rounded text-xs font-mono"
                >
                  {pair}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
