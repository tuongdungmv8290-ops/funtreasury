import { useEffect, useRef, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gift, Check, CheckCheck, Send, Search } from 'lucide-react';
import { useMessages, useMarkAsRead, useSendMessage } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface GiftMessageThreadProps {
  open: boolean;
  onClose: () => void;
  otherUserId: string;
  otherUserName: string;
}

export function GiftMessageThread({ open, onClose, otherUserId, otherUserName }: GiftMessageThreadProps) {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(open ? otherUserId : undefined);
  const markAsRead = useMarkAsRead();
  const sendMessage = useSendMessage(open ? otherUserId : undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(m => m.content.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    if (!messages || !user) return;
    const unread = messages
      .filter(m => m.receiver_id === user.id && !m.read)
      .map(m => m.id);
    if (unread.length > 0) {
      markAsRead.mutate(unread);
    }
  }, [messages, user]);

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-treasury-gold" />
            Tin nhắn với {otherUserName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-3" ref={scrollRef}>
          {/* Search bar */}
          {messages && messages.length > 3 && (
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tin nhắn..."
                className="pl-8 h-8 text-xs"
              />
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-3/4" style={{ marginLeft: i % 2 ? 'auto' : 0 }} />
              ))}
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {searchQuery ? 'Không tìm thấy tin nhắn phù hợp' : 'Chưa có tin nhắn nào'}
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {filteredMessages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                const hasGift = !!msg.gift_id;

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        isMe
                          ? 'bg-gradient-to-r from-treasury-gold/20 to-treasury-gold/10 border border-treasury-gold/30'
                          : 'bg-secondary border border-border/50'
                      }`}
                    >
                      {hasGift && (
                        <div className="flex items-center gap-1 mb-1">
                          <Gift className="w-3 h-3 text-treasury-gold" />
                          <span className="text-xs font-semibold gold-text">Tặng thưởng</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString('vi-VN', {
                            hour: '2-digit', minute: '2-digit',
                            day: '2-digit', month: '2-digit',
                          })}
                        </span>
                        {isMe && (
                          msg.read
                            ? <CheckCheck className="w-3 h-3 text-primary" />
                            : <Check className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Reply input */}
        <form
          className="flex items-center gap-2 pt-2 border-t border-border/50"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newMessage.trim()) return;
            sendMessage.mutate(newMessage.trim(), {
              onSuccess: () => setNewMessage(''),
            });
          }}
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1"
            disabled={sendMessage.isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sendMessage.isPending}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
