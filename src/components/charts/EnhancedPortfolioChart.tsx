import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChartExportMenu } from './ChartExportMenu';

type TimeRange = 1 | 7 | 30 | 90;

interface PortfolioSnapshot {
  id: string;
  created_at: string;
  total_usd_value: number;
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: 1, label: '1D' },
  { value: 7, label: '7D' },
  { value: 30, label: '30D' },
  { value: 90, label: '90D' },
];

export function EnhancedPortfolioChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>(7);

  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['portfolio-history-enhanced', timeRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      const { data, error } = await supabase
        .from('portfolio_snapshots')
        .select('id, created_at, total_usd_value')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as PortfolioSnapshot[];
    },
    refetchInterval: 300000,
  });

  const chartData = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];

    if (timeRange === 1) {
      // Group by hour for 1D
      const hourlyMap = new Map<string, { sum: number; count: number }>();

      snapshots.forEach(snapshot => {
        const date = new Date(snapshot.created_at);
        const hourKey = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;

        if (!hourlyMap.has(hourKey)) {
          hourlyMap.set(hourKey, { sum: 0, count: 0 });
        }
        const entry = hourlyMap.get(hourKey)!;
        entry.sum += Number(snapshot.total_usd_value);
        entry.count += 1;
      });

      return Array.from(hourlyMap.entries()).map(([date, data]) => ({
        date,
        value: Math.round(data.sum / data.count),
      }));
    }

    // Group by day for 7D, 30D, 90D
    const dailyMap = new Map<string, { sum: number; count: number }>();

    snapshots.forEach(snapshot => {
      const date = new Date(snapshot.created_at);
      const dayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, { sum: 0, count: 0 });
      }
      const entry = dailyMap.get(dayKey)!;
      entry.sum += Number(snapshot.total_usd_value);
      entry.count += 1;
    });

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      value: Math.round(data.sum / data.count),
    }));
  }, [snapshots, timeRange]);

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return { high: 0, low: 0, avg: 0, current: 0, change: 0, changePercent: 0 };

    const values = chartData.map(d => d.value);
    const high = Math.max(...values);
    const low = Math.min(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const current = values[values.length - 1];
    const first = values[0];
    const change = current - first;
    const changePercent = first > 0 ? (change / first) * 100 : 0;

    return { high, low, avg, current, change, changePercent };
  }, [chartData]);

  const isPositive = stats.changePercent >= 0;

  return (
    <div id="portfolio-history-chart" className="treasury-card p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">Portfolio History</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold font-mono gold-text">
              ${stats.current.toLocaleString()}
            </span>
            <span className={cn(
              "flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full",
              isPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}{stats.changePercent.toFixed(2)}%
            </span>
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
          <ChartExportMenu chartId="portfolio-history-chart" filename="Portfolio-History" />
        </div>
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
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
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
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
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
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#portfolioGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer Stats */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-border/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">High</p>
            <p className="text-sm font-mono font-semibold text-green-500">
              ${stats.high.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Low</p>
            <p className="text-sm font-mono font-semibold text-red-500">
              ${stats.low.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Average</p>
            <p className="text-sm font-mono font-semibold text-muted-foreground">
              ${Math.round(stats.avg).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Change</p>
            <p className={cn(
              "text-sm font-mono font-semibold",
              isPositive ? "text-green-500" : "text-red-500"
            )}>
              {isPositive ? '+' : ''}${stats.change.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
