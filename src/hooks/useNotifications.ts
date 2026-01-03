import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import type { Json } from '@/integrations/supabase/types';

export interface Notification {
  id: string;
  title: string;
  description: string | null;
  type: 'success' | 'error' | 'info' | 'warning';
  read: boolean;
  created_at: string;
  metadata: Json;
}

// Helper function to save notification to DB
export async function saveNotification(
  title: string,
  description?: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info',
  metadata?: Record<string, unknown>
) {
  const { error } = await supabase
    .from('notifications')
    .insert([{
      title,
      description: description || null,
      type,
      metadata: (metadata || {}) as Json
    }]);
  
  if (error) {
    console.error('Failed to save notification:', error);
  }
}

export function useNotifications() {
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Notification[];
    }
  });

  // Count unread
  const unreadCount = notifications.filter(n => !n.read).length;

  // Mark single as read
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Realtime subscription for new notifications
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate
  };
}
