import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatePost } from '@/hooks/usePosts';

export function CreatePost() {
  const { user } = useAuth();
  const createPost = useCreatePost();
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    createPost.mutate({ content: content.trim() }, {
      onSuccess: () => setContent(''),
    });
  };

  const initials = (user?.email || '?')[0].toUpperCase();

  return (
    <Card className="border-treasury-gold/20">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Chia sẻ điều gì đó với cộng đồng FUN..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
              className="resize-none border-border/50 focus:border-treasury-gold/50"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || createPost.isPending}
                className="gap-2 bg-gradient-to-r from-treasury-gold to-treasury-gold-dark text-white font-semibold"
                size="sm"
              >
                {createPost.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Đăng bài
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
