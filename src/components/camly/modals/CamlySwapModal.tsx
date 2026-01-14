import { Copy, Check, ArrowDownUp, Settings, Loader2, ExternalLink } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CAMLY_CONTRACT } from "@/hooks/useCamlyWallet";
import { useCamlyPrice } from "@/hooks/useCamlyPrice";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { usePancakeSwap, type TokenInfo } from "@/hooks/usePancakeSwap";
import { useSwapHistory } from "@/hooks/useSwapHistory";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/formatNumber";
import { toast } from "sonner";
import camlyLogo from "@/assets/camly-coin-gold-logo.png";
import { TokenSelector, POPULAR_TOKENS } from "../TokenSelector";

interface CamlySwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SLIPPAGE_OPTIONS = [0.5, 1, 3];

// CAMLY Token info
const CAMLY_TOKEN: TokenInfo = {
  symbol: 'CAMLY',
  name: 'Camly Coin',
  address: CAMLY_CONTRACT,
  decimals: 18,
};

// BNB as default from token
const BNB_TOKEN: TokenInfo = {
  symbol: 'BNB',
  name: 'BNB',
  address: 'BNB',
  decimals: 18,
};

export function CamlySwapModal({ open, onOpenChange }: CamlySwapModalProps) {
  const [copied, setCopied] = useState(false);
  const [fromToken, setFromToken] = useState<TokenInfo>(BNB_TOKEN);
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState(1);
  const [customSlippage, setCustomSlippage] = useState('');
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<Record<string, number>>({});
  const [isBuying, setIsBuying] = useState(true); // true = buy CAMLY, false = sell CAMLY
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [quote, setQuote] = useState<any>(null);

  const { data: priceData } = useCamlyPrice();
  const { data: cryptoPrices } = useCryptoPrices();
  const { getQuote, executeSwap, getTokenBalance, isApproving, isSwapping } = usePancakeSwap();
  const { addSwap } = useSwapHistory(walletAddress);

  const camlyPrice = priceData?.price_usd ?? 0;

  // Get wallet address
  useEffect(() => {
    const getWallet = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
          if (accounts?.[0]) {
            setWalletAddress(accounts[0]);
          }
        } catch (e) {
          console.error('Failed to get wallet address:', e);
        }
      }
    };
    if (open) {
      getWallet();
    }
  }, [open]);

  // Fetch token balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!walletAddress) return;
      
      const balances: Record<string, number> = {};
      
      // Get BNB balance
      try {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const provider = (window as any).ethereum;
          const balance = await provider.request({
            method: 'eth_getBalance',
            params: [walletAddress, 'latest']
          });
          balances['bnb'] = parseFloat(balance) / 1e18;
        }
      } catch (e) {
        console.error('Failed to get BNB balance:', e);
      }

      // Get CAMLY balance
      try {
        const camlyBalance = await getTokenBalance(CAMLY_CONTRACT, walletAddress, 18);
        balances[CAMLY_CONTRACT.toLowerCase()] = camlyBalance;
      } catch (e) {
        console.error('Failed to get CAMLY balance:', e);
      }

      // Get other popular token balances
      for (const token of POPULAR_TOKENS.slice(0, 10)) {
        if (token.address !== 'BNB') {
          try {
            const balance = await getTokenBalance(token.address, walletAddress, token.decimals);
            balances[token.address.toLowerCase()] = balance;
          } catch (e) {
            // Ignore errors for tokens user might not have
          }
        }
      }

      setTokenBalances(balances);
    };

    if (open && walletAddress) {
      fetchBalances();
    }
  }, [open, walletAddress, getTokenBalance]);

  // Get token price
  const getTokenPrice = useCallback((symbol: string): number => {
    if (symbol === 'CAMLY') return camlyPrice;
    const crypto = cryptoPrices?.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
    return crypto?.current_price ?? 0;
  }, [cryptoPrices, camlyPrice]);

  // Fetch quote when inputs change
  useEffect(() => {
    const fetchQuote = async () => {
      const amount = parseFloat(fromAmount);
      if (!amount || amount <= 0) {
        setQuote(null);
        return;
      }

      const activeSlippage = customSlippage ? parseFloat(customSlippage) : slippage;
      
      try {
        const quoteResult = await getQuote(
          isBuying ? fromToken : CAMLY_TOKEN,
          isBuying ? CAMLY_TOKEN : fromToken,
          amount.toString(),
          activeSlippage
        );
        setQuote(quoteResult);
      } catch (e) {
        console.error('Failed to get quote:', e);
        setQuote(null);
      }
    };

    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fromAmount, fromToken, isBuying, slippage, customSlippage, getQuote]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(CAMLY_CONTRACT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwapDirection = () => {
    setIsBuying(!isBuying);
    setFromAmount('');
    setQuote(null);
  };

  const handleSlippageSelect = (value: number) => {
    setSlippage(value);
    setCustomSlippage('');
  };

  const handleMax = () => {
    const tokenAddress = isBuying ? fromToken.address : CAMLY_CONTRACT;
    const balanceKey: string = tokenAddress === 'BNB' ? 'bnb' : tokenAddress.toLowerCase();
    const balance = tokenBalances[balanceKey] ?? 0;
    
    // Reserve some for gas if using native token
    const maxAmount = tokenAddress === 'BNB' ? Math.max(0, balance - 0.005) : balance;
    setFromAmount(maxAmount.toString());
  };

  const handleSwap = async () => {
    if (!quote || !walletAddress) return;

    const activeSlippage = customSlippage ? parseFloat(customSlippage) : slippage;
    
    try {
      const txHash = await executeSwap({
        fromToken: isBuying ? fromToken : CAMLY_TOKEN,
        toToken: isBuying ? CAMLY_TOKEN : fromToken,
        amountIn: fromAmount,
        slippage: activeSlippage,
        userAddress: walletAddress,
      });

      if (txHash) {
        // Add to swap history
        addSwap({
          txHash,
          fromToken: {
            symbol: isBuying ? fromToken.symbol : 'CAMLY',
            amount: fromAmount,
          },
          toToken: {
            symbol: isBuying ? 'CAMLY' : fromToken.symbol,
            amount: quote.amountOut.toString(),
          },
          status: 'pending',
          timestamp: Date.now(),
          walletAddress,
        });

        toast.success('Swap thành công!', {
          description: `Đã swap ${fromAmount} ${isBuying ? fromToken.symbol : 'CAMLY'} → ${formatNumber(quote.amountOut, { maxDecimals: 4 })} ${isBuying ? 'CAMLY' : fromToken.symbol}`,
          action: {
            label: 'Xem TX',
            onClick: () => window.open(`https://bscscan.com/tx/${txHash}`, '_blank'),
          },
        });

        setFromAmount('');
        setQuote(null);
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error('Swap thất bại', {
        description: error.message || 'Có lỗi xảy ra',
      });
    }
  };

  const activeSlippage = customSlippage ? parseFloat(customSlippage) : slippage;
  
  // Calculate USD values
  const fromUSD = useMemo(() => {
    const amount = parseFloat(fromAmount) || 0;
    const price = isBuying ? getTokenPrice(fromToken.symbol) : camlyPrice;
    return amount * price;
  }, [fromAmount, fromToken, isBuying, getTokenPrice, camlyPrice]);

  const toUSD = useMemo(() => {
    if (!quote) return 0;
    const price = isBuying ? camlyPrice : getTokenPrice(fromToken.symbol);
    return quote.amountOut * price;
  }, [quote, isBuying, camlyPrice, fromToken, getTokenPrice]);

  // Get current from balance
  const fromBalance = useMemo(() => {
    if (isBuying) {
      const balanceKey: string = fromToken.address === 'BNB' ? 'bnb' : fromToken.address.toLowerCase();
      return tokenBalances[balanceKey] ?? 0;
    } else {
      return tokenBalances[CAMLY_CONTRACT.toLowerCase()] ?? 0;
    }
  }, [isBuying, fromToken, tokenBalances]);

  // PancakeSwap URL
  const pancakeSwapUrl = useMemo(() => {
    const baseUrl = 'https://pancakeswap.finance/swap';
    if (isBuying) {
      const inputCurrency = fromToken.address === 'BNB' ? 'BNB' : fromToken.address;
      return `${baseUrl}?inputCurrency=${inputCurrency}&outputCurrency=${CAMLY_CONTRACT}`;
    } else {
      const outputCurrency = fromToken.address === 'BNB' ? 'BNB' : fromToken.address;
      return `${baseUrl}?inputCurrency=${CAMLY_CONTRACT}&outputCurrency=${outputCurrency}`;
    }
  }, [isBuying, fromToken]);

  const isButtonDisabled = !quote || isApproving || isSwapping || !walletAddress;
  const insufficientBalance = parseFloat(fromAmount) > fromBalance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading gold-text flex items-center gap-2">
            <ArrowDownUp className="w-5 h-5" />
            Hoán đổi CAMLY
          </DialogTitle>
          <DialogDescription>
            Swap CAMLY với 38+ tokens trên BNB Chain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* From Token Input */}
          <div className="bg-muted/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Từ</span>
              {walletAddress && (
                <button onClick={handleMax} className="text-primary hover:underline text-xs">
                  Số dư: {formatNumber(fromBalance, { maxDecimals: 4 })} • MAX
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isBuying ? (
                <TokenSelector
                  selectedToken={fromToken}
                  onSelectToken={setFromToken}
                  excludeToken={CAMLY_TOKEN}
                  tokenBalances={tokenBalances}
                />
              ) : (
                <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 min-w-[130px]">
                  <img src={camlyLogo} alt="CAMLY" className="w-7 h-7 rounded-full" />
                  <span className="font-semibold">CAMLY</span>
                </div>
              )}
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
              {!isBuying ? (
                <TokenSelector
                  selectedToken={fromToken}
                  onSelectToken={setFromToken}
                  excludeToken={CAMLY_TOKEN}
                  tokenBalances={tokenBalances}
                />
              ) : (
                <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 min-w-[130px]">
                  <img src={camlyLogo} alt="CAMLY" className="w-7 h-7 rounded-full" />
                  <span className="font-semibold">CAMLY</span>
                </div>
              )}
              <div className="flex-1 text-right font-mono text-xl text-foreground/80">
                {quote ? (
                  formatNumber(quote.amountOut, { compact: quote.amountOut > 1000000, maxDecimals: 4 })
                ) : (
                  <span className="text-muted-foreground">0.00</span>
                )}
              </div>
            </div>
            {quote && (
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

            {quote && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tỷ giá</span>
                  <span className="font-mono text-xs">
                    1 {isBuying ? fromToken.symbol : 'CAMLY'} ≈ {formatNumber(quote.amountOut / parseFloat(fromAmount), { maxDecimals: 6 })} {isBuying ? 'CAMLY' : fromToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Min nhận ({activeSlippage}% slip)</span>
                  <span className="font-mono">
                    {formatNumber(quote.minAmountOut, { maxDecimals: 4 })} {isBuying ? 'CAMLY' : fromToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Price Impact</span>
                  <span className={cn(
                    "font-mono",
                    quote.priceImpact > 5 ? "text-outflow" : quote.priceImpact > 1 ? "text-amber-500" : "text-inflow"
                  )}>
                    {quote.priceImpact?.toFixed(2) ?? '< 0.01'}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={isButtonDisabled || insufficientBalance}
            className="w-full h-12 text-base font-semibold gap-2"
          >
            {isApproving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang approve...
              </>
            ) : isSwapping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang swap...
              </>
            ) : !walletAddress ? (
              'Kết nối ví để swap'
            ) : insufficientBalance ? (
              'Số dư không đủ'
            ) : !quote ? (
              'Nhập số lượng'
            ) : (
              `Swap ${isBuying ? fromToken.symbol : 'CAMLY'} → ${isBuying ? 'CAMLY' : fromToken.symbol}`
            )}
          </Button>

          {/* External DEX Link */}
          <a
            href={pancakeSwapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Mở trên PancakeSwap
          </a>

          {/* Contract Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              CAMLY Contract
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
