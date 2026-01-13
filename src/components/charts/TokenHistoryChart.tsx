import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ChartExportMenu } from './ChartExportMenu';

type TimeRange = 7 | 30;

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: 7, label: '7D' },
  { value: 30, label: '30D' },
];

// Token colors matching TokenAllocationChart
const TOKEN_COLORS: Record<string, string> = {
  'CAMLY': '#C9A227',
  'BNB': '#F3BA2F',
  'USDT': '#26A17B',
  'BTC': '#F7931A',
  'BTCB': '#E67A10',
  'USDC': '#2775CA',
};

interface TokenBreakdown {
  [symbol: string]: {
    balance: number;
    usdValue: number;
  };
}

interface PortfolioSnapshot {
  id: string;
  created_at: string;
  token_breakdown: TokenBreakdown | null;
}

export function TokenHistoryChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>(7);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set(['BTC', 'CAMLY']));

  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['token-history', timeRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      const { data, error } = await supabase
        .from('portfolio_snapshots')
        .select('id, created_at, token_breakdown')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as PortfolioSnapshot[];
    },
    refetchInterval: 300000,
  });

  // Extract all available tokens from snapshots
  const availableTokens = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];
    
    const tokenSet = new Set<string>();
    snapshots.forEach(s => {
      if (s.token_breakdown) {
        Object.keys(s.token_breakdown).forEach(symbol => tokenSet.add(symbol));
      }
    });
    return Array.from(tokenSet).sort();
  }, [snapshots]);

  // Transform data for chart
  const chartData = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];

    // Group by day
    const dailyMap = new Map<string, Record<string, number>>();

    snapshots.forEach(snapshot => {
      const date = new Date(snapshot.created_at);
      const dayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, { date: dayKey } as any);
      }

      const entry = dailyMap.get(dayKey)!;
      
      if (snapshot.token_breakdown) {
        Object.entries(snapshot.token_breakdown).forEach(([symbol, data]) => {
          // Keep the latest value for each day
          entry[symbol] = data.usdValue || 0;
        });
      }
    });

    return Array.from(dailyMap.values());
  }, [snapshots]);

  const toggleToken = (symbol: string) => {
    setSelectedTokens(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  };

  return (
    <div id="token-history-chart" className="treasury-card p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shadow-lg shadow-primary/20">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">Token Value History</h3>
            <p className="text-xs text-muted-foreground">Lịch sử giá trị từng token theo thời gian</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Buttons */}
          <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
            {timeRangeOptions.map(option => (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                onClick={() => setTimeRange(option.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-all",
                  timeRange === option.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <ChartExportMenu chartId="token-history-chart" filename="Token-History" />
        </div>
      </div>

      {/* Token Filter */}
      <div className="flex flex-wrap gap-3 mb-4 p-3 bg-secondary/30 rounded-lg">
        <span className="text-sm text-muted-foreground">Filter:</span>
        {availableTokens.map(symbol => (
          <label 
            key={symbol} 
            className="flex items-center gap-2 cursor-pointer"
          >
            <Checkbox
              checked={selectedTokens.has(symbol)}
              onCheckedChange={() => toggleToken(symbol)}
            />
            <span 
              className="text-sm font-medium"
              style={{ color: TOKEN_COLORS[symbol] || 'hsl(var(--foreground))' }}
            >
              {symbol}
            </span>
          </label>
        ))}
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No historical data available
        </div>
      ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                dy={10}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                  return `$${value}`;
                }}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                  name
                ]}
              />
              <Legend />
              {Array.from(selectedTokens).map(symbol => (
                <Line
                  key={symbol}
                  type="monotone"
                  dataKey={symbol}
                  stroke={TOKEN_COLORS[symbol] || '#888888'}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/50">
        {Array.from(selectedTokens).map(symbol => (
          <div key={symbol} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: TOKEN_COLORS[symbol] || '#888888' }}
            />
            <span className={cn(
              "text-sm font-medium",
              symbol === 'CAMLY' && "gold-text"
            )}>
              {symbol}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
