import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usd_value: number;
  contract_address: string;
}

export interface WalletBalances {
  wallet: string;
  walletName: string;
  tokens: TokenBalance[];
}

export function useTokenBalances() {
  return useQuery({
    queryKey: ['token-balances'],
    queryFn: async (): Promise<WalletBalances[]> => {
      const { data, error } = await supabase.functions.invoke('get-token-balances');
      
      if (error) {
        console.error('Error fetching token balances:', error);
        throw error;
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch balances');
      }
      
      return data.balances || [];
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}
