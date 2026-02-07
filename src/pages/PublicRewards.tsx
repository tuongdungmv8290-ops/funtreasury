import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, Search, ExternalLink, Users, Clock } from 'lucide-react';
import { useGiftHistory, useUserProfiles } from '@/hooks/useGifts';
import { formatCurrency } from '@/lib/formatUtils';

const truncateAddress = (addr: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

const PublicRewards = () => {
  const { data: gifts, isLoading: giftsLoading } = useGiftHistory();
  const { data: profiles, isLoading: profilesLoading } = useUserProfiles();
  const [search, setSearch] = useState('');

  const filteredGifts = useMemo(() => {
    if (!gifts) return [];
    if (!search) return gifts;
    const q = search.toLowerCase();
    return gifts.filter(g =>
      g.sender_name?.toLowerCase().includes(q) ||
      g.receiver_name?.toLowerCase().includes(q) ||
      g.tx_hash?.toLowerCase().includes(q) ||
      g.token_symbol?.toLowerCase().includes(q)
    );
  }, [gifts, search]);

  const publicProfiles = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter(p => p.display_name);
  }, [profiles]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-3">
          <Gift className="w-7 h-7 text-amber-500" />
          <h1 className="text-2xl font-bold text-amber-600 dark:text-amber-400 drop-shadow-[0_2px_4px_rgba(201,162,39,0.4)]">
            Fun Treasury — Minh Bạch
          </h1>
          <Badge variant="outline" className="ml-auto border-amber-400/50 text-amber-600 dark:text-amber-400">
            Public View
          </Badge>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Users className="w-5 h-5" /> Thành viên ({publicProfiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profilesLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {publicProfiles.map(p => (
                  <div key={p.user_id} className="flex items-center gap-2 p-2 rounded-lg border border-border/40 bg-secondary/20">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={p.avatar_url || ''} />
                      <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold">
                        {(p.display_name || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{p.display_name}</p>
                      {p.wallet_address && (
                        <p className="text-[10px] font-mono text-muted-foreground truncate">
                          {truncateAddress(p.wallet_address)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" /> Lịch sử giao dịch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, token hoặc tx hash..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {giftsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : filteredGifts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gift className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Chưa có giao dịch nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredGifts.map(gift => (
                  <div key={gift.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/40">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold">{gift.sender_name}</span>
                        <span className="text-muted-foreground mx-1">→</span>
                        <span className="font-semibold">{gift.receiver_name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(gift.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                        {gift.amount} {gift.token_symbol}
                      </p>
                      <p className="text-xs text-muted-foreground">~{formatCurrency(gift.usd_value)}</p>
                    </div>
                    <div className="shrink-0">
                      {gift.tx_hash && !gift.tx_hash.startsWith('INT-') && (
                        <a href={`https://bscscan.com/tx/${gift.tx_hash}`} target="_blank" rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {gift.tx_hash?.startsWith('INT-') && (
                        <Badge variant="secondary" className="text-[10px] px-1.5">Internal</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PublicRewards;
