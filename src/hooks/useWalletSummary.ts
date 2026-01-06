import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWallets } from './useWallets';

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
}

export interface WalletSummary {
  wallet_id: string;
  wallet_name: string;
  tokens: WalletTokenSummary[];
  total_inflow_usd: number;
  total_outflow_usd: number;
  total_net_usd: number;
}

export function useWalletSummary() {
  const { data: wallets } = useWallets();

  return useQuery({
    queryKey: ['wallet-summary', wallets?.map(w => w.id)],
    queryFn: async (): Promise<WalletSummary[]> => {
      if (!wallets || wallets.length === 0) return [];

      // Fetch aggregated data for all wallets
      const { data, error } = await supabase
        .from('transactions')
        .select('wallet_id, token_symbol, direction, amount, usd_value');

      if (error) throw error;

      // Group by wallet_id, token_symbol, direction
      const summaryMap = new Map<string, Map<string, { in: { amount: number; usd: number; count: number }; out: { amount: number; usd: number; count: number } }>>();

      (data || []).forEach(tx => {
        const amount = Number(tx.amount) || 0;
        const usd = Number(tx.usd_value) || 0;
        
        if (!summaryMap.has(tx.wallet_id)) {
          summaryMap.set(tx.wallet_id, new Map());
        }
        
        const walletMap = summaryMap.get(tx.wallet_id)!;
        
        if (!walletMap.has(tx.token_symbol)) {
          walletMap.set(tx.token_symbol, {
            in: { amount: 0, usd: 0, count: 0 },
            out: { amount: 0, usd: 0, count: 0 }
          });
        }
        
        const tokenData = walletMap.get(tx.token_symbol)!;
        
        if (tx.direction === 'IN') {
          tokenData.in.amount += amount;
          tokenData.in.usd += usd;
          tokenData.in.count += 1;
        } else {
          tokenData.out.amount += amount;
          tokenData.out.usd += usd;
          tokenData.out.count += 1;
        }
      });

      // Convert to array format
      const result: WalletSummary[] = wallets.map(wallet => {
        const walletMap = summaryMap.get(wallet.id);
        const tokens: WalletTokenSummary[] = [];
        let total_inflow_usd = 0;
        let total_outflow_usd = 0;

        if (walletMap) {
          // Sort tokens: CAMLY first, then USDT
          const sortedTokens = Array.from(walletMap.entries()).sort((a, b) => {
            if (a[0] === 'CAMLY') return -1;
            if (b[0] === 'CAMLY') return 1;
            return a[0].localeCompare(b[0]);
          });

          sortedTokens.forEach(([symbol, data]) => {
            tokens.push({
              token_symbol: symbol,
              inflow_amount: data.in.amount,
              inflow_usd: data.in.usd,
              inflow_count: data.in.count,
              outflow_amount: data.out.amount,
              outflow_usd: data.out.usd,
              outflow_count: data.out.count,
              net_amount: data.in.amount - data.out.amount,
              net_usd: data.in.usd - data.out.usd,
            });
            total_inflow_usd += data.in.usd;
            total_outflow_usd += data.out.usd;
          });
        }

        return {
          wallet_id: wallet.id,
          wallet_name: wallet.name,
          tokens,
          total_inflow_usd,
          total_outflow_usd,
          total_net_usd: total_inflow_usd - total_outflow_usd,
        };
      });

      return result;
    },
    enabled: !!wallets && wallets.length > 0,
  });
}
