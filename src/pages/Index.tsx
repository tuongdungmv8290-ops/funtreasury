import { Header } from '@/components/layout/Header';
import { WalletCard } from '@/components/dashboard/WalletCard';
import { TransactionChart } from '@/components/dashboard/TransactionChart';

import { TokenBalancesCard } from '@/components/dashboard/TokenBalancesCard';
import { PortfolioHistoryChart } from '@/components/dashboard/PortfolioHistoryChart';
import { BulkTransferSection } from '@/components/dashboard/BulkTransferSection';
import { CamlyMarketPrice } from '@/components/dashboard/CamlyMarketPrice';
import { CamlyTradesCard } from '@/components/dashboard/CamlyTradesCard';
import { useWallets } from '@/hooks/useWallets';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/formatUtils';
import { RefreshCw, Loader2, Crown, Clock, FileDown, Eye } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useTransactionNotifications } from '@/hooks/useTransactionNotifications';
import { useTreasuryReport, ReportFilters } from '@/hooks/useTreasuryReport';
import { ReportFilterDialog } from '@/components/reports/ReportFilterDialog';
import { useViewMode } from '@/contexts/ViewModeContext';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const { isViewOnly } = useViewMode();
  const [dateRange, setDateRange] = useState<7 | 30>(30);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { data: transactions } = useTransactions();
  
  // Realtime notifications
  useTransactionNotifications();
  
  // PDF Report
  const { generateReport, isGenerating } = useTreasuryReport();
  const pieChartRef = useRef<HTMLDivElement>(null);
  const flowChartRef = useRef<HTMLDivElement>(null);

  // Get unique tokens from transactions
  const availableTokens = [...new Set(transactions?.map(tx => tx.token_symbol) || [])];

  const handleExportPDF = async (filters: ReportFilters) => {
    setShowReportDialog(false);
    toast.loading('📄 Đang tạo báo cáo PDF...', { id: 'pdf-toast' });
    try {
      const result = await generateReport(pieChartRef, flowChartRef, filters);
      toast.success(`✅ Đã xuất ${result.fileName}`, { id: 'pdf-toast', duration: 5000 });
    } catch (error) {
      toast.error('❌ Lỗi tạo báo cáo PDF', { id: 'pdf-toast' });
    }
  };
  
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
      // Refresh session to ensure valid token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error('❌ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', { id: 'sync-toast' });
        setIsSyncing(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('sync-transactions');
      
      if (error) {
        toast.error('❌ Không thể sync transactions', { id: 'sync-toast' });
      } else if (data?.success) {
        const syncTime = new Date(data.syncTime).toLocaleTimeString('vi-VN');
        const newTx = data.totalNewTransactions || 0;
        const dupRemoved = data.totalDuplicatesRemoved || 0;
        
        if (newTx > 0 || dupRemoved > 0) {
          toast.success(
            `🎉 Kiểm tra hoàn tất – Đã thêm ${newTx} tx mới, xóa ${dupRemoved} tx dư`,
            { id: 'sync-toast', duration: 5000 }
          );
        } else {
          toast.success(
            `✅ Kiểm tra hoàn tất lúc ${syncTime} – Không có tx mới hoặc dư`,
            { id: 'sync-toast', duration: 3000 }
          );
        }
        
        // Auto refresh all data after successful sync
        queryClient.invalidateQueries({ queryKey: ['token-balances-db'] });
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

  const isLoading = walletsLoading;

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
            {/* Admin actions - hidden in View Only mode */}
            {!isViewOnly && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  className="gap-2 border-treasury-gold/50 text-treasury-gold hover:bg-treasury-gold/10"
                  onClick={() => setShowReportDialog(true)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Export PDF</span>
                </Button>
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
            )}
            
            {/* View Only indicator */}
            {isViewOnly && (
              <Badge variant="outline" className="flex items-center gap-1 border-primary/50 bg-primary/10 text-primary px-3 py-1.5">
                <Eye className="w-3.5 h-3.5" />
                Chế độ Chỉ Xem
              </Badge>
            )}
          </div>
        </div>

        {/* CAMLY Market Price + Trades Section - TOP */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 md:mb-8">
          <CamlyMarketPrice />
          <CamlyTradesCard />
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

        {/* Portfolio History Chart */}
        <div className="mb-6 md:mb-8">
          <PortfolioHistoryChart />
        </div>

        {/* Bulk Transfer Section - Visible to all, editable by admin only */}
        <div className="mb-6 md:mb-8">
          <BulkTransferSection viewOnly={isViewOnly} />
        </div>

        {/* Charts and Token Balances */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div ref={flowChartRef}>
            <TransactionChart />
          </div>
          <div ref={pieChartRef}>
            <TokenBalancesCard />
          </div>
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

      {/* Report Filter Dialog */}
      <ReportFilterDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        onGenerate={handleExportPDF}
        isGenerating={isGenerating}
        availableTokens={availableTokens}
      />
    </div>
  );
};

export default Index;
