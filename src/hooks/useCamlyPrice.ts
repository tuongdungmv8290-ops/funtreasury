import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface CamlyPriceData {
  price_usd: number;
  change_24h: number;
  volume_24h: number;
  market_cap: number;
  last_updated: string;
  source: string;
}

export function useCamlyPrice() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['camly-price'],
    queryFn: async (): Promise<CamlyPriceData> => {
      const { data, error } = await supabase.functions.invoke('get-camly-price');
      
      if (error) {
        console.error('Error fetching CAMLY price:', error);
        throw error;
      }
      
      return data.data;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 4 * 60 * 1000, // Consider stale after 4 minutes
    retry: 2,
  });

  // Show toast when price is updated
  useEffect(() => {
    if (query.data && query.dataUpdatedAt) {
      // Only show toast after initial load (not on first fetch)
      const isRefetch = queryClient.getQueryState(['camly-price'])?.dataUpdateCount || 0;
      if (isRefetch > 1) {
        toast.success('💰 Giá CAMLY đã cập nhật realtime!', {
          duration: 3000,
          id: 'camly-price-update'
        });
      }
    }
  }, [query.dataUpdatedAt, queryClient]);

  return query;
}
