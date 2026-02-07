import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAddressBook() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedAddresses = [], isLoading } = useQuery({
    queryKey: ['address-book', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('address_labels')
        .select('address, label, created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const saveAddress = useMutation({
    mutationFn: async ({ address, label }: { address: string; label: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('address_labels')
        .upsert(
          { address: address.toLowerCase(), label, created_by: user.id },
          { onConflict: 'address' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['address-book', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['address-labels'] });
    },
  });

  const deleteAddress = useMutation({
    mutationFn: async (address: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('address_labels')
        .delete()
        .eq('address', address.toLowerCase())
        .eq('created_by', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['address-book', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['address-labels'] });
    },
  });

  return { savedAddresses, isLoading, saveAddress, deleteAddress };
}
