import { useAggregatedTokenBalances } from '@/hooks/useTokenBalancesFromDB';
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
import { formatTokenAmount, formatUSD, formatNumber, formatPercentage } from '@/lib/formatNumber';

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
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
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
  const { data: tokenList, prices, isLoading, error, refetch } = useAggregatedTokenBalances();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historyToken, setHistoryToken] = useState<{ symbol: string; name: string; price: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Also trigger edge function to refresh balances from blockchain
      await supabase.functions.invoke('get-token-balances');
      await refetch();
      toast.success('Đã cập nhật số dư token!');
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate total USD value
  const totalUsdValue = useMemo(() => 
    (tokenList || []).reduce((sum, token) => sum + token.totalUsdValue, 0),
    [tokenList]
  );

  // Pie chart data
  const pieData = useMemo(() => 
    (tokenList || [])
      .filter(t => t.totalUsdValue > 0)
      .map(token => ({
        name: token.symbol,
        value: token.totalUsdValue,
        color: TOKEN_COLORS[token.symbol] || '#8884d8',
        percentage: totalUsdValue > 0 ? (token.totalUsdValue / totalUsdValue) * 100 : 0
      })),
    [tokenList, totalUsdValue]
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
    staleTime: 5 * 60 * 1000,
  });

  // Mutation to save new snapshot
  const saveSnapshot = useMutation({
    mutationFn: async (value: number) => {
      const tokenBreakdown = (tokenList || []).reduce((acc, t) => {
        acc[t.symbol] = { balance: t.totalBalance, usdValue: t.totalUsdValue };
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

  // Save snapshot every hour
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

  // Calculate 24h change
  const change24h = useMemo(() => {
    if (!snapshot24h || totalUsdValue <= 0) return null;
    
    const diff = totalUsdValue - Number(snapshot24h.total_usd_value);
    const percentage = Number(snapshot24h.total_usd_value) > 0 
      ? (diff / Number(snapshot24h.total_usd_value)) * 100 
      : 0;
    
    return { value: diff, percentage };
  }, [snapshot24h, totalUsdValue]);

  const onPieEnter = (_: any, index: number) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(undefined);

  const getTokenDisplayName = (symbol: string, name: string, chain?: string) => {
    const displayNames: Record<string, string> = {
      'CAMLY': 'CAMLY COIN',
      'FUN': 'FUN Token',
      'BTC': 'Bitcoin (Native)',
      'BTCB': 'Bitcoin BEP20',
    };
    return displayNames[symbol] || name;
  };

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
            <span className="text-sm font-medium">Không thể tải số dư</span>
          </div>
        </div>
      </div>
    );
  }

  const walletCount = new Set((tokenList || []).flatMap(t => t.wallets)).size;

  return (
    <div className="treasury-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Token Balances</h3>
            <p className="text-xs text-muted-foreground">Realtime prices • CAMLY ${prices?.CAMLY?.toFixed(6) || '0.000032'}</p>
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

      {(!tokenList || tokenList.length === 0) ? (
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
                    name: getTokenDisplayName(token.symbol, token.name, token.chain),
                    price: prices?.[token.symbol] || 0
                  })}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary hover:bg-primary/10"
                  title="Xem lịch sử giao dịch"
                >
                  <History className="w-4 h-4" />
                </Button>
                <div className="text-right">
                  <p className="font-mono font-semibold text-foreground">
                    {formatTokenAmount(token.totalBalance, token.symbol)}
                  </p>
                  <p className="text-xs font-mono text-green-500">
                    {formatUSD(token.totalUsdValue)}
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
                    formatter={(value: number) => [formatUSD(value), 'Giá trị']}
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
                    {item.name} <span className="font-mono font-medium">{formatNumber(item.percentage, { minDecimals: 1, maxDecimals: 1 })}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tokenList && tokenList.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Tổng giá trị ({walletCount} ví)
              </p>
              {change24h && (
                <div className={`flex items-center gap-1 text-xs ${change24h.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {change24h.value >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span className="font-mono">
                    {change24h.value >= 0 ? '+' : ''}{formatUSD(Math.abs(change24h.value))}
                    {' '}({formatPercentage(change24h.percentage)})
                  </span>
                  <span className="text-muted-foreground">24h</span>
                </div>
              )}
            </div>
            {/* Total Balance - Gold color, large font */}
            <p className="font-mono font-bold text-2xl" style={{ color: '#C9A227' }}>
              {formatUSD(totalUsdValue)}
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
          tokenPrice={historyToken.price}
        />
      )}
    </div>
  );
}
