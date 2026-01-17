import { useState } from 'react';
import { useWalletSummary } from '@/hooks/useWalletSummary';
import { formatNumber, formatUSD } from '@/lib/formatNumber';
import { ArrowDownLeft, ArrowUpRight, Wallet, Bitcoin, AlertCircle, RefreshCw, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import camlyLogo from '@/assets/camly-logo.jpeg';

const CHAIN_ICONS: Record<string, string> = {
  'BNB': '🔶',
  'BTC': '₿',
  'ETH': '⟠',
};

const TOKEN_LOGOS: Record<string, string> = {
  'CAMLY': camlyLogo,
  'BNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
  'USDT': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  'USDC': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  'BTC': 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  'BTCB': 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  'ETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
};

const TOKEN_NAMES: Record<string, string> = {
  'CAMLY': 'CAMLY COIN',
  'USDT': 'Tether USD',
  'USDC': 'USD Coin',
  'BTC': 'Bitcoin',
  'BTCB': 'Bitcoin BEP20',
  'BNB': 'BNB Chain',
  'ETH': 'Ethereum',
};

const TokenLogo = ({ symbol, size = 32 }: { symbol: string; size?: number }) => {
  const logoUrl = TOKEN_LOGOS[symbol] || 'https://cryptologos.cc/logos/placeholder.png';
  
  return (
    <div 
      className="rounded-full overflow-hidden border-2 border-treasury-gold/30 shadow-md hover:scale-105 transition-transform"
      style={{ width: size, height: size }}
    >
      <img
        src={logoUrl}
        alt={symbol}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://cryptologos.cc/logos/placeholder.png';
        }}
      />
    </div>
  );
};

