import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TokenBalanceDB {
  symbol: string;
  name: string;
  balance: number;
  usd_value: number;
  wallet_id: string;
  wallet_name: string;
  chain: string;
}

// Core tokens to display (filter out spam)
const CORE_TOKENS = ['CAMLY', 'BNB', 'USDT', 'BTC', 'BTCB', 'USDC'];

// Token display names
const TOKEN_NAMES: Record<string, string> = {
  'CAMLY': 'CAMLY COIN',
  'BNB': 'BNB',
  'USDT': 'Tether USD',
  'BTC': 'Bitcoin (Native)',
  'BTCB': 'Bitcoin BEP20',
  'USDC': 'USD Coin',
};

// Latest prices - CAMLY at $0.000032
const REALTIME_PRICES: Record<string, number> = {
  'CAMLY': 0.000032,
  'BTC': 91374,
  'BTCB': 91374,
  'BNB': 885,
  'USDT': 1,
  'USDC': 1,
};

export function useTokenBalancesFromDB() {
  return useQuery({
    queryKey: ['token-balances-db'],
    queryFn: async (): Promise<TokenBalanceDB[]> => {
      // Fetch tokens joined with wallets
      const { data: tokens, error: tokensError } = await supabase
        .from('tokens')
        .select(`
          symbol,
          balance,
          usd_value,
          wallet_id,
          wallets!inner(name, chain)
        `);

      if (tokensError) {
        console.error('Error fetching tokens:', tokensError);
        throw tokensError;
      }

      if (!tokens || tokens.length === 0) {
        return [];
      }

      // Filter core tokens and calculate USD values with realtime prices
      const result: TokenBalanceDB[] = tokens
        .filter((t: any) => CORE_TOKENS.includes(t.symbol) && Number(t.balance) > 0)
        .map((t: any) => {
          const price = REALTIME_PRICES[t.symbol] || 0;
          const balance = Number(t.balance);
          
          return {
            symbol: t.symbol,
            name: TOKEN_NAMES[t.symbol] || t.symbol,
            balance: balance,
            usd_value: balance * price,
            wallet_id: t.wallet_id,
            wallet_name: t.wallets?.name || 'Unknown',
            chain: t.wallets?.chain || 'BNB',
          };
        });

      return result;
    },
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
}

// Aggregate tokens by symbol for total portfolio view
export function useAggregatedTokenBalances() {
  const { data: tokens, ...rest } = useTokenBalancesFromDB();

  const aggregated = tokens ? aggregateTokens(tokens) : [];

  return {
    data: aggregated,
    prices: REALTIME_PRICES,
    ...rest,
  };
}

function aggregateTokens(tokens: TokenBalanceDB[]) {
  const map = new Map<string, {
    symbol: string;
    name: string;
    totalBalance: number;
    totalUsdValue: number;
    chain: string;
    wallets: string[];
  }>();

  for (const token of tokens) {
    // Use symbol + chain as key to separate BTC (Native) and BTCB (BEP20)
    const key = token.symbol === 'BTC' && token.chain === 'BTC' ? 'BTC-native' : token.symbol;
    
    const existing = map.get(key);
    if (existing) {
      existing.totalBalance += token.balance;
      existing.totalUsdValue += token.usd_value;
      if (!existing.wallets.includes(token.wallet_name)) {
        existing.wallets.push(token.wallet_name);
      }
    } else {
      map.set(key, {
        symbol: token.symbol,
        name: token.name,
        totalBalance: token.balance,
        totalUsdValue: token.usd_value,
        chain: token.chain,
        wallets: [token.wallet_name],
      });
    }
  }

  // Sort by priority: CAMLY first, then by USD value
  const TOKEN_ORDER: Record<string, number> = { 'CAMLY': 0, 'BNB': 1, 'USDT': 2, 'BTC': 3, 'BTCB': 4, 'USDC': 5 };
  
  return Array.from(map.values()).sort((a, b) => {
    const aOrder = TOKEN_ORDER[a.symbol] ?? 100;
    const bOrder = TOKEN_ORDER[b.symbol] ?? 100;
    return aOrder - bOrder;
  });
}
