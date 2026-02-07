import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export function useAddressLabels() {
  const queryClient = useQueryClient();

  const { data: labels } = useQuery({
    queryKey: ['address-labels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('address_labels')
        .select('address, label');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('address, name');
      if (error) throw error;
      return data || [];
    },
  });

  const labelMap = useMemo(() => {
    const map = new Map<string, string>();
    // Wallets first (lower priority)
    wallets?.forEach(w => map.set(w.address.toLowerCase(), w.name));
    // Labels override wallets
    labels?.forEach(l => map.set(l.address.toLowerCase(), l.label));
    return map;
  }, [labels, wallets]);

  const getLabel = (address: string): { label: string; isLabeled: boolean } => {
    if (!address) return { label: '', isLabeled: false };
    const found = labelMap.get(address.toLowerCase());
    if (found) return { label: found, isLabeled: true };
    return {
      label: `${address.slice(0, 6)}...${address.slice(-4)}`,
      isLabeled: false,
    };
  };

  const addLabel = useMutation({
    mutationFn: async ({ address, label }: { address: string; label: string }) => {
      const { error } = await supabase
        .from('address_labels')
        .upsert({ address: address.toLowerCase(), label }, { onConflict: 'address' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['address-labels'] });
    },
  });

  return { getLabel, labelMap, addLabel };
}
