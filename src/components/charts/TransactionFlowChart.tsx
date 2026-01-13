import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { Loader2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TimeRange = 7 | 14 | 30;

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: 7, label: '7D' },
  { value: 14, label: '14D' },
  { value: 30, label: '30D' },
];

export function TransactionFlowChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>(14);
  const { data: transactions, isLoading } = useTransactions({ days: timeRange });

  const chartData = useMemo(() => {
    const days = Array.from({ length: timeRange }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (timeRange - 1 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateObj: date,
        inflow: 0,
        outflow: 0,
      };
    });

    (transactions || []).forEach((tx) => {
      if (tx.status !== 'success' || tx.amount <= 0) return;

      const txDate = new Date(tx.timestamp);
      const dayIndex = days.findIndex((d) => {
        return (
          d.dateObj.getDate() === txDate.getDate() &&
          d.dateObj.getMonth() === txDate.getMonth() &&
          d.dateObj.getFullYear() === txDate.getFullYear()
        );
      });

      if (dayIndex !== -1) {
        if (tx.direction === 'IN') {
          days[dayIndex].inflow += tx.usd_value;
        } else {
          days[dayIndex].outflow += tx.usd_value;
        }
      }
    });

    return days.map(({ date, inflow, outflow }) => ({
      date,
      inflow: Math.round(inflow),
      outflow: Math.round(outflow),
    }));
  }, [transactions, timeRange]);

  // Calculate totals
  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, day) => ({
        inflow: acc.inflow + day.inflow,
        outflow: acc.outflow + day.outflow,
      }),
      { inflow: 0, outflow: 0 }
    );
  }, [chartData]);

  const netFlow = totals.inflow - totals.outflow;
  const isPositiveNet = netFlow >= 0;

  return (
    <div className="treasury-card p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">Transaction Flow</h3>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">Inflow</span>
              <span className="text-sm font-mono font-semibold text-green-500">
                ${totals.inflow.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-muted-foreground">Outflow</span>
              <span className="text-sm font-mono font-semibold text-red-500">
                ${totals.outflow.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

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
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-[280px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="inflowGradientChart" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="outflowGradientChart" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
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
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`,
                  name === 'inflow' ? 'Inflow' : 'Outflow'
                ]}
              />
              <Area
                type="monotone"
                dataKey="inflow"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#inflowGradientChart)"
                name="inflow"
              />
              <Area
                type="monotone"
                dataKey="outflow"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#outflowGradientChart)"
                name="outflow"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ArrowDownLeft className="w-4 h-4 text-green-500" />
            <p className="text-xs text-muted-foreground">Total Inflow</p>
          </div>
          <p className="text-lg font-mono font-bold text-green-500">
            ${totals.inflow.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ArrowUpRight className="w-4 h-4 text-red-500" />
            <p className="text-xs text-muted-foreground">Total Outflow</p>
          </div>
          <p className="text-lg font-mono font-bold text-red-500">
            ${totals.outflow.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Net Flow</p>
          <p className={cn(
            "text-lg font-mono font-bold",
            isPositiveNet ? "text-green-500" : "text-red-500"
          )}>
            {isPositiveNet ? '+' : ''}{netFlow.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
