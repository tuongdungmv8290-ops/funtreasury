import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TransactionMetadata {
  category: string | null;
  note: string | null;
  tags: string[] | null;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  tx_hash: string;
  block_number: number;
  timestamp: Date;
  from_address: string;
  to_address: string;
  direction: 'IN' | 'OUT';
  token_address: string | null;
  token_symbol: string;
  amount: number;
  usd_value: number;
  gas_fee: number;
  status: string;
  metadata?: TransactionMetadata;
}

export interface TransactionFilters {
  walletId?: string;
  direction?: 'IN' | 'OUT';
  tokenSymbol?: string;
  search?: string;
  days?: number;
}

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async (): Promise<Transaction[]> => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          tx_metadata (category, note, tags)
        `)
        .order('timestamp', { ascending: false });

      if (filters?.walletId) {
        query = query.eq('wallet_id', filters.walletId);
      }
      if (filters?.direction) {
        query = query.eq('direction', filters.direction);
      }
      if (filters?.tokenSymbol) {
        query = query.eq('token_symbol', filters.tokenSymbol);
      }
      if (filters?.days) {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - filters.days);
        query = query.gte('timestamp', fromDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      let transactions = (data || []).map(tx => ({
        id: tx.id,
        wallet_id: tx.wallet_id,
        tx_hash: tx.tx_hash,
        block_number: tx.block_number,
        timestamp: new Date(tx.timestamp),
        from_address: tx.from_address,
        to_address: tx.to_address,
        direction: tx.direction as 'IN' | 'OUT',
        token_address: tx.token_address,
        token_symbol: tx.token_symbol,
        amount: Number(tx.amount),
        usd_value: Number(tx.usd_value),
        gas_fee: Number(tx.gas_fee),
        status: tx.status,
        metadata: tx.tx_metadata ? {
          category: tx.tx_metadata.category,
          note: tx.tx_metadata.note,
          tags: tx.tx_metadata.tags,
        } : undefined,
      }));

      // Client-side search filter
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        transactions = transactions.filter(tx =>
          tx.tx_hash.toLowerCase().includes(searchLower) ||
          tx.from_address.toLowerCase().includes(searchLower) ||
          tx.to_address.toLowerCase().includes(searchLower) ||
          tx.token_symbol.toLowerCase().includes(searchLower)
        );
      }

      return transactions;
    },
  });
}

export function useTransactionStats(days: number = 30) {
  return useQuery({
    queryKey: ['transaction-stats', days],
    queryFn: async () => {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data, error } = await supabase
        .from('transactions')
        .select('direction, usd_value, status')
        .gte('timestamp', fromDate.toISOString())
        .eq('status', 'success');

      if (error) throw error;

      const stats = (data || []).reduce(
        (acc, tx) => {
          const value = Number(tx.usd_value);
          if (tx.direction === 'IN') {
            acc.inflow += value;
          } else {
            acc.outflow += value;
          }
          acc.txCount++;
          return acc;
        },
        { inflow: 0, outflow: 0, txCount: 0 }
      );

      return {
        ...stats,
        netflow: stats.inflow - stats.outflow,
      };
    },
  });
}
