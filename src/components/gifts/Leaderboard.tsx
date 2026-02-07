import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useGifts';
import { LightScoreBadge } from './LightScoreBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatUtils';

const RANK_STYLES = [
  { bg: 'bg-yellow-500/10 border-yellow-500/30', icon: Crown, color: 'text-yellow-500' },
  { bg: 'bg-gray-400/10 border-gray-400/30', icon: Medal, color: 'text-gray-400' },
  { bg: 'bg-amber-700/10 border-amber-700/30', icon: Award, color: 'text-amber-700' },
];

function LeaderboardList({ type }: { type: 'givers' | 'receivers' | 'sponsors' }) {
  const { data, isLoading } = useLeaderboard(type);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>Chưa có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((entry, index) => {
        const rankStyle = index < 3 ? RANK_STYLES[index] : null;
        const RankIcon = rankStyle?.icon;
        const value = type === 'receivers' ? entry.total_received_usd : entry.total_given_usd;
        const count = type === 'receivers' ? entry.gift_count_received : entry.gift_count_sent;

        return (
          <div
            key={entry.user_id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
              rankStyle
                ? `${rankStyle.bg}`
                : 'bg-secondary/30 border-border/40 hover:bg-secondary/50'
            }`}
          >
            {/* Rank */}
            <div className="w-8 text-center shrink-0">
              {RankIcon ? (
                <RankIcon className={`w-6 h-6 mx-auto ${rankStyle!.color}`} />
              ) : (
                <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
              )}
            </div>

            {/* Avatar */}
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {(entry.display_name || '?')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{entry.display_name}</p>
              <p className="text-xs text-muted-foreground">{count} giao dịch</p>
            </div>

            {/* Value */}
            <div className="text-right shrink-0">
              <p className="font-mono font-bold gold-text text-sm">{formatCurrency(value)}</p>
              <LightScoreBadge score={entry.light_score} size="sm" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Leaderboard() {
  return (
    <Card className="border-treasury-gold/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-treasury-gold" />
          Bảng Xếp Hạng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="givers">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="givers">Top Tặng</TabsTrigger>
            <TabsTrigger value="receivers">Top Nhận</TabsTrigger>
            <TabsTrigger value="sponsors">Mạnh Thường Quân</TabsTrigger>
          </TabsList>
          <TabsContent value="givers">
            <LeaderboardList type="givers" />
          </TabsContent>
          <TabsContent value="receivers">
            <LeaderboardList type="receivers" />
          </TabsContent>
          <TabsContent value="sponsors">
            <LeaderboardList type="sponsors" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
