import { CamlyMarketPrice } from '@/components/dashboard/CamlyMarketPrice';
import { Coins } from 'lucide-react';
import { ChartExportMenu } from './ChartExportMenu';

export function CamlyPriceChartSection() {
  return (
    <div id="camly-price-chart" className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">CAMLY Price Analysis</h2>
            <p className="text-sm text-muted-foreground">Real-time market data with technical indicators</p>
          </div>
        </div>
        <ChartExportMenu chartId="camly-price-chart" filename="CAMLY-Price" />
      </div>

      {/* CAMLY Market Price Component */}
      <CamlyMarketPrice />
    </div>
  );
}
