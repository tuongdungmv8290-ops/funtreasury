import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  market_cap_rank: number;
  sparkline_in_7d?: { price: number[] };
}

interface CryptoPricesResponse {
  success: boolean;
  data: CryptoPrice[];
  lastUpdated: string;
  error?: string;
}

export function useCryptoPrices() {
  return useQuery({
    queryKey: ['crypto-prices'],
    queryFn: async (): Promise<CryptoPrice[]> => {
      const { data, error } = await supabase.functions.invoke<CryptoPricesResponse>('get-crypto-prices');
      
      if (error) {
        console.error('[useCryptoPrices] Error:', error);
        throw error;
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch crypto prices');
      }
      
      return data.data;
    },
    refetchInterval: 60 * 1000, // Refresh every 60 seconds
    staleTime: 50 * 1000,
    retry: 2,
  });
}
