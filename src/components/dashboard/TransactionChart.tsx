import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { Loader2 } from 'lucide-react';

export function TransactionChart() {
  const { data: transactions, isLoading } = useTransactions({ days: 14 });

  const chartData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateObj: date,
        inflow: 0,
        outflow: 0,
      };
    });

    (transactions || []).forEach((tx) => {
      if (tx.status !== 'success') return;
      
      const txDate = new Date(tx.timestamp);
      const dayIndex = last14Days.findIndex((d) => {
        return (
          d.dateObj.getDate() === txDate.getDate() &&
          d.dateObj.getMonth() === txDate.getMonth() &&
          d.dateObj.getFullYear() === txDate.getFullYear()
        );
      });

      if (dayIndex !== -1) {
        if (tx.direction === 'IN') {
          last14Days[dayIndex].inflow += tx.usd_value;
        } else {
          last14Days[dayIndex].outflow += tx.usd_value;
        }
      }
    });

    return last14Days.map(({ date, inflow, outflow }) => ({
      date,
      inflow: Math.round(inflow),
      outflow: Math.round(outflow),
    }));
  }, [transactions]);

  return (
    <div className="treasury-card animate-fade-in bg-white" style={{ animationDelay: '400ms' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Transaction Flow</h3>
          <p className="text-sm text-muted-foreground">Last 14 days</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-inflow shadow-sm" />
            <span className="text-sm text-foreground font-medium">Inflow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-outflow shadow-sm" />
            <span className="text-sm text-foreground font-medium">Outflow</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[280px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-treasury-gold" />
        </div>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: '1px solid hsl(220, 13%, 91%)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: 'hsl(221, 39%, 17%)', fontWeight: 600 }}
                itemStyle={{ color: 'hsl(220, 9%, 46%)' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Area
                type="monotone"
                dataKey="inflow"
                stroke="hsl(217, 91%, 60%)"
                strokeWidth={2.5}
                fill="url(#inflowGradient)"
                name="Inflow"
              />
              <Area
                type="monotone"
                dataKey="outflow"
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={2.5}
                fill="url(#outflowGradient)"
                name="Outflow"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
