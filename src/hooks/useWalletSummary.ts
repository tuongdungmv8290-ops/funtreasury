import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallets } from './useWallets';
import { useCamlyPrice } from './useCamlyPrice';

export interface WalletTokenSummary {
  token_symbol: string;
  inflow_amount: number;
  inflow_usd: number;
  inflow_count: number;
  outflow_amount: number;
  outflow_usd: number;
  outflow_count: number;
  net_amount: number;
  net_usd: number;
  current_balance: number;
  current_balance_usd: number;
}

export interface WalletSummary {
  wallet_id: string;
  wallet_name: string;
  wallet_chain: string;
  tokens: WalletTokenSummary[];
  total_inflow_usd: number;
  total_outflow_usd: number;
  total_net_usd: number;
}

// Fallback prices (will be overridden by realtime prices)
const FALLBACK_PRICES: Record<string, number> = {
  'CAMLY': 0.000022,
  'BTC': 97000,
  'BTCB': 97000,
  'BNB': 710,
  'USDT': 1,
  'USDC': 1,
};

// Core tokens to display (filter out spam/airdrop tokens)
const CORE_TOKENS = ['CAMLY', 'USDT', 'BTC'];

// Raw data interface (amounts only, no USD)
interface RawTokenData {
  token_symbol: string;
  inflow_amount: number;
  inflow_count: number;
  outflow_amount: number;
  outflow_count: number;
  current_balance: number;
}

interface RawWalletSummary {
  wallet_id: string;
  wallet_name: string;
  wallet_chain: string;
  tokens: RawTokenData[];
}

