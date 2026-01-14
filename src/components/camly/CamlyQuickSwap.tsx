import { useState, useMemo } from "react";
import { ArrowDownUp, Settings, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/formatNumber";
import { CAMLY_CONTRACT, PANCAKESWAP_URL } from "@/hooks/useCamlyWallet";
import camlyLogo from "@/assets/camly-coin-gold-logo.png";

interface CamlyQuickSwapProps {
  camlyPrice: number;
  bnbPrice: number;
  camlyBalance: number;
  bnbBalance: number;
  isConnected: boolean;
}

type SwapDirection = 'BNB_TO_CAMLY' | 'CAMLY_TO_BNB';

export function CamlyQuickSwap({
  camlyPrice,
  bnbPrice,
  camlyBalance,
  bnbBalance,
  isConnected,
}: CamlyQuickSwapProps) {
  const [direction, setDirection] = useState<SwapDirection>('BNB_TO_CAMLY');
  const [fromAmount, setFromAmount] = useState('');
  const [slippage] = useState(0.5);

  const isBnbToCamly = direction === 'BNB_TO_CAMLY';
  const fromToken = isBnbToCamly ? 'BNB' : 'CAMLY';
  const toToken = isBnbToCamly ? 'CAMLY' : 'BNB';
  const fromBalance = isBnbToCamly ? bnbBalance : camlyBalance;

  // Calculate swap amounts
  const { toAmount, minReceived, rate, fromUSD, toUSD } = useMemo(() => {
    const from = parseFloat(fromAmount) || 0;
    
    if (!from || !camlyPrice || !bnbPrice) {
      return { toAmount: 0, minReceived: 0, rate: 0, fromUSD: 0, toUSD: 0 };
    }

    if (isBnbToCamly) {
      const rate = bnbPrice / camlyPrice;
      const toAmount = from * rate;
      const minReceived = toAmount * (1 - slippage / 100);
      const fromUSD = from * bnbPrice;
      const toUSD = toAmount * camlyPrice;
      return { toAmount, minReceived, rate, fromUSD, toUSD };
    } else {
      const rate = camlyPrice / bnbPrice;
      const toAmount = from * rate;
      const minReceived = toAmount * (1 - slippage / 100);
      const fromUSD = from * camlyPrice;
      const toUSD = toAmount * bnbPrice;
      return { toAmount, minReceived, rate, fromUSD, toUSD };
    }
  }, [fromAmount, camlyPrice, bnbPrice, isBnbToCamly, slippage]);

  const handleSwapDirection = () => {
    setDirection(prev => prev === 'BNB_TO_CAMLY' ? 'CAMLY_TO_BNB' : 'BNB_TO_CAMLY');
    setFromAmount('');
  };

  const handleMax = () => {
    if (isBnbToCamly) {
      // Leave some BNB for gas
      const maxBnb = Math.max(0, bnbBalance - 0.005);
      setFromAmount(maxBnb.toString());
    } else {
      setFromAmount(camlyBalance.toString());
    }
  };

  // Generate PancakeSwap URL with pre-filled amount
  const swapUrl = useMemo(() => {
    const baseUrl = 'https://pancakeswap.finance/swap';
    if (isBnbToCamly) {
      return `${baseUrl}?inputCurrency=BNB&outputCurrency=${CAMLY_CONTRACT}${fromAmount ? `&exactAmount=${fromAmount}` : ''}`;
    } else {
      return `${baseUrl}?inputCurrency=${CAMLY_CONTRACT}&outputCurrency=BNB${fromAmount ? `&exactAmount=${fromAmount}` : ''}`;
    }
  }, [isBnbToCamly, fromAmount]);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-sm">Swap Nhanh</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Settings className="w-3 h-3" />
          <span>{slippage}% slippage</span>
        </div>
      </div>

      {/* From Token */}
      <div className="bg-muted/30 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Từ</span>
          <span>Số dư: {formatNumber(fromBalance, { maxDecimals: 4 })} {fromToken}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 min-w-[100px]">
            {isBnbToCamly ? (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                B
              </div>
            ) : (
              <img src={camlyLogo} alt="CAMLY" className="w-6 h-6 rounded-full" />
            )}
            <span className="font-medium text-sm">{fromToken}</span>
          </div>
          <Input
            type="number"
            placeholder="0.00"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            className="flex-1 text-right font-mono border-0 bg-transparent text-lg h-10"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMax}
            className="text-xs text-primary h-7 px-2"
          >
            MAX
          </Button>
        </div>
        {fromAmount && (
          <p className="text-xs text-muted-foreground text-right">
            ≈ ${formatNumber(fromUSD, { maxDecimals: 2 })}
          </p>
        )}
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center -my-1">
        <Button
          variant="outline"
          size="icon"
          onClick={handleSwapDirection}
          className={cn(
            "h-8 w-8 rounded-full border-2 border-primary/30",
            "bg-background hover:bg-primary/10 hover:border-primary",
            "transition-all duration-300 hover:rotate-180"
          )}
        >
          <ArrowDownUp className="w-4 h-4 text-primary" />
        </Button>
      </div>

      {/* To Token */}
      <div className="bg-muted/30 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Đến (ước tính)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 min-w-[100px]">
            {!isBnbToCamly ? (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                B
              </div>
            ) : (
              <img src={camlyLogo} alt="CAMLY" className="w-6 h-6 rounded-full" />
            )}
            <span className="font-medium text-sm">{toToken}</span>
          </div>
          <div className="flex-1 text-right font-mono text-lg text-foreground/80">
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
          <p className="text-xs text-muted-foreground text-right">
            ≈ ${formatNumber(toUSD, { maxDecimals: 2 })}
          </p>
        )}
      </div>

      {/* Rate & Min Received */}
      {toAmount > 0 && (
        <div className="bg-muted/20 rounded-lg p-2 space-y-1 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Tỷ giá</span>
            <span className="font-mono">
              1 {fromToken} = {isBnbToCamly 
                ? formatNumber(rate, { compact: true }) 
                : formatNumber(rate, { maxDecimals: 8 })} {toToken}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Min nhận ({slippage}% slip)</span>
            <span className="font-mono">
              {isBnbToCamly 
                ? formatNumber(minReceived, { compact: true })
                : formatNumber(minReceived, { maxDecimals: 6 })} {toToken}
            </span>
          </div>
        </div>
      )}

      {/* Swap Button */}
      <a
        href={swapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button
          className={cn(
            "w-full gap-2",
            "bg-gradient-to-r from-amber-500 to-amber-600",
            "hover:from-amber-600 hover:to-amber-700",
            "text-white font-medium"
          )}
        >
          <span>🥞</span>
          Swap trên PancakeSwap
          <ExternalLink className="w-4 h-4" />
        </Button>
      </a>
    </div>
  );
}
