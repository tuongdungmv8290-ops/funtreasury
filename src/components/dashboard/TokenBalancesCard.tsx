import { useTokenBalances, WalletBalances } from '@/hooks/useTokenBalances';
import { Loader2, Coins, RefreshCw, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export function TokenBalancesCard() {
  const { data: balances, isLoading, error, refetch } = useTokenBalances();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Đã cập nhật số dư token!');
    } catch (e) {
      // Error handled below
    } finally {
      setIsRefreshing(false);
    }
  };

  // Combine all tokens from all wallets
  const allTokens = new Map<string, { symbol: string; name: string; totalBalance: number; wallets: string[] }>();
  
  if (balances) {
    for (const walletBalance of balances) {
      for (const token of walletBalance.tokens) {
        const existing = allTokens.get(token.symbol);
        if (existing) {
          existing.totalBalance += parseFloat(token.balance);
          if (!existing.wallets.includes(walletBalance.walletName)) {
            existing.wallets.push(walletBalance.walletName);
          }
        } else {
          allTokens.set(token.symbol, {
            symbol: token.symbol,
            name: token.name,
            totalBalance: parseFloat(token.balance),
            wallets: [walletBalance.walletName]
          });
        }
      }
    }
  }

  // Sort tokens: CAMLY first, then FUN, then by balance
  const tokenList = Array.from(allTokens.values())
    .filter(t => t.totalBalance > 0)
    .sort((a, b) => {
      // Priority tokens first
      const priority: Record<string, number> = { 'CAMLY': 0, 'FUN': 1, 'BNB': 2, 'USDT': 3, 'USDC': 4, 'BTCB': 5 };
      const aPriority = priority[a.symbol] ?? 100;
      const bPriority = priority[b.symbol] ?? 100;
      if (aPriority !== bPriority) return aPriority - bPriority;
      // Then by balance
      return b.totalBalance - a.totalBalance;
    });

  // Get icon/color for each token
  const getTokenColor = (symbol: string) => {
    const colors: Record<string, string> = {
      'BNB': 'from-yellow-400 to-yellow-600',
      'ETH': 'from-blue-400 to-blue-600',
      'USDT': 'from-green-400 to-green-600',
      'BTCB': 'from-orange-400 to-orange-600',
      'CAMLY': 'from-purple-400 to-pink-500',
      'FUN': 'from-primary to-primary/70',
      'USDC': 'from-blue-500 to-blue-700',
    };
    return colors[symbol] || 'from-gray-400 to-gray-600';
  };

  // Get display name for token
  const getTokenDisplayName = (symbol: string, name: string) => {
    const displayNames: Record<string, string> = {
      'CAMLY': 'CAMLY COIN',
      'FUN': 'FUN Token',
    };
    return displayNames[symbol] || name;
  };

  // Check if error is due to missing API key
  const isApiKeyMissing = error?.message?.includes('API Key') || error?.message?.includes('Moralis');

  if (isLoading) {
    return (
      <div className="treasury-card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Đang tải số dư...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="treasury-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Token Balances</h3>
        </div>
        <div className="flex flex-col gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 text-primary">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              {isApiKeyMissing ? 'Cần cấu hình Moralis API Key' : 'Không thể tải số dư'}
            </span>
          </div>
          {isApiKeyMissing && (
            <Link to="/settings">
              <Button variant="outline" size="sm" className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
                <Settings className="w-4 h-4" />
                Đi tới Settings
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="treasury-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Token Balances</h3>
            <p className="text-xs text-muted-foreground">Realtime từ blockchain</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-muted-foreground hover:text-primary"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {tokenList.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>Chưa có token nào được phát hiện</p>
          <p className="text-xs mt-1">Nhấn Sync để cập nhật</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokenList.map((token) => (
            <div
              key={token.symbol}
              className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getTokenColor(token.symbol)} flex items-center justify-center shadow-sm`}>
                  <span className="text-white font-bold text-xs">
                    {token.symbol.substring(0, 3)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{token.symbol}</p>
                  <p className="text-xs text-muted-foreground">{getTokenDisplayName(token.symbol, token.name)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-semibold text-foreground">
                  {token.totalBalance < 0.000001 
                    ? token.totalBalance.toExponential(2)
                    : token.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {token.wallets.length} wallet{token.wallets.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {balances && balances.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Cập nhật từ {balances.length} ví Treasury
          </p>
        </div>
      )}
    </div>
  );
}
