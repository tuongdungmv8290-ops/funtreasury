import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCamlyPrice } from "./useCamlyPrice";

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
  circulating_supply: number;
  sparkline_in_7d?: { price: number[] };
}

interface CryptoPricesResponse {
  success: boolean;
  data: CryptoPrice[];
  lastUpdated: string;
  error?: string;
}

export function useCryptoPrices() {
  const { data: camlyData } = useCamlyPrice();

  return useQuery({
    queryKey: ['crypto-prices', camlyData?.price_usd],
    queryFn: async (): Promise<CryptoPrice[]> => {
      const { data, error } = await supabase.functions.invoke<CryptoPricesResponse>('get-crypto-prices');
      
      if (error) {
        console.error('[useCryptoPrices] Error:', error);
        throw error;
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch crypto prices');
      }
      
      let prices = data.data;
      
      // Merge CAMLY data with more accurate values from get-camly-price
      if (camlyData) {
        prices = prices.map(coin => {
          if (coin.symbol.toUpperCase() === 'CAMLY') {
            // Calculate circulating supply from market cap and price
            const circulatingSupply = camlyData.market_cap && camlyData.price_usd > 0
              ? camlyData.market_cap / camlyData.price_usd
              : coin.circulating_supply || 1000000000; // Default 1B if not available

            return {
              ...coin,
              current_price: camlyData.price_usd || coin.current_price,
              price_change_percentage_24h: camlyData.change_24h ?? coin.price_change_percentage_24h,
              total_volume: camlyData.volume_24h || coin.total_volume,
              market_cap: camlyData.market_cap || coin.market_cap,
              circulating_supply: circulatingSupply,
            };
          }
          return coin;
        });
      }
      
      return prices;
    },
    refetchInterval: 60 * 1000, // Refresh every 60 seconds
    staleTime: 50 * 1000,
    retry: 2,
  });
}