export function useWalletSummary() {
  const queryClient = useQueryClient();
  const { data: wallets } = useWallets();
  const { data: camlyPriceData } = useCamlyPrice();

  // Stabilize wallet IDs to prevent unnecessary re-renders
  const walletIds = useMemo(() => wallets?.map(w => w.id) ?? [], [wallets]);
  const camlyPrice = camlyPriceData?.price_usd ?? FALLBACK_PRICES['CAMLY'];

  // STEP 1: Fetch raw transaction data (WITHOUT price in queryKey!)
  const rawQuery = useQuery({
    queryKey: ['wallet-summary-raw', walletIds],
    queryFn: async (): Promise<RawWalletSummary[]> => {
      if (!wallets || wallets.length === 0) return [];

      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('wallet_id, token_symbol, direction, amount, usd_value');

      if (txError) throw txError;

      // Fetch current balances from tokens table
      const { data: tokenBalances, error: tokenError } = await supabase
        .from('tokens')
        .select('wallet_id, symbol, balance');

      if (tokenError) throw tokenError;

      // Create balance lookup map (raw amounts only)
      const balanceMap = new Map<string, Map<string, number>>();
      (tokenBalances || []).forEach(t => {
        if (!balanceMap.has(t.wallet_id)) {
          balanceMap.set(t.wallet_id, new Map());
        }
        balanceMap.get(t.wallet_id)!.set(t.symbol, Number(t.balance) || 0);
      });

      // Group transactions by wallet_id, token_symbol, direction
      const summaryMap = new Map<string, Map<string, { in: { amount: number; count: number }; out: { amount: number; count: number } }>>();

      (txData || []).forEach(tx => {
        const amount = Number(tx.amount) || 0;
        
        if (!summaryMap.has(tx.wallet_id)) {
          summaryMap.set(tx.wallet_id, new Map());
        }
        
        const walletMap = summaryMap.get(tx.wallet_id)!;
        
        if (!walletMap.has(tx.token_symbol)) {
          walletMap.set(tx.token_symbol, {
            in: { amount: 0, count: 0 },
            out: { amount: 0, count: 0 }
          });
        }
        
        const tokenData = walletMap.get(tx.token_symbol)!;
        
        if (tx.direction === 'IN') {
          tokenData.in.amount += amount;
          tokenData.in.count += 1;
        } else {
          tokenData.out.amount += amount;
          tokenData.out.count += 1;
        }
      });

      // Convert to array format (raw amounts only)
      const result: RawWalletSummary[] = wallets.map(wallet => {
        const walletMap = summaryMap.get(wallet.id);
        const walletBalances = balanceMap.get(wallet.id);
        const tokens: RawTokenData[] = [];

        // For BTC wallets without transactions, show balance only
        if (wallet.chain === 'BTC') {
          const btcBalance = walletBalances?.get('BTC');
          if (btcBalance && btcBalance > 0) {
            tokens.push({
              token_symbol: 'BTC',
              inflow_amount: 0,
              inflow_count: 0,
              outflow_amount: 0,
              outflow_count: 0,
              current_balance: btcBalance,
            });
          }
        } else {
          // FIX: Merge tokens from BOTH transactions AND balances
          // This ensures tokens with balance but no/few transactions (like CAMLY in BNB2) are displayed
          
          // Collect all token symbols from both sources
          const allSymbols = new Set<string>();
          
          // Add symbols from transactions
          if (walletMap) {
            walletMap.forEach((_, symbol) => {
              if (CORE_TOKENS.includes(symbol)) {
                allSymbols.add(symbol);
              }
            });
          }
          
          // Add symbols from token balances (with balance > 0)
          if (walletBalances) {
            walletBalances.forEach((balance, symbol) => {
              const hasBalance = balance !== null && balance !== undefined && Number(balance) !== 0;
              if (hasBalance && CORE_TOKENS.includes(symbol)) {
                allSymbols.add(symbol);
              }
            });
          }
          
          // Sort with fixed priority order: CAMLY -> BTCB -> USDT -> others
          const TOKEN_ORDER = ['CAMLY', 'BTC', 'USDT'];
          const sortedSymbols = Array.from(allSymbols).sort((a, b) => {
            const orderA = TOKEN_ORDER.indexOf(a);
            const orderB = TOKEN_ORDER.indexOf(b);
            if (orderA === -1 && orderB === -1) return a.localeCompare(b);
            if (orderA === -1) return 1;
            if (orderB === -1) return -1;
            return orderA - orderB;
          });
          
          // Build tokens array with data from BOTH sources
          sortedSymbols.forEach(symbol => {
            const txData = walletMap?.get(symbol);
            const balance = walletBalances?.get(symbol) ?? 0;
            
            tokens.push({
              token_symbol: symbol,
              inflow_amount: txData?.in.amount ?? 0,
              inflow_count: txData?.in.count ?? 0,
              outflow_amount: txData?.out.amount ?? 0,
              outflow_count: txData?.out.count ?? 0,
              current_balance: balance,
            });
          });
          
        }

        return {
          wallet_id: wallet.id,
          wallet_name: wallet.name,
          wallet_chain: wallet.chain,
          tokens,
        };
      });

      return result;
    },
    enabled: walletIds.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (previousData) => previousData, // Keep old data while refetching
  });

  // STEP 2: Calculate USD values in useMemo (separate from queryKey!)
  const data = useMemo((): WalletSummary[] | undefined => {
    if (!rawQuery.data) return undefined;

    const realtimePrices: Record<string, number> = {
      ...FALLBACK_PRICES,
      'CAMLY': camlyPrice,
    };

    return rawQuery.data.map(wallet => {
      const tokens: WalletTokenSummary[] = wallet.tokens.map(t => {
        const price = realtimePrices[t.token_symbol] || 0;
        const inflowUsd = t.inflow_amount * price;
        const outflowUsd = t.outflow_amount * price;
        const netAmount = t.inflow_amount - t.outflow_amount;
        const balanceUsd = t.current_balance * price;

        return {
          token_symbol: t.token_symbol,
          inflow_amount: t.inflow_amount,
          inflow_usd: inflowUsd,
          inflow_count: t.inflow_count,
          outflow_amount: t.outflow_amount,
          outflow_usd: outflowUsd,
          outflow_count: t.outflow_count,
          net_amount: netAmount,
          net_usd: inflowUsd - outflowUsd,
          current_balance: t.current_balance,
          current_balance_usd: balanceUsd,
        };
      });

      const totalInflowUsd = tokens.reduce((sum, t) => sum + t.inflow_usd, 0);
      const totalOutflowUsd = tokens.reduce((sum, t) => sum + t.outflow_usd, 0);

      return {
        wallet_id: wallet.wallet_id,
        wallet_name: wallet.wallet_name,
        wallet_chain: wallet.wallet_chain,
        tokens,
        total_inflow_usd: totalInflowUsd,
        total_outflow_usd: totalOutflowUsd,
        total_net_usd: totalInflowUsd - totalOutflowUsd,
      };
    });
  }, [rawQuery.data, camlyPrice]);

  // STEP 3: Realtime updates with debounce (listen to BOTH transactions AND tokens)
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const invalidateWithDebounce = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['wallet-summary-raw'] });
      }, 3000); // 3 seconds debounce
    };

    // Listen to transactions table
    const txChannel = supabase
      .channel('wallet-summary-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        invalidateWithDebounce
      )
      .subscribe();

    // Listen to tokens table for balance updates
    const tokensChannel = supabase
      .channel('wallet-summary-tokens')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tokens',
        },
        invalidateWithDebounce
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(txChannel);
      supabase.removeChannel(tokensChannel);
    };
  }, [queryClient]);

  return {
    data,
    isLoading: rawQuery.isLoading,
    refetch: rawQuery.refetch,
  };
}
