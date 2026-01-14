import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowDownUp, Settings, Loader2, ExternalLink, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatNumber, formatUSD } from "@/lib/formatNumber";
import { usePancakeSwap, TokenInfo, SwapQuote, PANCAKE_ROUTER_V2 } from "@/hooks/usePancakeSwap";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { TokenSelector, POPULAR_TOKENS } from "./TokenSelector";

interface UniversalSwapProps {
  walletAddress: string | null;
  isConnected: boolean;
  onSwapComplete?: () => void;
}

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1, 3];

export function UniversalSwap({
  walletAddress,
  isConnected,
  onSwapComplete,
}: UniversalSwapProps) {
  const [fromToken, setFromToken] = useState<TokenInfo | null>(POPULAR_TOKENS[0]); // BNB
  const [toToken, setToToken] = useState<TokenInfo | null>(POPULAR_TOKENS[1]); // CAMLY
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [tokenBalances, setTokenBalances] = useState<Record<string, number>>({});

  const { data: cryptoPrices } = useCryptoPrices();
  const {
    getQuote,
    executeSwap,
    getTokenBalance,
    isApproving,
    isSwapping,
  } = usePancakeSwap();

  // Get prices for USD conversion
  const getTokenPrice = useCallback((symbol: string): number => {
    const priceMap: Record<string, string> = {
      BNB: 'bnb',
      WBNB: 'bnb',
      BTCB: 'btc',
      ETH: 'eth',
      USDT: 'usdt',
      USDC: 'usdc',
    };
    const coinId = priceMap[symbol.toUpperCase()] || symbol.toLowerCase();
    return cryptoPrices?.find(c => c.symbol.toLowerCase() === coinId)?.current_price || 0;
  }, [cryptoPrices]);

  // Fetch balances when wallet changes
  useEffect(() => {
    if (!walletAddress || !isConnected) {
      setTokenBalances({});
      return;
    }

    const fetchBalances = async () => {
      const balances: Record<string, number> = {};
      
      for (const token of POPULAR_TOKENS.slice(0, 10)) {
        try {
          const balance = await getTokenBalance(token.address, walletAddress, token.decimals);
          balances[token.address] = balance;
        } catch (error) {
          balances[token.address] = 0;
        }
      }
      
      setTokenBalances(balances);
    };

    fetchBalances();
  }, [walletAddress, isConnected, getTokenBalance]);

  // Fetch quote when inputs change
  useEffect(() => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) === 0) {
      setQuote(null);
      return;
    }

    const fetchQuote = async () => {
      const newQuote = await getQuote(fromToken, toToken, fromAmount, slippage);
      setQuote(newQuote);
    };

    const debounce = setTimeout(fetchQuote, 300);
    return () => clearTimeout(debounce);
  }, [fromToken, toToken, fromAmount, slippage, getQuote]);

  // Swap direction
  const handleSwapDirection = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount('');
    setQuote(null);
  };

  // Handle MAX button
  const handleMax = () => {
    if (!fromToken) return;
    const balance = tokenBalances[fromToken.address] || 0;
    // Reserve some BNB for gas
    const maxAmount = fromToken.address === 'BNB' ? Math.max(0, balance - 0.01) : balance;
    setFromAmount(maxAmount > 0 ? maxAmount.toString() : '');
  };

  // Handle swap execution
  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !walletAddress || !quote) return;

    const txHash = await executeSwap({
      fromToken,
      toToken,
      amountIn: fromAmount,
      slippage,
      userAddress: walletAddress,
    });

    if (txHash) {
      setFromAmount('');
      setQuote(null);
      onSwapComplete?.();
      
      // Refresh balances
      if (walletAddress) {
        const balances: Record<string, number> = {};
        for (const token of [fromToken, toToken]) {
          try {
            const balance = await getTokenBalance(token.address, walletAddress, token.decimals);
            balances[token.address] = balance;
          } catch (error) {
            balances[token.address] = 0;
          }
        }
        setTokenBalances(prev => ({ ...prev, ...balances }));
      }
    }
  };

  // Calculate USD values
  const fromUSD = useMemo(() => {
    if (!fromToken || !fromAmount) return 0;
    const price = getTokenPrice(fromToken.symbol);
    return parseFloat(fromAmount) * price;
  }, [fromToken, fromAmount, getTokenPrice]);

  const toUSD = useMemo(() => {
    if (!toToken || !quote) return 0;
    const price = getTokenPrice(toToken.symbol);
    return parseFloat(quote.amountOut) * price;
  }, [toToken, quote, getTokenPrice]);

  // Generate DEX links
  const pancakeSwapUrl = useMemo(() => {
    if (!fromToken || !toToken) return '';
    const inputCurrency = fromToken.address === 'BNB' ? 'BNB' : fromToken.address;
    const outputCurrency = toToken.address === 'BNB' ? 'BNB' : toToken.address;
    let url = `https://pancakeswap.finance/swap?inputCurrency=${inputCurrency}&outputCurrency=${outputCurrency}`;
    if (fromAmount) url += `&exactAmount=${fromAmount}`;
    return url;
  }, [fromToken, toToken, fromAmount]);

  if (!isConnected) {
    return (
      <div className="p-4 rounded-xl bg-muted/50 border border-dashed text-center">
        <p className="text-sm text-muted-foreground">
          Kết nối ví để sử dụng tính năng swap
        </p>
      </div>
    );
  }

  const isLoading = isApproving || isSwapping;
  const fromBalance = fromToken ? (tokenBalances[fromToken.address] || 0) : 0;
  const hasInsufficientBalance = parseFloat(fromAmount || '0') > fromBalance;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Swap On-Chain</h3>
          <Badge variant="outline" className="text-xs">BSC</Badge>
        </div>

        {/* Slippage Settings */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 h-8">
              <Settings className="w-4 h-4" />
              <span className="text-xs">{slippage}%</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              <p className="text-sm font-medium">Slippage Tolerance</p>
              <div className="flex gap-2">
                {SLIPPAGE_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    variant={slippage === option ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSlippage(option);
                      setCustomSlippage('');
                    }}
                    className="flex-1"
                  >
                    {option}%
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Custom"
                  value={customSlippage}
                  onChange={(e) => {
                    setCustomSlippage(e.target.value);
                    if (e.target.value) {
                      setSlippage(parseFloat(e.target.value) || 0.5);
                    }
                  }}
                  className="h-8"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              {slippage > 5 && (
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Slippage cao có thể gây lỗ
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* From Token */}
      <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Từ</span>
          <span className="text-xs text-muted-foreground">
            Số dư: {formatNumber(fromBalance, { maxDecimals: 4 })} {fromToken?.symbol}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <TokenSelector
            selectedToken={fromToken}
            onSelectToken={setFromToken}
            excludeToken={toToken}
            tokenBalances={tokenBalances}
            disabled={isLoading}
          />
          <div className="flex-1 relative">
            <Input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              disabled={isLoading}
              className={cn(
                "text-right text-lg font-mono pr-14 h-12",
                "bg-transparent border-0 focus-visible:ring-0",
                hasInsufficientBalance && "text-outflow"
              )}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMax}
              disabled={isLoading || !fromToken}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2 text-xs text-primary hover:text-primary"
            >
              MAX
            </Button>
          </div>
        </div>
        {fromUSD > 0 && (
          <p className="text-right text-xs text-muted-foreground">
            ≈ {formatUSD(fromUSD)}
          </p>
        )}
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={handleSwapDirection}
          disabled={isLoading}
          className={cn(
            "rounded-full h-10 w-10",
            "border-2 border-primary/30 bg-background",
            "hover:border-primary hover:bg-primary/10",
            "transition-all duration-200"
          )}
        >
          <ArrowDownUp className="w-4 h-4 text-primary" />
        </Button>
      </div>

      {/* To Token */}
      <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Đến (ước tính)</span>
          <span className="text-xs text-muted-foreground">
            Số dư: {formatNumber(tokenBalances[toToken?.address || ''] || 0, { maxDecimals: 4 })} {toToken?.symbol}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <TokenSelector
            selectedToken={toToken}
            onSelectToken={setToToken}
            excludeToken={fromToken}
            tokenBalances={tokenBalances}
            disabled={isLoading}
          />
          <div className="flex-1">
            <Input
              type="text"
              placeholder="0.0"
              value={quote ? formatNumber(parseFloat(quote.amountOut), { maxDecimals: 6 }) : ''}
              disabled
              className="text-right text-lg font-mono h-12 bg-transparent border-0"
            />
          </div>
        </div>
        {toUSD > 0 && (
          <p className="text-right text-xs text-muted-foreground">
            ≈ {formatUSD(toUSD)}
          </p>
        )}
      </div>

      {/* Quote Details */}
      {quote && fromToken && toToken && (
        <div className="p-3 rounded-lg bg-muted/20 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tỷ giá</span>
            <span className="font-mono">
              1 {fromToken.symbol} = {formatNumber(quote.rate, { maxDecimals: 6 })} {toToken.symbol}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Min nhận được</span>
            <span className="font-mono">
              {formatNumber(parseFloat(quote.amountOutMin), { maxDecimals: 6 })} {toToken.symbol}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Slippage</span>
            <span className="font-mono">{slippage}%</span>
          </div>
        </div>
      )}

      {/* Swap Button */}
      <Button
        onClick={handleSwap}
        disabled={
          isLoading ||
          !fromToken ||
          !toToken ||
          !fromAmount ||
          parseFloat(fromAmount) === 0 ||
          hasInsufficientBalance ||
          !quote
        }
        className={cn(
          "w-full h-12 text-base font-semibold",
          "bg-gradient-to-r from-primary to-primary/80",
          "hover:from-primary/90 hover:to-primary/70"
        )}
      >
        {isApproving ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Đang Approve...
          </>
        ) : isSwapping ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Đang Swap...
          </>
        ) : hasInsufficientBalance ? (
          'Không đủ số dư'
        ) : !quote && fromAmount ? (
          'Đang tính toán...'
        ) : (
          <>
            <Zap className="w-5 h-5 mr-2" />
            Swap Ngay
          </>
        )}
      </Button>

      {/* External DEX Links */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <a
          href={pancakeSwapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          🥞 PancakeSwap <ExternalLink className="w-3 h-3" />
        </a>
        <span className="text-muted-foreground">•</span>
        <a
          href={`https://dexscreener.com/bsc/${toToken?.address || ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          📊 DexScreener <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
