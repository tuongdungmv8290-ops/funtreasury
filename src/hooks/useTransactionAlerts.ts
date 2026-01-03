import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TransactionAlert {
  id: string;
  enabled: boolean;
  threshold_usd: number;
  direction: string;
  token_symbol: string | null;
  created_at: string;
  updated_at: string;
}

export function useTransactionAlerts() {
  const queryClient = useQueryClient();

  const { data: alertConfig, isLoading } = useQuery({
    queryKey: ['transaction-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_alerts')
        .select('*')
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching alert config:', error);
        return null;
      }
      return data as TransactionAlert;
    }
  });

  const updateAlert = useMutation({
    mutationFn: async (updates: Partial<TransactionAlert>) => {
      if (!alertConfig?.id) {
        throw new Error('No alert config found');
      }
      
      const { error } = await supabase
        .from('transaction_alerts')
        .update(updates)
        .eq('id', alertConfig.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-alerts'] });
      toast.success('Đã lưu cài đặt Transaction Alerts!');
    },
    onError: (error) => {
      console.error('Error updating alert:', error);
      toast.error('Không thể lưu cài đặt');
    }
  });

  return {
    alertConfig,
    isLoading,
    updateAlert: updateAlert.mutate,
    isUpdating: updateAlert.isPending
  };
}

// Check if a transaction should trigger an alert
export function shouldTriggerAlert(
  alertConfig: TransactionAlert | null | undefined,
  tx: { direction: string; usd_value: number; token_symbol: string }
): boolean {
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
