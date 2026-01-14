import { Copy, ExternalLink, Check, ArrowDownUp, Settings } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CAMLY_CONTRACT, PANCAKESWAP_URL, ONEINCH_URL } from "@/hooks/useCamlyWallet";
import { useCamlyPrice } from "@/hooks/useCamlyPrice";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/formatNumber";
import camlyLogo from "@/assets/camly-coin-gold-logo.png";

interface CamlySwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SwapDirection = 'BNB_TO_CAMLY' | 'CAMLY_TO_BNB';

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1];

export function CamlySwapModal({ open, onOpenChange }: CamlySwapModalProps) {
  const [copied, setCopied] = useState(false);
  const [direction, setDirection] = useState<SwapDirection>('BNB_TO_CAMLY');
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState('');
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);

  const { data: priceData } = useCamlyPrice();
  const { data: cryptoPrices } = useCryptoPrices();

  const camlyPrice = priceData?.price_usd ?? 0;
  const bnbPrice = cryptoPrices?.find(c => c.symbol.toLowerCase() === 'bnb')?.current_price ?? 710;

  const isBnbToCamly = direction === 'BNB_TO_CAMLY';
  const fromToken = isBnbToCamly ? 'BNB' : 'CAMLY';
  const toToken = isBnbToCamly ? 'CAMLY' : 'BNB';

  // Calculate swap amounts
  const { toAmount, minReceived, rate, fromUSD, toUSD } = useMemo(() => {
    const from = parseFloat(fromAmount) || 0;
    const activeSlippage = customSlippage ? parseFloat(customSlippage) : slippage;
    
    if (!from || !camlyPrice || !bnbPrice) {
      return { toAmount: 0, minReceived: 0, rate: 0, fromUSD: 0, toUSD: 0 };
    }

    if (isBnbToCamly) {
      const rate = bnbPrice / camlyPrice;
      const toAmount = from * rate;
      const minReceived = toAmount * (1 - activeSlippage / 100);
      const fromUSD = from * bnbPrice;
      const toUSD = toAmount * camlyPrice;
      return { toAmount, minReceived, rate, fromUSD, toUSD };
    } else {
      const rate = camlyPrice / bnbPrice;
      const toAmount = from * rate;
      const minReceived = toAmount * (1 - activeSlippage / 100);
      const fromUSD = from * camlyPrice;
      const toUSD = toAmount * bnbPrice;
      return { toAmount, minReceived, rate, fromUSD, toUSD };
    }
  }, [fromAmount, camlyPrice, bnbPrice, isBnbToCamly, slippage, customSlippage]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(CAMLY_CONTRACT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwapDirection = () => {
    setDirection(prev => prev === 'BNB_TO_CAMLY' ? 'CAMLY_TO_BNB' : 'BNB_TO_CAMLY');
    setFromAmount('');
  };

  const handleSlippageSelect = (value: number) => {
    setSlippage(value);
    setCustomSlippage('');
  };

  // Generate swap URLs with pre-filled amounts
  const pancakeSwapUrl = useMemo(() => {
    const baseUrl = 'https://pancakeswap.finance/swap';
    if (isBnbToCamly) {
      return `${baseUrl}?inputCurrency=BNB&outputCurrency=${CAMLY_CONTRACT}${fromAmount ? `&exactAmount=${fromAmount}` : ''}`;
    } else {
      return `${baseUrl}?inputCurrency=${CAMLY_CONTRACT}&outputCurrency=BNB${fromAmount ? `&exactAmount=${fromAmount}` : ''}`;
    }
  }, [isBnbToCamly, fromAmount]);

  const oneInchUrl = useMemo(() => {
    const baseUrl = 'https://app.1inch.io/#/56/simple/swap';
    if (isBnbToCamly) {
      return `${baseUrl}/BNB/${CAMLY_CONTRACT}`;
    } else {
      return `${baseUrl}/${CAMLY_CONTRACT}/BNB`;
    }
  }, [isBnbToCamly]);

  const activeSlippage = customSlippage ? parseFloat(customSlippage) : slippage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading gold-text flex items-center gap-2">
            <ArrowDownUp className="w-5 h-5" />
            Hoán đổi CAMLY
          </DialogTitle>
          <DialogDescription>
            Swap giữa CAMLY và BNB trên BNB Chain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* From Token Input */}
          <div className="bg-muted/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Từ</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 min-w-[110px]">
                {isBnbToCamly ? (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
                    B
                  </div>
                ) : (
                  <img src={camlyLogo} alt="CAMLY" className="w-7 h-7 rounded-full" />
                )}
                <span className="font-semibold">{fromToken}</span>
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="flex-1 text-right font-mono text-xl border-0 bg-transparent h-12"
              />
            </div>
            {fromAmount && (
              <p className="text-sm text-muted-foreground text-right">
                ≈ ${formatNumber(fromUSD, { maxDecimals: 2 })}
              </p>
            )}
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwapDirection}
              className={cn(
                "h-10 w-10 rounded-full border-2 border-primary/30",
                "bg-background hover:bg-primary/10 hover:border-primary",
                "transition-all duration-300 hover:rotate-180",
                "shadow-md"
              )}
            >
              <ArrowDownUp className="w-5 h-5 text-primary" />
            </Button>
          </div>

          {/* To Token Display */}
          <div className="bg-muted/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Đến (ước tính)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 min-w-[110px]">
                {!isBnbToCamly ? (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
                    B
                  </div>
                ) : (
                  <img src={camlyLogo} alt="CAMLY" className="w-7 h-7 rounded-full" />
                )}
                <span className="font-semibold">{toToken}</span>
              </div>
              <div className="flex-1 text-right font-mono text-xl text-foreground/80">
                {toAmount > 0 ? (
                  isBnbToCamly 
                    ? formatNumber(toAmount, { compact: true })
                    : formatNumber(toAmount, { maxDecimals: 6 })
                ) : (
                  <span className="text-muted-foreground">0.00</span>
                )}
              </div>
            </div>
            {toAmount > 0 && (
              <p className="text-sm text-muted-foreground text-right">
                ≈ ${formatNumber(toUSD, { maxDecimals: 2 })}
              </p>
            )}
          </div>

          {/* Transaction Details */}
          <div className="bg-muted/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Chi tiết giao dịch</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSlippageSettings(!showSlippageSettings)}
                className="h-7 px-2 text-xs gap-1"
              >
                <Settings className="w-3 h-3" />
                {activeSlippage}%
              </Button>
            </div>

            {/* Slippage Settings */}
            {showSlippageSettings && (
              <div className="bg-background rounded-lg p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Slippage Tolerance</p>
                <div className="flex items-center gap-2">
                  {SLIPPAGE_OPTIONS.map((option) => (
                    <Button
                      key={option}
                      variant={slippage === option && !customSlippage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSlippageSelect(option)}
                      className="h-7 px-3 text-xs"
                    >
                      {option}%
                    </Button>
                  ))}
                  <Input
                    type="number"
                    placeholder="Custom"
                    value={customSlippage}
                    onChange={(e) => setCustomSlippage(e.target.value)}
                    className="w-20 h-7 text-xs text-center"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
            )}

            {toAmount > 0 && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tỷ giá</span>
                  <span className="font-mono">
                    1 {fromToken} = {isBnbToCamly 
                      ? formatNumber(rate, { compact: true }) 
                      : formatNumber(rate, { maxDecimals: 8 })} {toToken}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Min nhận ({activeSlippage}% slip)</span>
                  <span className="font-mono">
                    {isBnbToCamly 
                      ? formatNumber(minReceived, { compact: true })
                      : formatNumber(minReceived, { maxDecimals: 6 })} {toToken}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Network fee</span>
                  <span className="font-mono">~0.0005 BNB ($0.35)</span>
                </div>
              </div>
            )}
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

        </div>
      </DialogContent>
    </Dialog>
  );
}
