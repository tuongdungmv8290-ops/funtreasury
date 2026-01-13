import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Loader2, Wallet } from 'lucide-react';
import { useWallets } from '@/hooks/useWallets';
import { formatUSD } from '@/lib/formatNumber';
import { ChartExportMenu } from './ChartExportMenu';

// Token colors for stacked bars
const TOKEN_COLORS: Record<string, string> = {
  'CAMLY': '#C9A227',
  'BNB': '#F3BA2F',
  'USDT': '#26A17B',
  'BTC': '#F7931A',
  'BTCB': '#E67A10',
  'USDC': '#2775CA',
};

const DEFAULT_COLOR = '#888888';

interface ChartDataItem {
  name: string;
  total: number;
  [key: string]: string | number;
}

export function WalletComparisonChart() {
  const { data: wallets, isLoading } = useWallets();

  // Process data for chart
  const { chartData, allTokens, totalValue } = useMemo(() => {
    if (!wallets || wallets.length === 0) {
      return { chartData: [], allTokens: [], totalValue: 0 };
    }

    // Get all unique tokens across wallets
    const tokenSet = new Set<string>();
    wallets.forEach(w => {
      w.tokens.forEach(t => tokenSet.add(t.symbol));
    });
    const allTokens = Array.from(tokenSet).sort();

    // Build chart data
    const chartData: ChartDataItem[] = wallets
      .map(wallet => {
        const entry: ChartDataItem = {
          name: wallet.name,
          total: wallet.totalBalance,
        };

        // Add each token's value
        wallet.tokens.forEach(token => {
          entry[token.symbol] = token.usd_value;
        });

        return entry;
      })
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);

    const totalValue = chartData.reduce((sum, item) => sum + item.total, 0);

    return { chartData, allTokens, totalValue };
  }, [wallets]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);

    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any) => (
          entry.value > 0 && (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.dataKey}</span>
              </div>
              <span className="font-mono font-medium">
                {formatUSD(entry.value)}
              </span>
            </div>
          )
        ))}
        <div className="mt-2 pt-2 border-t border-border flex justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-mono font-bold gold-text">{formatUSD(total)}</span>
        </div>
      </div>
    );
  };

  return (
    <div id="wallet-comparison-chart" className="treasury-card p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shadow-lg shadow-primary/20">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">Wallet Comparison</h3>
            <p className="text-xs text-muted-foreground">So sánh giá trị giữa các ví treasury</p>
          </div>
        </div>

        <ChartExportMenu chartId="wallet-comparison-chart" filename="Wallet-Comparison" />
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No wallet data available
        </div>
      ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                  return `$${value}`;
                }}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingTop: 10 }}
              />
              {allTokens.map((symbol) => (
                <Bar
                  key={symbol}
                  dataKey={symbol}
                  stackId="stack"
                  fill={TOKEN_COLORS[symbol] || DEFAULT_COLOR}
                  radius={[0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer: Total Value */}
      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Total across {chartData.length} wallet{chartData.length !== 1 ? 's' : ''}
        </span>
        <span className="font-mono font-bold text-lg gold-text">
          {formatUSD(totalValue)}
        </span>
      </div>
    </div>
  );
}
