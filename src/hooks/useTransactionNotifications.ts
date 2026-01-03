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
          
          // Fetch wallet name for better notification
          const { data: wallet } = await supabase
            .from('wallets')
            .select('name')
            .eq('id', tx.wallet_id)
            .single();
          
          const walletName = wallet?.name || 'Treasury Wallet';
          const amountFormatted = formatTokenAmount(tx.amount, tx.token_symbol);
          const usdFormatted = formatUSD(tx.usd_value);
          
          if (tx.direction === 'IN') {
            const title = `💰 Nhận ${amountFormatted} ${tx.token_symbol} (${usdFormatted})`;
            const description = `Vào ${walletName}`;
            
            toast.success(title, {
              description,
              duration: 6000,
              icon: '📥',
            });
            
            // Save to notifications DB
            await saveNotification(title, description, 'success', {
              tx_hash: tx.tx_hash,
              direction: tx.direction,
              token_symbol: tx.token_symbol,
              amount: tx.amount,
              usd_value: tx.usd_value
            });
          } else {
            const title = `📤 Chuyển ${amountFormatted} ${tx.token_symbol} (${usdFormatted})`;
            const description = `Từ ${walletName}`;
            
            toast.info(title, {
              description,
              duration: 6000,
              icon: '📤',
            });
            
            // Save to notifications DB
            await saveNotification(title, description, 'info', {
              tx_hash: tx.tx_hash,
              direction: tx.direction,
              token_symbol: tx.token_symbol,
              amount: tx.amount,
              usd_value: tx.usd_value
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
