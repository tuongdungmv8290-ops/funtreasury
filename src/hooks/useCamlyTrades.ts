import { useInfiniteQuery } from '@tanstack/react-query';
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

interface Pagination {
  page: number;
  limit: number;
  hasMore: boolean;
  total24h: number;
}

interface CamlyTradesData {
  topHolders: Holder[];
  recentTrades: Trade[];
  currentPrice: number;
  pagination: Pagination;
}

export function useCamlyTrades() {
  return useInfiniteQuery({
    queryKey: ['camly-trades'],
    queryFn: async ({ pageParam = 1 }): Promise<CamlyTradesData> => {
      const { data, error } = await supabase.functions.invoke('get-camly-trades', {
        body: { page: pageParam, limit: 50 }
      });
      
      if (error) {
        console.error('Error fetching CAMLY trades:', error);
        throw error;
      }
      
      return data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.pagination?.hasMore) return undefined;
      return lastPage.pagination.page + 1;
    },
    refetchInterval: 15 * 1000,
    staleTime: 10 * 1000,
    retry: 2,
  });
}
