import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import camlyLogo from "@/assets/camly-coin-gold-logo.png";

const CAMLY_CONTRACT = "0x816C6DA6B5da2d42d8a93a61b1df49df60cF5Be3";

const SWAP_OPTIONS = [
  {
    name: "PancakeSwap",
    icon: "🥞",
    description: "DEX phổ biến nhất BSC",
    url: `https://pancakeswap.finance/swap?outputCurrency=${CAMLY_CONTRACT}`,
  },
  {
    name: "1inch",
    icon: "🦄",
    description: "Tìm giá tốt nhất",
    url: `https://app.1inch.io/#/56/simple/swap/BNB/${CAMLY_CONTRACT}`,
  },
];

interface CamlyTradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CamlyTradeModal({ open, onOpenChange }: CamlyTradeModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyContract = async () => {
    try {
      await navigator.clipboard.writeText(CAMLY_CONTRACT);
      setCopied(true);
      toast({
        title: "Đã copy!",
        description: "Contract address đã được copy vào clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể copy, vui lòng copy thủ công",
        variant: "destructive",
      });
    }
  };

  const handleOpenSwap = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-md",
          "border-2 border-primary/50",
          "bg-gradient-to-br from-background via-card to-primary/5",
          "shadow-[0_0_40px_rgba(212,175,55,0.2)]"
        )}
      >
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary/50 shadow-lg">
              <img
                src={camlyLogo}
                alt="CAMLY"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <DialogTitle className="text-2xl font-heading gold-text">
            Trade CAMLY
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contract Address Section */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Contract Address (BSC)
            </p>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
              <code className="flex-1 text-xs font-mono text-foreground truncate">
                {CAMLY_CONTRACT}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyContract}
                className="shrink-0 hover:bg-primary/20"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-inflow" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Swap Options */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-center">Chọn sàn để Swap:</p>
            <div className="space-y-2">
              {SWAP_OPTIONS.map((option) => (
                <button
                  key={option.name}
                  onClick={() => handleOpenSwap(option.url)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl",
                    "border border-border/50 hover:border-primary/50",
                    "bg-card/50 hover:bg-primary/10",
                    "transition-all duration-200",
                    "group"
                  )}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {option.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground text-center">
              💡 <strong>Tip:</strong> Copy contract và paste vào ví MetaMask, Trust hoặc Bitget để swap trực tiếp trong app ví
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
