import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Trade {
  txHash: string;
  type: 'buy' | 'sell' | 'transfer';
  amount: number;
  priceUsd: number;
  valueUsd: number;
  timestamp: string;
  maker: string;
  from?: string;
  to?: string;
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
  total: number;
  timeframe: string;
}

interface Stats {
  buys24h: number;
  sells24h: number;
  transfers24h: number;
  volume24h: number;
  buys7d: number;
  sells7d: number;
  volume7d: number;
}

interface CamlyTradesData {
  topHolders: Holder[];
  recentTrades: Trade[];
  currentPrice: number;
  pagination: Pagination;
  stats?: Stats;
}

async function fetchCamlyTrades(page: number): Promise<CamlyTradesData> {
  const { data, error } = await supabase.functions.invoke('get-camly-trades', {
    body: { page, limit: 50 }
  });
  
  if (error) {
    console.error('Error fetching CAMLY trades:', error);
    throw error;
  }
  
  // Ensure we have valid pagination data
  const result = data?.data || {
    topHolders: [],
    recentTrades: [],
    currentPrice: 0,
    pagination: { page: 1, limit: 50, hasMore: false, total: 0, timeframe: '7d' },
    stats: undefined
  };
  
  return result;
}

export function useCamlyTrades() {
  return useInfiniteQuery<CamlyTradesData, Error>({
    queryKey: ['camly-trades'],
    queryFn: ({ pageParam }) => fetchCamlyTrades(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Safe check for pagination
      if (!lastPage || !lastPage.pagination) return undefined;
      if (!lastPage.pagination.hasMore) return undefined;
      return lastPage.pagination.page + 1;
    },
    refetchInterval: 15 * 1000,
    staleTime: 10 * 1000,
    retry: 2,
  });
}
