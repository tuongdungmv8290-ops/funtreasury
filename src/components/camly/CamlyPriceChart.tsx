import { useState, useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TimeRange = '1D' | '1W' | '1M' | '3M';

interface CamlyPriceChartProps {
  className?: string;
}

export function CamlyPriceChart({ className }: CamlyPriceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1W');

  // Generate simulated price data based on time range
  const chartData = useMemo(() => {
    const basePrice = 0.000022;
    const now = Date.now();
    const points = timeRange === '1D' ? 24 : timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : 90;
    const interval = timeRange === '1D' ? 3600000 : 86400000;

    return Array.from({ length: points }, (_, i) => {
      const variation = Math.sin(i * 0.5) * 0.1 + Math.random() * 0.05 - 0.025;
      return {
        time: now - (points - 1 - i) * interval,
        price: basePrice * (1 + variation),
      };
    });
  }, [timeRange]);

  const isPositive = chartData.length >= 2 && 
    chartData[chartData.length - 1].price >= chartData[0].price;
  
  const priceChange = chartData.length >= 2 
    ? ((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price * 100)
    : 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Chart */}
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const value = payload[0].value as number;
                  return (
                    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2">
                      <p className="font-mono text-sm font-medium">
                        ${value.toFixed(8)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? 'hsl(var(--inflow))' : 'hsl(var(--outflow))'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Change Indicator */}
      <div className="flex items-center justify-between">
        <span className={cn(
          "text-sm font-medium",
          isPositive ? "text-inflow" : "text-outflow"
        )}>
          {isPositive ? '+' : ''}{priceChange.toFixed(2)}% trong {
            timeRange === '1D' ? '24h' : timeRange === '1W' ? '7 ngày' : timeRange === '1M' ? '30 ngày' : '90 ngày'
          }
        </span>
      </div>

      {/* Time Range Buttons */}
      <div className="flex gap-2">
        {(['1D', '1W', '1M', '3M'] as TimeRange[]).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange(range)}
            className={cn(
              "flex-1 text-xs h-8",
              timeRange === range && "bg-primary text-primary-foreground"
            )}
          >
            {range === '1D' ? '1 Ngày' : range === '1W' ? '1 Tuần' : range === '1M' ? '1 Tháng' : '3 Tháng'}
          </Button>
        ))}
      </div>
    </div>
  );
}
