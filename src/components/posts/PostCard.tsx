import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Gift, Trash2, Sparkles } from 'lucide-react';
import { LightScoreBadge } from '@/components/gifts/LightScoreBadge';
import { AchievementBadges } from '@/components/gifts/AchievementBadges';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useDeletePost } from '@/hooks/usePosts';
import type { PostWithAuthor } from '@/hooks/usePosts';

interface PostCardProps {
  post: PostWithAuthor;
  onGift: (postId: string, authorId: string) => void;
}

export function PostCard({ post, onGift }: PostCardProps) {
  const { user } = useAuth();
  const deletePost = useDeletePost();
  const isAuthor = user?.id === post.author_id;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <Card className="border-treasury-gold/10 hover:border-treasury-gold/30 transition-colors">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {post.author_name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate">{post.author_name}</p>
              {post.author_light_score > 0 && (
                <LightScoreBadge score={post.author_light_score} size="sm" />
              )}
              <AchievementBadges userId={post.author_id} maxShow={3} />
            </div>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          {isAuthor && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => deletePost.mutate(post.id)}
              disabled={deletePost.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <p className="text-sm whitespace-pre-wrap mb-3">{post.content}</p>

        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post"
            className="rounded-lg w-full max-h-80 object-cover mb-3"
            loading="lazy"
          />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {post.gift_count > 0 && (
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-treasury-gold" />
                <span className="gold-text font-semibold">{post.gift_count}</span> quà
                <span className="mx-1">•</span>
                <span className="gold-text font-semibold">${post.total_gifts_received.toFixed(2)}</span>
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-treasury-gold/30 hover:bg-treasury-gold/10 hover:border-treasury-gold/50 text-treasury-gold"
            onClick={() => onGift(post.id, post.author_id)}
          >
            <Gift className="w-3.5 h-3.5" />
            Tặng Thưởng
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
