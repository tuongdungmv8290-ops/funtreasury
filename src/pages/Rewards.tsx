import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Sparkles, ExternalLink, Clock } from 'lucide-react';
import { GiftDialog } from '@/components/gifts/GiftDialog';
import { Leaderboard } from '@/components/gifts/Leaderboard';
import { LightScoreBadge } from '@/components/gifts/LightScoreBadge';
import { useGiftHistory, useLightScore } from '@/hooks/useGifts';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/formatUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

const Rewards = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const { data: gifts, isLoading: giftsLoading } = useGiftHistory();
  const { data: myScore } = useLightScore(user?.id);

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-1 tracking-wide">
              FUN <span className="gold-text">Rewards</span>
            </h1>
            <p className="font-body text-sm md:text-base text-muted-foreground">
              Tặng thưởng token cho bạn bè • Bảng xếp hạng • Light Score
            </p>
          </div>
          <div className="flex items-center gap-3">
            {myScore && <LightScoreBadge score={myScore.light_score} size="lg" />}
            <Button
              onClick={() => setShowGiftDialog(true)}
              className="gap-2 bg-gradient-to-r from-treasury-gold to-treasury-gold-dark text-white font-semibold shadow-lg hover:shadow-xl transition-all px-6"
            >
              <Gift className="w-4 h-4" />
              Tặng Thưởng
            </Button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Gift History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  Lịch sử Tặng Thưởng
                </CardTitle>
              </CardHeader>
              <CardContent>
                {giftsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : !gifts || gifts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Chưa có giao dịch tặng thưởng nào</p>
                    <Button
                      variant="outline"
                      className="mt-4 gap-2"
                      onClick={() => setShowGiftDialog(true)}
                    >
                      <Gift className="w-4 h-4" /> Tặng thưởng đầu tiên
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gifts.map((gift) => {
                      const isSender = gift.sender_id === user?.id;
                      return (
                        <div
                          key={gift.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            isSender ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                          }`}>
                            <Gift className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {isSender ? (
                                <>Bạn tặng <span className="font-bold">{gift.receiver_name}</span></>
                              ) : (
                                <><span className="font-bold">{gift.sender_name}</span> tặng bạn</>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {gift.message || new Date(gift.created_at).toLocaleString('vi-VN')}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-mono font-bold text-sm gold-text">
                              {isSender ? '-' : '+'}{gift.amount} {gift.token_symbol}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ~{formatCurrency(gift.usd_value)}
                            </p>
                          </div>
                          {gift.tx_hash && (
                            <a
                              href={`https://bscscan.com/tx/${gift.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0"
                            >
                              <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Leaderboard */}
          <div>
            <Leaderboard />
          </div>
        </div>
      </main>

      <GiftDialog open={showGiftDialog} onOpenChange={setShowGiftDialog} />
    </div>
  );
};

export default Rewards;
