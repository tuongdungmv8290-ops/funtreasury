import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCamlyPrice } from './useCamlyPrice';
import { useMemo } from 'react';

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

// Base prices for non-CAMLY tokens
const BASE_PRICES: Record<string, number> = {
  'BTC': 97000,
  'BTCB': 97000,
  'BNB': 710,
  'USDT': 1,
  'USDC': 1,
};

interface RawTokenData {
  symbol: string;
  balance: number;
  wallet_id: string;
  wallet_name: string;
  chain: string;
}

export function useTokenBalancesFromDB() {
  const { data: camlyPriceData } = useCamlyPrice();
  const camlyPrice = camlyPriceData?.price_usd || 0.00002069;

  // Fetch raw data without price calculation
  const { data: rawData, ...queryRest } = useQuery({
    queryKey: ['token-balances-db-raw'],
    queryFn: async (): Promise<RawTokenData[]> => {
      const { data: tokens, error: tokensError } = await supabase
        .from('tokens')
        .select(`
          symbol,
          balance,
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

      return tokens
        .filter((t: any) => CORE_TOKENS.includes(t.symbol) && Number(t.balance) > 0)
        .map((t: any) => ({
          symbol: t.symbol,
          balance: Number(t.balance),
          wallet_id: t.wallet_id,
          wallet_name: t.wallets?.name || 'Unknown',
          chain: t.wallets?.chain || 'BNB',
        }));
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // Calculate USD values with current CAMLY price (memoized)
  const data = useMemo((): TokenBalanceDB[] | undefined => {
    if (!rawData) return undefined;

    const REALTIME_PRICES: Record<string, number> = {
      'CAMLY': camlyPrice,
      ...BASE_PRICES,
    };

    return rawData.map(t => ({
      ...t,
      name: TOKEN_NAMES[t.symbol] || t.symbol,
      usd_value: t.balance * (REALTIME_PRICES[t.symbol] || 0),
    }));
  }, [rawData, camlyPrice]);

  return {
    data,
    ...queryRest,
  };
}

// Aggregate tokens by symbol for total portfolio view
export function useAggregatedTokenBalances() {
  const { data: camlyPriceData } = useCamlyPrice();
  const camlyPrice = camlyPriceData?.price_usd || 0.00002069;
  
  const { data: tokens, ...rest } = useTokenBalancesFromDB();

  const aggregated = useMemo(() => {
    if (!tokens) return [];
    return aggregateTokens(tokens);
  }, [tokens]);

  // Build realtime prices for export
  const prices: Record<string, number> = useMemo(() => ({
    'CAMLY': camlyPrice,
    ...BASE_PRICES,
  }), [camlyPrice]);

  return {
    data: aggregated,
    prices,
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
