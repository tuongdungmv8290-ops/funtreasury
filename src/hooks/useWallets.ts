import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

// Realtime prices - CAMLY at $0.000032
const REALTIME_PRICES: Record<string, number> = {
  'CAMLY': 0.000032,
  'BTC': 91374,
  'BTCB': 91374,
  'BNB': 885,
  'USDT': 1,
  'USDC': 1,
};

export function useWallets() {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: async (): Promise<Wallet[]> => {
      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('*');

      if (walletsError) throw walletsError;

      const { data: tokens, error: tokensError } = await supabase
        .from('tokens')
        .select('*');

      if (tokensError) throw tokensError;

      return (wallets || []).map(wallet => {
        // Filter and recalculate tokens with realtime prices
        const walletTokens = (tokens || [])
          .filter(t => t.wallet_id === wallet.id && CORE_TOKENS.includes(t.symbol))
          .map(t => {
            const balance = Number(t.balance);
            const price = REALTIME_PRICES[t.symbol] || 0;
            return {
              id: t.id,
              symbol: t.symbol,
              balance: balance,
              usd_value: balance * price,
            };
          })
          .filter(t => t.balance > 0); // Only show tokens with balance
        
        const totalBalance = walletTokens.reduce((sum, t) => sum + t.usd_value, 0);
        
        return {
          id: wallet.id,
          name: wallet.name,
          address: wallet.address,
          chain: wallet.chain,
          tokens: walletTokens,
          totalBalance,
        };
      });
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}
