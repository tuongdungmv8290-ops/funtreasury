import { BarChart3 } from 'lucide-react';
import { TreasuryStatsOverview } from '@/components/charts/TreasuryStatsOverview';
import { EnhancedPortfolioChart } from '@/components/charts/EnhancedPortfolioChart';
import { TransactionFlowChart } from '@/components/charts/TransactionFlowChart';
import { CamlyPriceChartSection } from '@/components/charts/CamlyPriceChartSection';

export default function Charts() {
  return (
    <div className="min-h-screen p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10 shadow-lg shadow-primary/20">
          <BarChart3 className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold gold-text">Treasury Analytics</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Biểu đồ phân tích chi tiết treasury performance
          </p>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <TreasuryStatsOverview />

      {/* Portfolio History Chart */}
      <EnhancedPortfolioChart />

      {/* Transaction Flow Chart */}
      <TransactionFlowChart />

      {/* CAMLY Price Chart Section */}
      <CamlyPriceChartSection />

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/50">
        <p>Data refreshes automatically every 5 minutes • Charts powered by Recharts</p>
      </div>
    </div>
  );
}
