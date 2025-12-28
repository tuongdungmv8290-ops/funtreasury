import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface TxMetadataUpdate {
  transactionId: string;
  category?: string | null;
  note?: string | null;
  tags?: string[] | null;
}

export function useUpdateTxMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionId, category, note, tags }: TxMetadataUpdate) => {
      // First check if metadata exists for this transaction
      const { data: existing } = await supabase
        .from('tx_metadata')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const updateData: Record<string, unknown> = {};
        if (category !== undefined) updateData.category = category;
        if (note !== undefined) updateData.note = note;
        if (tags !== undefined) updateData.tags = tags;

        const { error } = await supabase
          .from('tx_metadata')
          .update(updateData)
          .eq('transaction_id', transactionId);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('tx_metadata')
          .insert({
            transaction_id: transactionId,
            category: category || null,
            note: note || null,
            tags: tags || null,
          });

        if (error) throw error;
      }

      return { transactionId, category, note, tags };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Đã lưu ghi chú",
        description: "Thông tin giao dịch đã được cập nhật thành công",
      });
    },
    onError: (error) => {
      console.error('Error updating tx metadata:', error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu ghi chú. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });
}
