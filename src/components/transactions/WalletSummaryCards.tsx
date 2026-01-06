import { useWalletSummary } from '@/hooks/useWalletSummary';
import { formatNumber, formatUSD } from '@/lib/formatNumber';
import { ArrowDownLeft, ArrowUpRight, Wallet, Bitcoin, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const CHAIN_ICONS: Record<string, string> = {
  'BNB': '🔶',
  'BTC': '₿',
  'ETH': '⟠',
};

export function WalletSummaryCards() {
  const { data: summaries, isLoading } = useWalletSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/2 mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!summaries || summaries.length === 0) {
    return null;
  }

  // Format token amount with compact notation
  const formatCompactAmount = (amount: number, symbol: string): string => {
    if (symbol === 'USDT') {
      return formatNumber(amount, { minDecimals: 2, maxDecimals: 2 });
    }
    // CAMLY - use B/M notation
    if (amount >= 1_000_000_000) {
      return (amount / 1_000_000_000).toFixed(2) + 'B';
    }
    if (amount >= 1_000_000) {
      return (amount / 1_000_000).toFixed(2) + 'M';
    }
    return formatNumber(amount, { minDecimals: 0, maxDecimals: 0 });
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-treasury-gold" />
        <span className="gold-text">Wallet Summary</span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaries.map((wallet) => (
          <div
            key={wallet.wallet_id}
            className="bg-gradient-to-br from-amber-50/80 to-yellow-50/80 dark:from-amber-950/20 dark:to-yellow-950/20 border border-treasury-gold/20 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Wallet Header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-treasury-gold/20">
              <div className="w-8 h-8 rounded-lg bg-treasury-gold/20 flex items-center justify-center">
                {wallet.wallet_chain === 'BTC' ? (
                  <Bitcoin className="w-4 h-4 text-orange-500" />
                ) : (
                  <Wallet className="w-4 h-4 text-treasury-gold" />
                )}
              </div>
              <h3 className="font-bold text-foreground">
                {CHAIN_ICONS[wallet.wallet_chain] || ''} {wallet.wallet_name}
              </h3>
            </div>

            {/* Token Details */}
            <div className="space-y-4">
              {wallet.tokens.map((token) => {
                const isBtcWallet = wallet.wallet_chain === 'BTC';
                const tokenIcon = token.token_symbol === 'CAMLY' ? '📈' : token.token_symbol === 'BTC' ? '₿' : '💵';
                
                return (
                  <div key={token.token_symbol} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        token.token_symbol === 'CAMLY' 
                          ? "bg-treasury-gold/20 text-treasury-gold-dark" 
                          : token.token_symbol === 'BTC'
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      )}>
                        {tokenIcon} {token.token_symbol}
                      </span>
                    </div>
                    
                    {/* BTC wallet - show balance only */}
                    {isBtcWallet ? (
                      <div className="space-y-2">
                        <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
                          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 mb-1">
                            <Wallet className="w-3 h-3" />
                            <span className="text-xs font-medium">Current Balance</span>
                          </div>
                          <div className="font-bold text-lg text-orange-700 dark:text-orange-300">
                            {formatNumber(token.current_balance, { minDecimals: 4, maxDecimals: 6 })} BTC
                          </div>
                          <div className="text-sm text-orange-600/80 dark:text-orange-400/80">
                            {formatUSD(token.current_balance_usd)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                          <AlertCircle className="w-3 h-3" />
                          <span>BTC transactions sync chưa được hỗ trợ</span>
                        </div>
                      </div>
                    ) : (
                      /* EVM wallets - show 3 columns: Inflow, Outflow, Balance */
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {/* Inflow */}
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1">
                            <ArrowDownLeft className="w-3 h-3" />
                            <span className="text-xs font-medium">Inflow</span>
                          </div>
                          <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                            {formatCompactAmount(token.inflow_amount, token.token_symbol)}
                          </div>
                          <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                            {formatUSD(token.inflow_usd)}
                          </div>
                        </div>

                        {/* Outflow */}
                        <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400 mb-1">
                            <ArrowUpRight className="w-3 h-3" />
                            <span className="text-xs font-medium">Outflow</span>
                          </div>
                          <div className="font-semibold text-red-700 dark:text-red-300">
                            {formatCompactAmount(token.outflow_amount, token.token_symbol)}
                          </div>
                          <div className="text-xs text-red-600/80 dark:text-red-400/80">
                            {formatUSD(token.outflow_usd)}
                          </div>
                        </div>

                        {/* Current Balance */}
                        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 mb-1">
                            <Wallet className="w-3 h-3" />
                            <span className="text-xs font-medium">Balance</span>
                          </div>
                          <div className="font-semibold text-purple-700 dark:text-purple-300">
                            {formatCompactAmount(token.current_balance, token.token_symbol)}
                          </div>
                          <div className="text-xs text-purple-600/80 dark:text-purple-400/80">
                            {formatUSD(token.current_balance_usd)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
