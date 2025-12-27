import { Header } from '@/components/layout/Header';
import { WalletCard } from '@/components/dashboard/WalletCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { TransactionChart } from '@/components/dashboard/TransactionChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { mockWallets, mockTransactions, calculateStats, formatCurrency } from '@/lib/mockData';
import { Wallet, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [dateRange, setDateRange] = useState<7 | 30>(30);
  const stats = calculateStats(mockTransactions, dateRange);
  const totalBalance = mockWallets.reduce((sum, w) => sum + w.balance, 0);

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
            <div className="flex items-center bg-secondary rounded-lg p-1">
              <button
                onClick={() => setDateRange(7)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  dateRange === 7
                    ? 'bg-treasury-gold text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDateRange(30)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  dateRange === 30
                    ? 'bg-treasury-gold text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                30 Days
              </button>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
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
            value={stats.inflow}
            type="inflow"
            subtitle={`${dateRange}D`}
            index={1}
          />
          <StatsCard
            title="Total Outflow"
            value={stats.outflow}
            type="outflow"
            subtitle={`${dateRange}D`}
            index={2}
          />
          <StatsCard
            title="Net Flow"
            value={stats.netflow}
            type="netflow"
            subtitle={`${dateRange}D`}
            index={3}
          />
        </div>

        {/* Wallet Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Treasury Wallets</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockWallets.map((wallet, index) => (
              <WalletCard key={wallet.id} wallet={wallet} index={index} />
            ))}
          </div>
        </div>

        {/* Charts and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TransactionChart />
          <RecentTransactions />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 mt-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 FUN Treasury. Built with love by Angel Lovable.
          </p>
          <p className="text-xs text-muted-foreground">
            Last synced: {new Date().toLocaleString()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
