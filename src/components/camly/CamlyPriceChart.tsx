import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatNumber } from "@/lib/formatNumber";

type TimeRange = '1D' | '1W' | '1M' | '3M';

interface CamlyPriceChartProps {
  className?: string;
}

// Custom tooltip component
function CustomTooltip({ active, payload, label, isPositive, basePrice }: any) {
  if (active && payload && payload.length) {
    const value = payload[0].value as number;
    const changePercent = basePrice > 0 ? ((value - basePrice) / basePrice * 100) : 0;
    
    return (
      <div className="bg-popover/95 backdrop-blur border border-border rounded-xl p-3 shadow-xl">
        <p className="text-xs text-muted-foreground mb-1">
          {format(new Date(label), 'HH:mm, dd/MM/yyyy')}
        </p>
        <p className="font-mono text-lg font-bold gold-text">
          ${formatNumber(value, { minDecimals: 6, maxDecimals: 8 })}
        </p>
        <p className={cn(
          "text-sm font-medium flex items-center gap-1",
          isPositive ? "text-inflow" : "text-outflow"
        )}>
          {isPositive ? '↑' : '↓'} {Math.abs(changePercent).toFixed(2)}%
        </p>
      </div>
    );
  }
  return null;
}

export function CamlyPriceChart({ className }: CamlyPriceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1W');

  // Generate simulated price data based on time range
  const chartData = useMemo(() => {
    const basePrice = 0.000022;
    const now = Date.now();
    const points = timeRange === '1D' ? 24 : timeRange === '1W' ? 7 * 24 : timeRange === '1M' ? 30 : 90;
    const interval = timeRange === '1D' ? 3600000 : timeRange === '1W' ? 3600000 : 86400000;

    return Array.from({ length: points }, (_, i) => {
      // Create more realistic price movement
      const trendFactor = Math.sin(i * 0.1) * 0.05;
      const volatility = (Math.random() - 0.5) * 0.03;
      const momentum = Math.sin(i * 0.3) * 0.02;
      const variation = trendFactor + volatility + momentum;
      
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

  const basePrice = chartData.length > 0 ? chartData[0].price : 0;

  // Format X-axis ticks based on time range
  const formatXAxis = (value: number) => {
    if (timeRange === '1D') {
      return format(new Date(value), 'HH:mm');
    }
    return format(new Date(value), 'dd/MM');
  };

  // Calculate Y-axis domain with padding
  const [minPrice, maxPrice] = useMemo(() => {
    const prices = chartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }, [chartData]);

  const strokeColor = isPositive ? 'hsl(var(--inflow))' : 'hsl(var(--outflow))';
  const gradientId = isPositive ? 'colorPriceGreen' : 'colorPriceRed';

  return (
    <div className={cn("space-y-4", className)}>
      {/* Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPriceGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--inflow))" stopOpacity={0.4}/>
                <stop offset="50%" stopColor="hsl(var(--inflow))" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="hsl(var(--inflow))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPriceRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--outflow))" stopOpacity={0.4}/>
                <stop offset="50%" stopColor="hsl(var(--outflow))" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="hsl(var(--outflow))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
              horizontal={true}
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tickFormatter={formatXAxis}
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              hide
            />
            <Tooltip
              content={(props) => (
                <CustomTooltip
                  {...props}
                  isPositive={isPositive}
                  basePrice={basePrice}
                />
              )}
              cursor={{
                stroke: 'hsl(var(--muted-foreground))',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              animationDuration={800}
              animationEasing="ease-out"
              dot={false}
              activeDot={{
                r: 5,
                stroke: strokeColor,
                strokeWidth: 2,
                fill: 'hsl(var(--background))',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Change Indicator */}
      <div className="flex items-center justify-between px-1">
        <span className={cn(
          "text-sm font-semibold",
          isPositive ? "text-inflow" : "text-outflow"
        )}>
          {isPositive ? '↑' : '↓'} {isPositive ? '+' : ''}{priceChange.toFixed(2)}% trong {
            timeRange === '1D' ? '24 giờ' : timeRange === '1W' ? '7 ngày' : timeRange === '1M' ? '30 ngày' : '90 ngày'
          }
        </span>
        <span className="text-xs text-muted-foreground">
          {format(new Date(), 'HH:mm dd/MM')}
        </span>
      </div>

      {/* Time Range Buttons */}
      <div className="flex gap-2">
        {(['1D', '1W', '1M', '3M'] as TimeRange[]).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
            className={cn(
              "flex-1 text-xs h-9 font-medium transition-all",
              timeRange === range 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "hover:bg-primary/10 hover:border-primary/50"
            )}
          >
            {range === '1D' ? '1 Ngày' : range === '1W' ? '1 Tuần' : range === '1M' ? '1 Tháng' : '3 Tháng'}
          </Button>
        ))}
      </div>
    </div>
  );
}
