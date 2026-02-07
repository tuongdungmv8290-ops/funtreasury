import { usePosts } from '@/hooks/usePosts';
import { PostCard } from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare } from 'lucide-react';

interface PostFeedProps {
  onGift: (postId: string, authorId: string) => void;
}

export function PostFeed({ onGift }: PostFeedProps) {
  const { data: posts, isLoading } = usePosts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Chưa có bài viết nào. Hãy là người đầu tiên!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <PostCard key={post.id} post={post} onGift={onGift} />
      ))}
    </div>
  );
}
