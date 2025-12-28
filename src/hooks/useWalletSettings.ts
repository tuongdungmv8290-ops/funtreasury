import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WalletSetting {
  id: string;
  name: string;
  address: string;
  chain: string;
}

export function useWalletSettings() {
  const queryClient = useQueryClient();

  const walletsQuery = useQuery({
    queryKey: ['wallet-settings'],
    queryFn: async (): Promise<WalletSetting[]> => {
      const { data, error } = await supabase
        .from('wallets')
        .select('id, name, address, chain')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const updateWalletsMutation = useMutation({
    mutationFn: async (wallets: WalletSetting[]) => {
      const promises = wallets.map(wallet => 
        supabase
          .from('wallets')
          .update({ 
            name: wallet.name, 
            address: wallet.address, 
            chain: wallet.chain 
          })
          .eq('id', wallet.id)
      );

      const results = await Promise.all(promises);
      
      // Check for errors
      for (const result of results) {
        if (result.error) throw result.error;
      }

      return wallets;
    },
    onSuccess: () => {
      // Invalidate both wallet queries to refresh Dashboard
      queryClient.invalidateQueries({ queryKey: ['wallet-settings'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Đã lưu cấu hình ví thành công');
    },
    onError: (error) => {
      console.error('Error updating wallets:', error);
      toast.error('Lỗi khi lưu cấu hình ví');
    },
  });

  return {
    wallets: walletsQuery.data || [],
    isLoading: walletsQuery.isLoading,
    isError: walletsQuery.isError,
    updateWallets: updateWalletsMutation.mutate,
    isUpdating: updateWalletsMutation.isPending,
  };
}
