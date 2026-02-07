import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PostWithAuthor {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  gift_count: number;
  total_gifts_received: number;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar: string | null;
  author_light_score: number;
}

export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      const authorIds = [...new Set(posts.map(p => p.author_id))];
      const [{ data: profiles }, { data: scores }] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', authorIds),
        supabase.from('light_scores').select('user_id, light_score').in('user_id', authorIds),
      ]);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const scoreMap = new Map(scores?.map(s => [s.user_id, s.light_score]) || []);

      return posts.map(p => ({
        ...p,
        author_name: profileMap.get(p.author_id)?.display_name || 'Anonymous',
        author_avatar: profileMap.get(p.author_id)?.avatar_url || null,
        author_light_score: scoreMap.get(p.author_id) || 0,
      })) as PostWithAuthor[];
    },
  });
}

export function useCreatePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, image_url }: { content: string; image_url?: string }) => {
      if (!user) throw new Error('Chưa đăng nhập');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          content,
          image_url: image_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Đăng bài thành công!');
    },
    onError: (error: Error) => {
      toast.error('Lỗi đăng bài: ' + error.message);
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Đã xóa bài viết');
    },
    onError: (error: Error) => {
      toast.error('Lỗi xóa bài: ' + error.message);
    },
  });
}
