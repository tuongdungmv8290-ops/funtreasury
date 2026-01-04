import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Trade {
  txHash: string;
  type: 'buy' | 'sell';
  amount: number;
  priceUsd: number;
  valueUsd: number;
  timestamp: string;
  maker: string;
}

interface Holder {
  address: string;
  balance: number;
  percentage: number;
  valueUsd: number;
}

interface CamlyTradesData {
  topHolders: Holder[];
  recentTrades: Trade[];
  currentPrice: number;
}

export function useCamlyTrades() {
  return useQuery({
    queryKey: ['camly-trades'],
    queryFn: async (): Promise<CamlyTradesData> => {
      const { data, error } = await supabase.functions.invoke('get-camly-trades');
      
      if (error) {
        console.error('Error fetching CAMLY trades:', error);
        throw error;
      }
      
      return data.data;
    },
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
    staleTime: 1 * 60 * 1000,
    retry: 2,
  });
}
