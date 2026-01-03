import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatTokenAmount, formatUSD } from '@/lib/formatNumber';
import { saveNotification } from '@/hooks/useNotifications';

interface TransactionPayload {
  id: string;
  wallet_id: string;
  tx_hash: string;
  direction: 'IN' | 'OUT';
  token_symbol: string;
  amount: number;
  usd_value: number;
  from_address: string;
  to_address: string;
  timestamp: string;
}

interface AlertConfig {
  enabled: boolean;
  threshold_usd: number;
  direction: string;
  token_symbol: string | null;
}

// Check if transaction should trigger special alert
function shouldTriggerAlert(alertConfig: AlertConfig | null, tx: TransactionPayload): boolean {
  if (!alertConfig?.enabled) return false;
  
  // Check direction
  if (alertConfig.direction !== 'all') {
    if (alertConfig.direction === 'in' && tx.direction !== 'IN') return false;
    if (alertConfig.direction === 'out' && tx.direction !== 'OUT') return false;
  }
  
  // Check token filter
  if (alertConfig.token_symbol && alertConfig.token_symbol !== tx.token_symbol) {
    return false;
  }
  
  // Check threshold
  if (tx.usd_value < alertConfig.threshold_usd) return false;
  
  return true;
}

export function useTransactionNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔔 Setting up realtime transaction notifications...');
    
    const channel = supabase
      .channel('transaction-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions'
        },
        async (payload) => {
          const tx = payload.new as TransactionPayload;
          console.log('📨 New transaction received:', tx);
          
          // Fetch wallet name and alert config in parallel
          const [walletResult, alertResult] = await Promise.all([
            supabase
              .from('wallets')
              .select('name')
              .eq('id', tx.wallet_id)
              .single(),
            supabase
              .from('transaction_alerts')
              .select('*')
              .limit(1)
              .single()
          ]);
          
          const walletName = walletResult.data?.name || 'Treasury Wallet';
          const alertConfig = alertResult.data as AlertConfig | null;
          const amountFormatted = formatTokenAmount(tx.amount, tx.token_symbol);
          const usdFormatted = formatUSD(tx.usd_value);
          
          // Check if this is a large transaction that should trigger special alert
          const isLargeTx = shouldTriggerAlert(alertConfig, tx);
          
          if (tx.direction === 'IN') {
            const title = isLargeTx 
              ? `🚨 GIAO DỊCH LỚN: Nhận ${amountFormatted} ${tx.token_symbol} (${usdFormatted})`
              : `💰 Nhận ${amountFormatted} ${tx.token_symbol} (${usdFormatted})`;
            const description = `Vào ${walletName}`;
            
            if (isLargeTx) {
              toast.warning(title, {
                description,
                duration: 10000,
                icon: '🚨',
              });
            } else {
              toast.success(title, {
                description,
                duration: 6000,
                icon: '📥',
              });
            }
            
            // Save to notifications DB
            await saveNotification(title, description, isLargeTx ? 'warning' : 'success', {
              tx_hash: tx.tx_hash,
              direction: tx.direction,
              token_symbol: tx.token_symbol,
              amount: tx.amount,
              usd_value: tx.usd_value,
              is_large_tx: isLargeTx
            });
          } else {
            const title = isLargeTx
              ? `🚨 GIAO DỊCH LỚN: Chuyển ${amountFormatted} ${tx.token_symbol} (${usdFormatted})`
              : `📤 Chuyển ${amountFormatted} ${tx.token_symbol} (${usdFormatted})`;
            const description = `Từ ${walletName}`;
            
            if (isLargeTx) {
              toast.warning(title, {
                description,
                duration: 10000,
                icon: '🚨',
              });
            } else {
              toast.info(title, {
                description,
                duration: 6000,
                icon: '📤',
              });
            }
            
            // Save to notifications DB
            await saveNotification(title, description, isLargeTx ? 'warning' : 'info', {
              tx_hash: tx.tx_hash,
              direction: tx.direction,
              token_symbol: tx.token_symbol,
              amount: tx.amount,
              usd_value: tx.usd_value,
              is_large_tx: isLargeTx
            });
          }
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
          queryClient.invalidateQueries({ queryKey: ['token-balances'] });
          queryClient.invalidateQueries({ queryKey: ['wallets'] });
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    return () => {
      console.log('🔕 Cleaning up realtime subscription...');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
