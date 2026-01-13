import { Wallet, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useWalletSummary } from '@/hooks/useWalletSummary';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  isLoading?: boolean;
}

function StatCard({ title, value, icon, trend, subtitle, isLoading }: StatCardProps) {
  return (
    <div className="treasury-card p-4 lg:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-1">{title}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className={cn(
              "text-xl lg:text-2xl font-bold font-mono tracking-tight",
              trend === 'up' && "text-green-500",
              trend === 'down' && "text-red-500",
              !trend && "text-foreground"
            )}>
              {value}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "p-2 lg:p-3 rounded-xl",
          trend === 'up' && "bg-green-500/10",
          trend === 'down' && "bg-red-500/10",
          !trend && "bg-primary/10"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function TreasuryStatsOverview() {
  const { data: walletSummary, isLoading: summaryLoading } = useWalletSummary();

  // Get 24h change from portfolio snapshots
  const { data: changeData, isLoading: changeLoading } = useQuery({
    queryKey: ['portfolio-24h-change'],
    queryFn: async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const { data: snapshots } = await supabase
        .from('portfolio_snapshots')
        .select('total_usd_value, created_at')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: true })
        .limit(100);

      if (!snapshots || snapshots.length < 2) {
        return { change: 0, changePercent: 0 };
      }

      const firstValue = Number(snapshots[0].total_usd_value);
      const lastValue = Number(snapshots[snapshots.length - 1].total_usd_value);
      const change = lastValue - firstValue;
      const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0;

      return { change, changePercent };
    },
    refetchInterval: 60000,
  });

  // Calculate totals from wallet summary
  const totals = walletSummary?.reduce((acc, wallet) => {
    wallet.tokens.forEach(token => {
      acc.balance += token.current_balance_usd;
      acc.inflow += token.inflow_usd;
      acc.outflow += token.outflow_usd;
    });
    return acc;
  }, { balance: 0, inflow: 0, outflow: 0 }) ?? { balance: 0, inflow: 0, outflow: 0 };

  const isLoading = summaryLoading || changeLoading;
  const change24h = changeData?.changePercent ?? 0;
  const change24hTrend = change24h > 0 ? 'up' : change24h < 0 ? 'down' : 'neutral';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Balance"
        value={`$${totals.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={<Wallet className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />}
        isLoading={isLoading}
        subtitle="All wallets combined"
      />
      <StatCard
        title="24h Change"
        value={`${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`}
        icon={change24h >= 0 
          ? <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-500" />
          : <TrendingDown className="w-5 h-5 lg:w-6 lg:h-6 text-red-500" />
        }
        trend={change24hTrend}
        isLoading={isLoading}
        subtitle="Portfolio value change"
      />
      <StatCard
        title="Total Inflow"
        value={`$${totals.inflow.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        icon={<TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-500" />}
        trend="up"
        isLoading={isLoading}
        subtitle="All time"
      />
      <StatCard
        title="Total Outflow"
        value={`$${totals.outflow.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        icon={<TrendingDown className="w-5 h-5 lg:w-6 lg:h-6 text-red-500" />}
        trend="down"
        isLoading={isLoading}
        subtitle="All time"
      />
    </div>
  );
}
