import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ApiSetting {
  id: string;
  key_name: string;
  key_value: string | null;
}

export function useApiSettings() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['api-settings'],
    queryFn: async (): Promise<ApiSetting[]> => {
      const { data, error } = await supabase
        .from('api_settings')
        .select('id, key_name, key_value')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key_name, key_value }: { key_name: string; key_value: string }) => {
      const { error } = await supabase
        .from('api_settings')
        .update({ key_value })
        .eq('key_name', key_name);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-settings'] });
    },
    onError: (error) => {
      console.error('Error updating API setting:', error);
      toast.error('Lỗi khi lưu API setting');
    },
  });

  // Helper to get setting by key name
  const getSettingByKey = (key_name: string): string => {
    const setting = settingsQuery.data?.find(s => s.key_name === key_name);
    return setting?.key_value || '';
  };

  return {
    settings: settingsQuery.data || [],
    isLoading: settingsQuery.isLoading,
    isError: settingsQuery.isError,
    updateSetting: updateSettingMutation.mutate,
    getSettingByKey,
    isUpdating: updateSettingMutation.isPending,
  };
}
