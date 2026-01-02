import { useTokenBalances, WalletBalances } from '@/hooks/useTokenBalances';
import { Loader2, Coins, RefreshCw, AlertCircle, Settings, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import camlyLogo from '@/assets/camly-logo.jpeg';
import { TokenHistoryModal } from './TokenHistoryModal';
import { Skeleton } from '@/components/ui/skeleton';

// Official token logos - CAMLY uses local asset
const TOKEN_LOGOS: Record<string, string> = {
  'CAMLY': camlyLogo,
  'BNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
  'USDT': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  'BTC': 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  'BTCB': 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  'FUN': 'https://cryptologos.cc/logos/funtoken-fun-logo.png',
  'USDC': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
};

// Chain icons for distinguishing networks
const CHAIN_ICONS: Record<string, { icon: string; color: string; name: string }> = {
  'BTC': { icon: '₿', color: 'bg-orange-500', name: 'Bitcoin' },
  'BNB': { icon: 'B', color: 'bg-yellow-500', name: 'BNB Chain' },
  'ETH': { icon: 'Ξ', color: 'bg-blue-500', name: 'Ethereum' },
  'POLYGON': { icon: 'P', color: 'bg-purple-500', name: 'Polygon' },
  'ARB': { icon: 'A', color: 'bg-blue-400', name: 'Arbitrum' },
  'BASE': { icon: 'B', color: 'bg-blue-600', name: 'Base' },
};

// Default coin icon for unknown tokens
const DEFAULT_LOGO = 'https://cryptologos.cc/logos/cryptocom-chain-cro-logo.png';

function ChainBadge({ chain }: { chain: string }) {
  const chainInfo = CHAIN_ICONS[chain] || { icon: '?', color: 'bg-gray-500', name: chain };
  
  return (
    <div 
      className={`absolute -bottom-1 -right-1 w-4 h-4 ${chainInfo.color} rounded-full flex items-center justify-center text-[8px] font-bold text-white border-2 border-background shadow-sm`}
      title={chainInfo.name}
    >
      {chainInfo.icon}
    </div>
  );
}

function TokenLogo({ symbol, size = 36, chain }: { symbol: string; size?: number; chain?: string }) {
  const [hasError, setHasError] = useState(false);
  const logoUrl = TOKEN_LOGOS[symbol] || DEFAULT_LOGO;

  return (
    <div 
      className="relative rounded-full overflow-visible flex items-center justify-center transition-transform duration-200 hover:scale-110"
      style={{ width: size, height: size }}
    >
      <div 
        className="w-full h-full rounded-full overflow-hidden bg-secondary border border-border/50 flex items-center justify-center"
      >
        {!hasError ? (
          <img 
            src={logoUrl} 
            alt={`${symbol} logo`}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
            loading="lazy"
          />
        ) : (
          <span className="text-xs font-bold text-muted-foreground">
            {symbol.substring(0, 2)}
          </span>
        )}
      </div>
      {chain && <ChainBadge chain={chain} />}
    </div>
  );
}

function ShimmerSkeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-shimmer rounded-md ${className}`} />
  );
}

function TokenSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50">
      <div className="flex items-center gap-3">
        <ShimmerSkeleton className="w-9 h-9 rounded-full" />
        <div className="space-y-2">
          <ShimmerSkeleton className="h-4 w-16" />
          <ShimmerSkeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <ShimmerSkeleton className="h-4 w-20 ml-auto" />
        <ShimmerSkeleton className="h-3 w-12 ml-auto" />
      </div>
    </div>
  );
}

export function TokenBalancesCard() {
  const { data: balances, isLoading, error, refetch } = useTokenBalances();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historyToken, setHistoryToken] = useState<{ symbol: string; name: string } | null>(null);
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

  // Separate tokens by chain - BTC from Bitcoin wallet, BTCB from BNB chain
  // Use unique key: symbol + chain to keep them separate
  const allTokens = new Map<string, { symbol: string; name: string; totalBalance: number; wallets: string[]; chain: string; displaySymbol: string }>();
  
  if (balances) {
    for (const walletBalance of balances) {
      // Determine chain from wallet name
      const isBitcoinWallet = walletBalance.walletName.toLowerCase().includes('bitcoin');
      
      for (const token of walletBalance.tokens) {
        // Create unique key: BTC from Bitcoin wallet stays as BTC, BTCB from BNB chain stays as BTCB
        const chain = isBitcoinWallet ? 'BTC' : 'BNB';
        const uniqueKey = `${token.symbol}-${chain}`;
        
        const existing = allTokens.get(uniqueKey);
        if (existing) {
          existing.totalBalance += parseFloat(token.balance);
          if (!existing.wallets.includes(walletBalance.walletName)) {
            existing.wallets.push(walletBalance.walletName);
          }
        } else {
          allTokens.set(uniqueKey, {
            symbol: token.symbol,
            displaySymbol: token.symbol === 'BTC' ? 'BTC' : token.symbol,
            name: token.name,
            totalBalance: parseFloat(token.balance),
            wallets: [walletBalance.walletName],
            chain
          });
        }
      }
    }
  }

  // Show these tokens, in specific order - BTC (native) and BTCB (BNB chain) are separate
  const ALLOWED_TOKENS = ['CAMLY', 'BNB', 'USDT', 'BTC', 'BTCB'];
  const TOKEN_ORDER: Record<string, number> = { 'CAMLY': 0, 'BNB': 1, 'USDT': 2, 'BTC': 3, 'BTCB': 4 };
  
  // Token prices for USD calculation (same as edge function)
  const TOKEN_PRICES: Record<string, number> = {
    'BTC': 94000,
    'BTCB': 94000,
    'BNB': 700,
    'USDT': 1,
    'CAMLY': 0.000004,
  };
  
  const tokenList = Array.from(allTokens.values())
    .filter(t => t.totalBalance > 0 && ALLOWED_TOKENS.includes(t.symbol))
    .sort((a, b) => {
      const aOrder = TOKEN_ORDER[a.symbol] ?? 100;
      const bOrder = TOKEN_ORDER[b.symbol] ?? 100;
      return aOrder - bOrder;
    });

  // Calculate total USD value
  const totalUsdValue = tokenList.reduce((sum, token) => {
    const price = TOKEN_PRICES[token.symbol] || 0;
    return sum + (token.totalBalance * price);
  }, 0);

  // Get display name for token
  const getTokenDisplayName = (symbol: string, name: string, chain?: string) => {
    const displayNames: Record<string, string> = {
      'CAMLY': 'CAMLY COIN',
      'FUN': 'FUN Token',
      'BTC': 'Bitcoin (Native)',
      'BTCB': 'Bitcoin BEP20',
    };
    return displayNames[symbol] || name;
  };

  // Check if error is due to missing API key
  const isApiKeyMissing = error?.message?.includes('API Key') || error?.message?.includes('Moralis');

  if (isLoading || isRefreshing) {
    return (
      <div className="treasury-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Token Balances</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Đang cập nhật...
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
          </Button>
        </div>
        <div className="space-y-3">
          <TokenSkeleton />
          <TokenSkeleton />
          <TokenSkeleton />
          <TokenSkeleton />
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
          {tokenList.map((token, index) => (
            <div
              key={`${token.symbol}-${token.chain}`}
              className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50 hover:border-primary/30 transition-all duration-200 group animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <TokenLogo symbol={token.symbol} size={36} chain={token.chain} />
                <div>
                  <p className="font-semibold text-foreground">{token.symbol}</p>
                  <p className="text-xs text-muted-foreground">{getTokenDisplayName(token.symbol, token.name, token.chain)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* View History Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoryToken({ 
                    symbol: token.symbol, 
                    name: getTokenDisplayName(token.symbol, token.name, token.chain) 
                  })}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary hover:bg-primary/10"
                  title="Xem lịch sử giao dịch"
                >
                  <History className="w-4 h-4" />
                </Button>
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
            </div>
          ))}
        </div>
      )}

      {balances && balances.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Tổng giá trị ({balances.length} ví)
            </p>
            <p className="font-mono font-bold text-lg text-primary">
              ${totalUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Token History Modal */}
      {historyToken && (
        <TokenHistoryModal
          open={!!historyToken}
          onOpenChange={(open) => !open && setHistoryToken(null)}
          tokenSymbol={historyToken.symbol}
          tokenName={historyToken.name}
        />
      )}
    </div>
  );
}
