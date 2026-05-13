import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Tự động đồng bộ tên người nhận từ fun.rich (bảng gifts + camly_transfers)
 * vào address_labels, để bảng giao dịch hiển thị tên thay vì địa chỉ.
 *
 * Chạy 1 lần / phiên (debounce qua ref).
 */
export function useSyncRewardLabels() {
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    (async () => {
      try {
        // 1. Lấy nhãn hiện tại để skip
        const { data: existingLabels } = await supabase
          .from('address_labels')
          .select('address');
        const existing = new Set(
          (existingLabels || []).map((l) => l.address.toLowerCase())
        );

        const toUpsert: { address: string; label: string }[] = [];

        // 2. Từ camly_transfers (recipient_address + recipient_name)
        const { data: transfers } = await supabase
          .from('camly_transfers' as any)
          .select('recipient_address, recipient_name')
          .not('recipient_name', 'is', null);

        (transfers || []).forEach((t: any) => {
          if (!t.recipient_address || !t.recipient_name) return;
          const addr = t.recipient_address.toLowerCase();
          if (existing.has(addr)) return;
          toUpsert.push({ address: addr, label: t.recipient_name.trim() });
          existing.add(addr);
        });

        // 3. Từ gifts → profiles (display_name + wallet_address)
        const { data: gifts } = await supabase
          .from('gifts')
          .select('receiver_id, sender_id')
          .eq('status', 'confirmed');

        const userIds = new Set<string>();
        (gifts || []).forEach((g: any) => {
          if (g.receiver_id) userIds.add(g.receiver_id);
          if (g.sender_id) userIds.add(g.sender_id);
        });

        if (userIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, wallet_address')
            .in('user_id', Array.from(userIds));

          (profiles || []).forEach((p: any) => {
            if (!p.wallet_address || !p.display_name) return;
            const addr = p.wallet_address.toLowerCase();
            if (existing.has(addr)) return;
            toUpsert.push({ address: addr, label: p.display_name.trim() });
            existing.add(addr);
          });
        }

        // 4. Upsert (RLS: chỉ admin mới insert được — non-admin sẽ bị bỏ qua êm)
        if (toUpsert.length > 0) {
          const { error } = await supabase
            .from('address_labels')
            .upsert(toUpsert, { onConflict: 'address' });
          if (!error) {
            queryClient.invalidateQueries({ queryKey: ['address-labels'] });
          }
        }
      } catch (err) {
        // silent — đây là sync nền
        console.debug('[useSyncRewardLabels] skipped:', err);
      }
    })();
  }, [queryClient]);
}
