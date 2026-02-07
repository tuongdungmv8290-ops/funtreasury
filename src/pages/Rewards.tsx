import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Clock, ExternalLink, FileSpreadsheet, MessageCircle, BarChart3 } from 'lucide-react';
import { GiftDialog } from '@/components/gifts/GiftDialog';
import { Leaderboard } from '@/components/gifts/Leaderboard';
import { LightScoreBadge } from '@/components/gifts/LightScoreBadge';
import { GiftReceiptButton } from '@/components/gifts/GiftReceiptButton';
import { GiftMessageThread } from '@/components/gifts/GiftMessageThread';
import { GiftAnalyticsCharts } from '@/components/gifts/GiftAnalyticsCharts';
import { AchievementBadges } from '@/components/gifts/AchievementBadges';
import { CreatePost } from '@/components/posts/CreatePost';
import { PostFeed } from '@/components/posts/PostFeed';
import { useGiftHistory, useLightScore } from '@/hooks/useGifts';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/formatUtils';
import { exportGiftsXLSX } from '@/lib/giftExcelExport';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const Rewards = () => {
  const { user } = useAuth();
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [giftPostId, setGiftPostId] = useState<string | undefined>();
  const [giftReceiverId, setGiftReceiverId] = useState<string | undefined>();
  const { data: gifts, isLoading: giftsLoading } = useGiftHistory();
  const { data: myScore } = useLightScore(user?.id);
  const [messageThread, setMessageThread] = useState<{ userId: string; name: string } | null>(null);

  const handlePostGift = (postId: string, authorId: string) => {
    setGiftPostId(postId);
    setGiftReceiverId(authorId);
    setShowGiftDialog(true);
  };

  const handleOpenGiftDialog = (open: boolean) => {
    setShowGiftDialog(open);
    if (!open) { setGiftPostId(undefined); setGiftReceiverId(undefined); }
  };

  const handleExportExcel = async () => {
    if (!gifts || gifts.length === 0) { toast.error('Không có dữ liệu để xuất'); return; }
    try {
      await exportGiftsXLSX(gifts);
      toast.success(`Đã xuất ${gifts.length} giao dịch ra Excel!`);
    } catch { toast.error('Lỗi xuất Excel'); }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-1 tracking-wide">
              FUN <span className="gold-shimmer text-4xl md:text-5xl">Tặng Thưởng</span>
            </h1>
            <p className="font-body text-sm md:text-base text-muted-foreground">
              Tặng thưởng token cho bạn bè • Bảng xếp hạng • Light Score
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user?.id && <AchievementBadges userId={user.id} />}
            {myScore && <LightScoreBadge score={myScore.light_score} size="lg" />}
            <Button
              onClick={() => setShowGiftDialog(true)}
              className="gap-2 bg-gradient-to-r from-treasury-gold to-treasury-gold-dark text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-amber-400/40 transition-all px-6 border-2 border-amber-400"
            >
              <Gift className="w-4 h-4" />
              Tặng Thưởng
            </Button>
          </div>
        </div>

        {/* Post Section */}
        <div className="space-y-4">
          <CreatePost />
          <PostFeed onGift={handlePostGift} />
        </div>

        {/* Tabs: History + Analytics */}
        <Tabs defaultValue="history" className="space-y-4">
          <TabsList>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="w-4 h-4" /> Lịch sử
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <GiftHistorySection
              gifts={gifts}
              giftsLoading={giftsLoading}
              userId={user?.id}
              onExport={handleExportExcel}
              onShowGiftDialog={() => setShowGiftDialog(true)}
              onMessage={(userId, name) => setMessageThread({ userId, name })}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <GiftAnalyticsCharts />
          </TabsContent>
        </Tabs>
      </main>

      <GiftDialog open={showGiftDialog} onOpenChange={handleOpenGiftDialog} defaultReceiverId={giftReceiverId} postId={giftPostId} />
      {messageThread && (
        <GiftMessageThread open={!!messageThread} onClose={() => setMessageThread(null)} otherUserId={messageThread.userId} otherUserName={messageThread.name} />
      )}
    </div>
  );
};

// Extracted component for gift history + leaderboard
function GiftHistorySection({ gifts, giftsLoading, userId, onExport, onShowGiftDialog, onMessage }: {
  gifts: any[] | undefined;
  giftsLoading: boolean;
  userId?: string;
  onExport: () => void;
  onShowGiftDialog: () => void;
  onMessage: (userId: string, name: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Lịch sử Tặng Thưởng
            </CardTitle>
            {gifts && gifts.length > 0 && (
              <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {giftsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : !gifts || gifts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Chưa có giao dịch tặng thưởng nào</p>
                <Button variant="outline" className="mt-4 gap-2" onClick={onShowGiftDialog}>
                  <Gift className="w-4 h-4" /> Tặng thưởng đầu tiên
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {gifts.map((gift) => {
                  const isSender = gift.sender_id === userId;
                  const otherUserId = isSender ? gift.receiver_id : gift.sender_id;
                  const otherUserName = isSender ? (gift.receiver_name || 'Unknown') : (gift.sender_name || 'Unknown');

                  return (
                    <div key={gift.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSender ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                        <Gift className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {isSender ? <>Bạn tặng <span className="font-bold">{gift.receiver_name}</span></> : <><span className="font-bold">{gift.sender_name}</span> tặng bạn</>}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {gift.message || new Date(gift.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-sm gold-text">
                          {isSender ? '-' : '+'}{gift.amount} {gift.token_symbol}
                        </p>
                        <p className="text-xs text-muted-foreground">~{formatCurrency(gift.usd_value)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <GiftReceiptButton gift={gift} />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMessage(otherUserId, otherUserName)} title="Tin nhắn">
                          <MessageCircle className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </Button>
                        {gift.tx_hash && (
                          <a href={`https://bscscan.com/tx/${gift.tx_hash}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div>
        <Leaderboard />
      </div>
    </div>
  );
}

export default Rewards;
