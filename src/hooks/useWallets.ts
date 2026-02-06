import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimePrices } from './useRealtimePrices';
import { useMemo, useEffect } from 'react';

export interface Token {
  id: string;
  symbol: string;
  balance: number;
  usd_value: number;
}

export interface Wallet {
  id: string;
  name: string;
  address: string;
  chain: string;
  tokens: Token[];
  totalBalance: number;
}

// Core tokens to display (filter out spam/airdrops)
const CORE_TOKENS = ['CAMLY', 'BNB', 'USDT', 'BTC', 'BTCB', 'USDC'];


interface RawWalletData {
  id: string;
  name: string;
  address: string;
  chain: string;
  tokens: { id: string; symbol: string; balance: number }[];
}

export function useWallets() {
  const queryClient = useQueryClient();
  const realtimePrices = useRealtimePrices();
  
  // Realtime subscription for tokens table - DEBOUNCED to prevent flicker
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;
    
    const channel = supabase
      .channel('tokens-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tokens'
        },
        (payload) => {
          console.log('💰 Token balance changed:', payload);
          // Debounce invalidation to prevent cascade re-renders (3 seconds)
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['wallets-raw'] });
            queryClient.invalidateQueries({ queryKey: ['token-balances-db-raw'] });
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch raw data without price calculation
  const { data: rawData, ...queryRest } = useQuery({
    queryKey: ['wallets-raw'],
    queryFn: async (): Promise<RawWalletData[]> => {
      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('*');

      if (walletsError) throw walletsError;

      const { data: tokens, error: tokensError } = await supabase
        .from('tokens')
        .select('*');

      if (tokensError) throw tokensError;

      return (wallets || []).map(wallet => {
        const walletTokens = (tokens || [])
          .filter(t => t.wallet_id === wallet.id && CORE_TOKENS.includes(t.symbol))
          .map(t => ({
            id: t.id,
            symbol: t.symbol,
            balance: Number(t.balance),
          }))
          .filter(t => t.balance > 0);

        return {
          id: wallet.id,
          name: wallet.name,
          address: wallet.address,
          chain: wallet.chain,
          tokens: walletTokens,
        };
      });
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    placeholderData: (previousData) => previousData, // Keep old data during refetch
  });

  // Calculate USD values with current CAMLY price (memoized)
  const data = useMemo((): Wallet[] | undefined => {
    if (!rawData) return undefined;

    return rawData.map(wallet => {
      const tokensWithUsd = wallet.tokens.map(t => ({
        ...t,
        usd_value: t.balance * (realtimePrices[t.symbol] || 0),
      }));

      const totalBalance = tokensWithUsd.reduce((sum, t) => sum + t.usd_value, 0);

      return {
        ...wallet,
        tokens: tokensWithUsd,
        totalBalance,
      };
    });
  }, [rawData, realtimePrices]);

  return {
    data,
    ...queryRest,
  };
}
