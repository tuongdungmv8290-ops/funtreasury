import { useTokenBalances, WalletBalances } from '@/hooks/useTokenBalances';
import { Loader2, Coins, RefreshCw, AlertCircle, Settings, History, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import camlyLogo from '@/assets/camly-logo.jpeg';
import { TokenHistoryModal } from './TokenHistoryModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

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

// Pie chart colors matching token branding
const TOKEN_COLORS: Record<string, string> = {
  'CAMLY': '#C9A227',
  'BNB': '#F3BA2F',
  'USDT': '#26A17B',
  'BTC': '#F7931A',
  'BTCB': '#F7931A',
};

// Default coin icon for unknown tokens
const DEFAULT_LOGO = 'https://cryptologos.cc/logos/cryptocom-chain-cro-logo.png';

// Active shape renderer for pie chart hover effect
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' }}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

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
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
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

  // Calculate total USD value and per-token USD values
  const tokenListWithUsd = useMemo(() => tokenList.map(token => ({
    ...token,
    usdValue: token.totalBalance * (TOKEN_PRICES[token.symbol] || 0)
  })), [tokenList]);

  const totalUsdValue = useMemo(() => 
    tokenListWithUsd.reduce((sum, token) => sum + token.usdValue, 0),
    [tokenListWithUsd]
  );

  // Pie chart data
  const pieData = useMemo(() => 
    tokenListWithUsd
      .filter(t => t.usdValue > 0)
      .map(token => ({
        name: token.symbol,
        value: token.usdValue,
        color: TOKEN_COLORS[token.symbol] || '#8884d8',
        percentage: totalUsdValue > 0 ? (token.usdValue / totalUsdValue) * 100 : 0
      })),
    [tokenListWithUsd, totalUsdValue]
  );

  // Fetch 24h snapshot from database
  const { data: snapshot24h } = useQuery({
    queryKey: ['portfolio-snapshot-24h'],
    queryFn: async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('portfolio_snapshots')
        .select('total_usd_value, created_at')
        .lte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching snapshot:', error);
        return null;
      }
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation to save new snapshot
  const saveSnapshot = useMutation({
    mutationFn: async (value: number) => {
      const tokenBreakdown = tokenListWithUsd.reduce((acc, t) => {
        acc[t.symbol] = { balance: t.totalBalance, usdValue: t.usdValue };
        return acc;
      }, {} as Record<string, { balance: number; usdValue: number }>);

      const { error } = await supabase
        .from('portfolio_snapshots')
        .insert({ 
          total_usd_value: value,
          token_breakdown: tokenBreakdown
        });
      
      if (error) console.error('Error saving snapshot:', error);
    }
  });

  // Save snapshot every hour (if value changed significantly)
  useEffect(() => {
    if (totalUsdValue <= 0) return;
    
    const lastSaveKey = 'treasury_last_snapshot_save';
    const lastSave = localStorage.getItem(lastSaveKey);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    if (!lastSave || (now - parseInt(lastSave)) >= oneHour) {
      saveSnapshot.mutate(totalUsdValue);
      localStorage.setItem(lastSaveKey, now.toString());
    }
  }, [totalUsdValue]);

  // Calculate 24h change from database snapshot
  const change24h = useMemo(() => {
    if (!snapshot24h || totalUsdValue <= 0) return null;
    
    const diff = totalUsdValue - Number(snapshot24h.total_usd_value);
    const percentage = Number(snapshot24h.total_usd_value) > 0 
      ? (diff / Number(snapshot24h.total_usd_value)) * 100 
      : 0;
    
    return { value: diff, percentage };
  }, [snapshot24h, totalUsdValue]);

  // Pie chart hover handlers
  const onPieEnter = (_: any, index: number) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(undefined);

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

      {/* Pie Chart with Animation */}
      {pieData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-3">Phân bổ Portfolio</p>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={45}
                    paddingAngle={2}
                    dataKey="value"
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        className="transition-all duration-200 cursor-pointer"
                        style={{ 
                          filter: activeIndex === index ? 'brightness(1.2)' : 'brightness(1)',
                          transition: 'filter 0.2s ease'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Giá trị']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-1.5">
              {pieData.map((item, index) => (
                <div 
                  key={item.name} 
                  className={`flex items-center gap-1.5 p-1 rounded transition-all duration-200 cursor-pointer ${activeIndex === index ? 'bg-secondary/80 scale-105' : 'hover:bg-secondary/50'}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  <div 
                    className="w-3 h-3 rounded-full transition-transform duration-200"
                    style={{ 
                      backgroundColor: item.color,
                      transform: activeIndex === index ? 'scale(1.3)' : 'scale(1)'
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.name} <span className="font-mono font-medium">{item.percentage.toFixed(1)}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {balances && balances.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Tổng giá trị ({balances.length} ví)
              </p>
              {change24h && (
                <div className={`flex items-center gap-1 text-xs ${change24h.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {change24h.value >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span className="font-mono">
                    {change24h.value >= 0 ? '+' : ''}${Math.abs(change24h.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    {' '}({change24h.percentage >= 0 ? '+' : ''}{change24h.percentage.toFixed(2)}%)
                  </span>
                  <span className="text-muted-foreground">24h</span>
                </div>
              )}
            </div>
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
