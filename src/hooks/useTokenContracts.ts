import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TokenContract {
  id: string;
  symbol: string;
  name: string;
  contract_address: string | null;
}

export function useTokenContracts() {
  const queryClient = useQueryClient();

  const contractsQuery = useQuery({
    queryKey: ['token-contracts'],
    queryFn: async (): Promise<TokenContract[]> => {
      const { data, error } = await supabase
        .from('token_contracts')
        .select('id, symbol, name, contract_address')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: async ({ symbol, contract_address }: { symbol: string; contract_address: string }) => {
      const { error } = await supabase
        .from('token_contracts')
        .update({ contract_address })
        .eq('symbol', symbol);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['token-contracts'] });
    },
    onError: (error) => {
      console.error('Error updating token contract:', error);
      toast.error('Lỗi khi lưu contract address');
    },
  });

  const updateAllContracts = async (contracts: { symbol: string; contract_address: string }[]) => {
    try {
      const promises = contracts.map(({ symbol, contract_address }) =>
        supabase
          .from('token_contracts')
          .update({ contract_address })
          .eq('symbol', symbol)
      );

      const results = await Promise.all(promises);
      
      for (const result of results) {
        if (result.error) throw result.error;
      }

      queryClient.invalidateQueries({ queryKey: ['token-contracts'] });
      return true;
    } catch (error) {
      console.error('Error updating token contracts:', error);
      toast.error('Lỗi khi lưu contract addresses');
      return false;
    }
  };

  // Helper to get contract by symbol
  const getContractBySymbol = (symbol: string): string => {
    const contract = contractsQuery.data?.find(c => c.symbol === symbol);
    return contract?.contract_address || '';
  };

  return {
    contracts: contractsQuery.data || [],
    isLoading: contractsQuery.isLoading,
    isError: contractsQuery.isError,
    updateContract: updateContractMutation.mutate,
    updateAllContracts,
    getContractBySymbol,
    isUpdating: updateContractMutation.isPending,
  };
}
