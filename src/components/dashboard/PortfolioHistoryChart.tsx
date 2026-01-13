import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { formatNumber } from '@/lib/formatNumber';

type TimeRange = 7 | 30 | 90;

interface PortfolioSnapshot {
  id: string;
  created_at: string;
  total_usd_value: number;
}

export function PortfolioHistoryChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>(7);

  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['portfolio-history', timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - timeRange);

      const { data, error } = await supabase
        .from('portfolio_snapshots')
        .select('id, created_at, total_usd_value')
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as PortfolioSnapshot[];
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const chartData = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];

    // Group by day and get daily average
    const dailyData: { [key: string]: { total: number; count: number } } = {};

    snapshots.forEach((snapshot) => {
      const date = new Date(snapshot.created_at);
      const dayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!dailyData[dayKey]) {
        dailyData[dayKey] = { total: 0, count: 0 };
      }
      dailyData[dayKey].total += snapshot.total_usd_value;
      dailyData[dayKey].count += 1;
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      value: Math.round(data.total / data.count),
    }));
  }, [snapshots]);

  const { change, changePercent, isPositive } = useMemo(() => {
    if (chartData.length < 2) {
      return { change: 0, changePercent: 0, isPositive: true };
    }

    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;
    const change = lastValue - firstValue;
    const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0;

    return {
      change,
      changePercent,
      isPositive: change >= 0,
    };
  }, [chartData]);

  const currentValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 7, label: '7D' },
    { value: 30, label: '30D' },
    { value: 90, label: '90D' },
  ];

  return (
    <div className="treasury-card animate-fade-in" style={{ animationDelay: '200ms' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2 tracking-wide">
            <Calendar className="w-5 h-5 text-treasury-gold" />
            Portfolio History
          </h3>
          <p className="font-body text-sm text-muted-foreground">Value over time</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center bg-secondary/80 border border-border/60 rounded-xl p-1">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeRange === option.value
                  ? 'bg-treasury-gold text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current Value & Change */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="font-mono text-3xl md:text-4xl font-semibold gold-text">
            ${formatNumber(currentValue)}
          </p>
          <p className="font-body text-xs text-muted-foreground mt-1">Current value</p>
        </div>
        {chartData.length >= 2 && (
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold ${
            isPositive 
              ? 'bg-inflow/10 text-inflow border border-inflow/20' 
              : 'bg-outflow/10 text-outflow border border-outflow/20'
          }`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{isPositive ? '+' : ''}{changePercent.toFixed(2)}%</span>
          </div>
        )}
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-[200px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-treasury-gold" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No history data yet</p>
            <p className="text-xs">Data will appear after portfolio snapshots are saved</p>
          </div>
        </div>
      ) : (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(46, 65%, 52%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(46, 65%, 52%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 11 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 11 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                dx={-5}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: '1px solid hsl(220, 13%, 91%)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: 'hsl(221, 39%, 17%)', fontWeight: 600 }}
                formatter={(value: number) => [`$${formatNumber(value)}`, 'Portfolio']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(46, 65%, 52%)"
                strokeWidth={2.5}
                fill="url(#portfolioGradient)"
                dot={false}
                activeDot={{ r: 6, fill: 'hsl(46, 65%, 52%)', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer Stats */}
      {chartData.length >= 2 && (
        <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-body text-xs text-muted-foreground">Start</p>
            <p className="font-mono text-sm font-semibold text-foreground">${formatNumber(chartData[0].value)}</p>
          </div>
          <div>
            <p className="font-body text-xs text-muted-foreground">Change</p>
            <p className={`font-mono text-sm font-semibold ${isPositive ? 'text-inflow' : 'text-outflow'}`}>
              {isPositive ? '+' : ''}{formatNumber(Math.abs(change))}
            </p>
          </div>
          <div>
            <p className="font-body text-xs text-muted-foreground">Current</p>
            <p className="font-mono text-sm font-semibold text-foreground">${formatNumber(currentValue)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