export function WalletSummaryCards() {
  const { data: summaries, isLoading, refetch } = useWalletSummary();
  const [syncingWalletId, setSyncingWalletId] = useState<string | null>(null);

  const handleSyncWallet = async (walletId: string, walletName: string, forceFullSync = false) => {
    setSyncingWalletId(walletId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Vui lòng đăng nhập để sync');
        return;
      }

      const syncType = forceFullSync ? 'Full Resync' : 'Sync';
      toast.info(`🔄 Đang ${syncType} ${walletName}...`);
      
      const { data, error } = await supabase.functions.invoke('sync-transactions', {
        body: { wallet_id: walletId, force_full_sync: forceFullSync }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success(`✅ ${walletName}: ${data.totalNewTransactions || 0} giao dịch mới`);
        refetch();
      } else {
        toast.error(data?.error || 'Sync thất bại');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Lỗi khi sync ví');
    } finally {
      setSyncingWalletId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="font-heading text-xl font-semibold tracking-wide text-foreground mb-3 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-treasury-gold" />
          <span className="gold-text">Wallet Summary</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-gradient-to-br from-amber-50/80 to-yellow-50/80 dark:from-amber-950/20 dark:to-yellow-950/20 border border-treasury-gold/20 rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-treasury-gold/20">
                <div className="w-8 h-8 rounded-lg bg-treasury-gold/20" />
                <div className="h-5 bg-treasury-gold/30 rounded w-1/2" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-treasury-gold/20" />
                  <div className="flex-1">
                    <div className="h-4 bg-treasury-gold/30 rounded w-16 mb-1" />
                    <div className="h-3 bg-muted rounded w-20" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-100/50 dark:bg-emerald-950/20 rounded-lg p-3 h-20" />
                  <div className="bg-red-100/50 dark:bg-red-950/20 rounded-lg p-3 h-20" />
                  <div className="bg-purple-100/50 dark:bg-purple-950/20 rounded-lg p-3 h-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
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
      <h2 className="font-heading text-xl font-semibold tracking-wide text-foreground mb-3 flex items-center gap-2">
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
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-treasury-gold/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-treasury-gold/20 flex items-center justify-center">
                  {wallet.wallet_chain === 'BTC' ? (
                    <Bitcoin className="w-4 h-4 text-orange-500" />
                  ) : (
                    <Wallet className="w-4 h-4 text-treasury-gold" />
                  )}
                </div>
                <h3 className="font-heading font-bold tracking-wide text-foreground">
                  {CHAIN_ICONS[wallet.wallet_chain] || ''} {wallet.wallet_name}
                </h3>
              </div>
              
              {/* Sync Dropdown */}
              {wallet.wallet_chain !== 'BTC' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={syncingWalletId === wallet.wallet_id}
                      className="h-8 px-2 hover:bg-treasury-gold/20 text-treasury-gold"
                    >
                      <RefreshCw className={cn(
                        "w-4 h-4",
                        syncingWalletId === wallet.wallet_id && "animate-spin"
                      )} />
                      <span className="ml-1 text-xs hidden sm:inline">Sync</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem 
                      onClick={() => handleSyncWallet(wallet.wallet_id, wallet.wallet_name, false)}
                      className="cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync mới
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleSyncWallet(wallet.wallet_id, wallet.wallet_name, true)}
                      className="cursor-pointer text-orange-600 dark:text-orange-400"
                    >
                      <History className="w-4 h-4 mr-2" />
                      Full Resync
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Token Details */}
            <div className="space-y-4">
            {wallet.tokens.map((token) => {
                const isBtcWallet = wallet.wallet_chain === 'BTC';
                
                return (
                  <div key={token.token_symbol} className="space-y-3">
                    {/* Token Header with Logo */}
                    <div className="flex items-center gap-3">
                      <TokenLogo symbol={token.token_symbol} size={36} />
                      <div className="flex flex-col">
                        <span className={cn(
                          "font-heading text-base font-bold",
                          token.token_symbol === 'CAMLY' 
                            ? "text-treasury-gold-dark dark:text-treasury-gold" 
                            : token.token_symbol === 'BTC' || token.token_symbol === 'BTCB'
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        )}>
                          {token.token_symbol}
                        </span>
                        <span className="font-body text-xs text-muted-foreground">
                          {TOKEN_NAMES[token.token_symbol] || token.token_symbol}
                        </span>
                      </div>
                    </div>
                    
                    {/* BTC wallet - show balance only */}
                    {isBtcWallet ? (
                      <div className="space-y-2">
                        <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
                          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 mb-1">
                            <Wallet className="w-3 h-3" />
                            <span className="font-body text-xs font-medium">Current Balance</span>
                          </div>
                          <div className="font-mono font-bold text-lg text-orange-700 dark:text-orange-300">
                            {formatNumber(token.current_balance ?? 0, { minDecimals: 4, maxDecimals: 6 })} BTC
                          </div>
                          <div className="font-mono text-sm text-orange-600/80 dark:text-orange-400/80">
                            {formatUSD(token.current_balance_usd ?? 0)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                          <AlertCircle className="w-3 h-3" />
                          <span className="font-body">BTC transactions sync chưa được hỗ trợ</span>
                        </div>
                      </div>
                    ) : (
                      /* EVM wallets - show 3 columns: Inflow, Outflow, Balance */
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        {/* Inflow */}
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-2">
                            <ArrowDownLeft className="w-4 h-4" />
                            <span className="font-body text-sm font-semibold uppercase tracking-widest">INFLOW</span>
                          </div>
                          <div className="font-mono font-bold text-base text-emerald-700 dark:text-emerald-300">
                            {formatCompactAmount(token.inflow_amount ?? 0, token.token_symbol)}
                          </div>
                          <div className="font-mono text-sm font-medium text-emerald-600/80 dark:text-emerald-400/80">
                            {formatUSD(token.inflow_usd ?? 0)}
                          </div>
                        </div>

                        {/* Outflow */}
                        <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 mb-2">
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="font-body text-sm font-semibold uppercase tracking-widest">OUTFLOW</span>
                          </div>
                          <div className="font-mono font-bold text-base text-red-700 dark:text-red-300">
                            {formatCompactAmount(token.outflow_amount ?? 0, token.token_symbol)}
                          </div>
                          <div className="font-mono text-sm font-medium text-red-600/80 dark:text-red-400/80">
                            {formatUSD(token.outflow_usd ?? 0)}
                          </div>
                        </div>

                        {/* Current Balance */}
                        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 mb-2">
                            <Wallet className="w-4 h-4" />
                            <span className="font-body text-sm font-semibold uppercase tracking-widest">BALANCE</span>
                          </div>
                          <div className="font-mono font-bold text-base text-purple-700 dark:text-purple-300">
                            {formatCompactAmount(token.current_balance ?? 0, token.token_symbol)}
                          </div>
                          <div className="font-mono text-sm font-medium text-purple-600/80 dark:text-purple-400/80">
                            {formatUSD(token.current_balance_usd ?? 0)}
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
