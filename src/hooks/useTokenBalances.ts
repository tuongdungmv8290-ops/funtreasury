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
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for realtime balance
    refetchOnWindowFocus: true, // Refetch when user comes back to the page
  });
}
