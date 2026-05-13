import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const KEY = 'last-reward-label-sync';
const TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Đồng bộ tên người nhận (camly_transfers + profiles) → address_labels
 * thông qua edge function chạy bằng service role (bypass RLS).
 * Sau khi hoàn tất, invalidate cache để bảng giao dịch hiện tên ngay.
 */
export function useSyncRewardLabels() {
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const last = Number(localStorage.getItem(KEY) || 0);
    if (Date.now() - last < TTL_MS) return;
    localStorage.setItem(KEY, String(Date.now()));

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('sync-reward-labels');
        if (error) {
          console.debug('[sync-reward-labels] error:', error);
          return;
        }
        if (data?.inserted > 0) {
          queryClient.invalidateQueries({ queryKey: ['address-labels'] });
        }
      } catch (err) {
        console.debug('[sync-reward-labels] skipped:', err);
      }
    })();
  }, [queryClient]);
}
