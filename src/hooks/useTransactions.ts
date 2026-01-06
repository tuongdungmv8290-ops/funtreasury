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

// List of valid tokens to show in transaction history - CHỈ CAMLY và USDT
const VALID_TOKEN_SYMBOLS = ['CAMLY', 'USDT'];

// Minimum USDT amount to show (filter dust spam)
const MIN_USDT_AMOUNT = 1;

// Detect spam/scam token symbols (Unicode tricks, special characters)
function isValidTokenSymbol(symbol: string): boolean {
  if (!symbol) return false;
  const upperSymbol = symbol.toUpperCase().trim();
  
  // Only allow CAMLY and USDT
  return VALID_TOKEN_SYMBOLS.includes(upperSymbol);
}

// Check if transaction is valid (not dust/spam)
function isValidTransaction(tx: { token_symbol: string; amount: number }): boolean {
  const amount = Number(tx.amount);
  const symbol = tx.token_symbol?.toUpperCase();
  
  // Filter dust USDT (< 1 USDT)
  if (symbol === 'USDT' && amount < MIN_USDT_AMOUNT) {
    return false;
  }
  
  // Keep all CAMLY with amount > 0
  return amount > 0;
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

      let transactions = (data || [])
        // Filter out spam/scam tokens
        .filter(tx => isValidTokenSymbol(tx.token_symbol))
        // Filter out dust/spam transactions (USDT < 1, amount = 0)
        .filter(tx => isValidTransaction(tx))
        .map(tx => ({
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
        .select('direction, usd_value, status, token_symbol')
        .gte('timestamp', fromDate.toISOString())
        .eq('status', 'success');

      if (error) throw error;

      const uniqueTokens = new Set<string>();
      const stats = (data || []).reduce(
        (acc, tx) => {
          const value = Number(tx.usd_value);
          if (tx.direction === 'IN') {
            acc.inflow += value;
          } else {
            acc.outflow += value;
          }
          acc.txCount++;
          uniqueTokens.add(tx.token_symbol);
          return acc;
        },
        { inflow: 0, outflow: 0, txCount: 0 }
      );

      return {
        ...stats,
        netflow: stats.inflow - stats.outflow,
        activeTokens: uniqueTokens.size,
      };
    },
  });
}
