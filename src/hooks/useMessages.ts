import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MessageWithProfile {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  gift_id: string | null;
  read: boolean;
  created_at: string;
  sender_name: string;
  receiver_name: string;
}

export function useMessages(otherUserId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!user || !otherUserId) return;

    const channel = supabase
      .channel(`messages-${[user.id, otherUserId].sort().join('-')}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', user.id, otherUserId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, otherUserId, queryClient]);

  return useQuery({
    queryKey: ['messages', user?.id, otherUserId],
    enabled: !!user && !!otherUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user!.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user!.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.flatMap(m => [m.sender_id, m.receiver_id]))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(m => ({
        ...m,
        sender_name: profileMap.get(m.sender_id)?.display_name || 'Unknown',
        receiver_name: profileMap.get(m.receiver_id)?.display_name || 'Unknown',
      })) as MessageWithProfile[];
    },
  });
}

export function useUnreadCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription for unread count
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`unread-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unread-messages', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['unread-messages', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user!.id)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .in('id', messageIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
    },
  });
}
