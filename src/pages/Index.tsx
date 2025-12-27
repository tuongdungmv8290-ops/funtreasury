import { Header } from '@/components/layout/Header';
import { WalletCard } from '@/components/dashboard/WalletCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { TransactionChart } from '@/components/dashboard/TransactionChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { useWallets } from '@/hooks/useWallets';
import { useTransactionStats } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/mockData';
import { Wallet, RefreshCw, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

const Index = () => {
  const [dateRange, setDateRange] = useState<7 | 30>(30);
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { data: stats, isLoading: statsLoading } = useTransactionStats(dateRange);
  const queryClient = useQueryClient();

  const totalBalance = wallets?.reduce((sum, w) => sum + w.totalBalance, 0) || 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['wallets'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
  };

  const isLoading = walletsLoading || statsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Treasury <span className="gold-text">Dashboard</span>
            </h1>
            <p className="text-muted-foreground">
              Monitor your FUN Treasury wallets in real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-secondary/80 border border-border/60 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setDateRange(7)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  dateRange === 7
                    ? 'bg-treasury-gold text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDateRange(30)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  dateRange === 30
                    ? 'bg-treasury-gold text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                30 Days
              </button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-border/60 hover:border-treasury-gold/50 hover:bg-treasury-gold/5"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Sync
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Balance"
            value={totalBalance}
            type="balance"
            icon={Wallet}
            subtitle="All Wallets"
            index={0}
          />
          <StatsCard
            title="Total Inflow"
            value={stats?.inflow || 0}
            type="inflow"
            subtitle={`${dateRange}D`}
            index={1}
          />
          <StatsCard
            title="Total Outflow"
            value={stats?.outflow || 0}
            type="outflow"
            subtitle={`${dateRange}D`}
            index={2}
          />
          <StatsCard
            title="Net Flow"
            value={stats?.netflow || 0}
            type="netflow"
            subtitle={`${dateRange}D`}
            index={3}
          />
        </div>

        {/* Wallet Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Treasury Wallets</h2>
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

        {/* Charts and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TransactionChart />
          <RecentTransactions />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 mt-8 bg-secondary/30">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground font-medium">
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
