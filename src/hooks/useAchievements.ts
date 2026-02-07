import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon_emoji: string;
  threshold_type: string;
  threshold_value: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement: Achievement;
}

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('threshold_value', { ascending: true });
      if (error) throw error;
      return data as Achievement[];
    },
  });
}

export function useUserAchievements(userId?: string) {
  return useQuery({
    queryKey: ['user-achievements', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', userId!)
        .order('earned_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(ua => ({
        id: ua.id,
        user_id: ua.user_id,
        achievement_id: ua.achievement_id,
        earned_at: ua.earned_at,
        achievement: ua.achievements as unknown as Achievement,
      })) as UserAchievement[];
    },
  });
}
