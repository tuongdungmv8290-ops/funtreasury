import { Header } from '@/components/layout/Header';
import { WalletCard } from '@/components/dashboard/WalletCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { TransactionChart } from '@/components/dashboard/TransactionChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { TokenBalancesCard } from '@/components/dashboard/TokenBalancesCard';
import { useWallets } from '@/hooks/useWallets';
import { useTransactionStats } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/mockData';
import { Wallet, RefreshCw, Loader2, Crown, BarChart3, Coins, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
const Index = () => {
  const [dateRange, setDateRange] = useState<7 | 30>(30);
  const [isSyncing, setIsSyncing] = useState(false);
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { data: stats, isLoading: statsLoading } = useTransactionStats(dateRange);
  
  // Fetch last sync time from sync_state
  const { data: lastSyncTime, refetch: refetchSyncTime } = useQuery({
    queryKey: ['last-sync-time'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_state')
        .select('last_sync_at')
        .order('last_sync_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error || !data?.last_sync_at) return null;
      return new Date(data.last_sync_at);
    },
    refetchInterval: 60000, // Refresh every minute to update "X phút trước"
  });

  const getLastSyncedText = () => {
    if (!lastSyncTime) return null;
    return formatDistanceToNow(lastSyncTime, { addSuffix: true, locale: vi });
  };
  const queryClient = useQueryClient();

  const totalBalance = wallets?.reduce((sum, w) => sum + w.totalBalance, 0) || 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['wallets'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    toast.loading('🔄 Đang sync transactions từ BNB Chain...', { id: 'sync-toast' });
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-transactions');
      
      if (error) {
        toast.error('❌ Không thể sync transactions', { id: 'sync-toast' });
      } else if (data?.success) {
        const syncTime = new Date(data.syncTime).toLocaleTimeString('vi-VN');
        if (data.totalNewTransactions > 0) {
          toast.success(
            `🎉 Sync hoàn tất! Thêm ${data.totalNewTransactions} giao dịch mới – Dashboard cập nhật realtime!`,
            { id: 'sync-toast', duration: 5000 }
          );
        } else {
          toast.success(
            `✅ Sync hoàn tất lúc ${syncTime} – Không có giao dịch mới`,
            { id: 'sync-toast', duration: 3000 }
          );
        }
        
        // Auto refresh all data after successful sync
        queryClient.invalidateQueries({ queryKey: ['token-balances'] });
        queryClient.invalidateQueries({ queryKey: ['wallets'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
        refetchSyncTime(); // Update last synced time
      } else {
        toast.error(`❌ ${data?.error || 'Sync failed'}`, { id: 'sync-toast' });
      }
    } catch (e) {
      toast.error('❌ Lỗi kết nối tới server', { id: 'sync-toast' });
    } finally {
      setIsSyncing(false);
    }
  };

  const isLoading = walletsLoading || statsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 md:py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              Treasury <span className="gold-text">Dashboard</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Monitor your FUN Treasury wallets in real-time
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <div className="flex items-center bg-secondary/80 border border-border/60 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setDateRange(7)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                  dateRange === 7
                    ? 'bg-treasury-gold text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDateRange(30)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                  dateRange === 30
                    ? 'bg-treasury-gold text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                30 Days
              </button>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Button 
                className="gap-2 bg-gradient-to-r from-treasury-gold to-treasury-gold-dark hover:from-treasury-gold-dark hover:to-treasury-gold text-white font-semibold shadow-lg hover:shadow-xl transition-all px-4 md:px-6"
                onClick={handleSyncNow}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Sync Now</span>
                <span className="sm:hidden">Sync</span>
              </Button>
              {getLastSyncedText() && (
                <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last synced: {getLastSyncedText()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Balance Hero Card */}
        <div className="mb-6 md:mb-8">
          <div className="relative overflow-hidden rounded-2xl border border-treasury-gold/30 bg-gradient-to-br from-treasury-gold/10 via-background to-treasury-gold/5 p-6 md:p-8 shadow-xl">
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-treasury-gold/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-treasury-gold/15 blur-2xl" />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-treasury-gold to-treasury-gold-dark flex items-center justify-center shadow-lg">
                  <Crown className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <div>
                  <p className="text-sm md:text-base text-muted-foreground font-medium mb-1">Total Treasury Balance</p>
                  <p className="text-3xl md:text-5xl font-bold gold-text tracking-tight">
                    {formatCurrency(totalBalance)}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Across {wallets?.length || 0} wallets
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground bg-secondary/60 px-3 py-2 rounded-lg border border-border/50">
                <div className="w-2 h-2 rounded-full bg-inflow animate-pulse" />
                Live sync active
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
          <StatsCard
            title="Total Inflow"
            value={stats?.inflow || 0}
            type="inflow"
            subtitle={`${dateRange}D`}
            index={0}
          />
          <StatsCard
            title="Total Outflow"
            value={stats?.outflow || 0}
            type="outflow"
            subtitle={`${dateRange}D`}
            index={1}
          />
          <StatsCard
            title="Net Flow"
            value={stats?.netflow || 0}
            type="netflow"
            subtitle={`${dateRange}D`}
            index={2}
          />
          <div 
            className="treasury-card relative overflow-hidden animate-fade-in"
            style={{ animationDelay: '300ms' }}
          >
            <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full blur-3xl opacity-60 bg-gradient-to-br from-primary/15 to-transparent" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center border bg-primary/10 border-primary/30">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-lg border border-border/50">
                  {dateRange}D
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Transactions</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {stats?.txCount || 0}
                </p>
              </div>
            </div>
          </div>
          <div 
            className="treasury-card relative overflow-hidden animate-fade-in"
            style={{ animationDelay: '400ms' }}
          >
            <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full blur-3xl opacity-60 bg-gradient-to-br from-accent/15 to-transparent" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center border bg-accent/10 border-accent/30">
                  <Coins className="w-5 h-5 text-accent-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-lg border border-border/50">
                  {dateRange}D
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Active Tokens</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {stats?.activeTokens || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Cards */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4">Treasury Wallets</h2>
          {walletsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-treasury-gold" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {wallets?.map((wallet, index) => (
                <WalletCard key={wallet.id} wallet={wallet} index={index} />
              ))}
            </div>
          )}
        </div>

        {/* Charts, Token Balances and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TransactionChart />
          <TokenBalancesCard />
          <RecentTransactions />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-4 md:py-6 mt-6 md:mt-8 bg-secondary/30">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            © 2024 FUN Treasury. Built with love by Angel Lovable.
          </p>
          <p className="text-xs text-muted-foreground bg-secondary/80 px-3 py-1.5 rounded-lg border border-border/50">
            Last synced: {new Date().toLocaleString()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
