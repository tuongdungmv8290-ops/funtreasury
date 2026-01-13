import { useState, useMemo } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { useAggregatedTokenBalances } from '@/hooks/useTokenBalancesFromDB';
import { formatUSD } from '@/lib/formatNumber';

// Token logos
const TOKEN_LOGOS: Record<string, string> = {
  'CAMLY': 'https://dd.dexscreener.com/ds-data/tokens/bsc/0xdfaaed7a7bde75535de433645436a0b67bf91100.png?size=lg&key=8eeef0',
  'BNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
  'USDT': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  'BTC': 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  'BTCB': 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  'USDC': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
};

// Token colors for pie chart
const TOKEN_COLORS: Record<string, string> = {
  'CAMLY': 'hsl(45, 70%, 47%)',    // Gold
  'BNB': 'hsl(43, 89%, 57%)',      // Yellow
  'USDT': 'hsl(160, 60%, 40%)',    // Green
  'BTC': 'hsl(28, 92%, 53%)',      // Orange
  'BTCB': 'hsl(28, 82%, 48%)',     // Darker Orange
  'USDC': 'hsl(215, 60%, 50%)',    // Blue
};

const DEFAULT_COLOR = 'hsl(var(--muted))';

// Active shape for hover effect
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: 'drop-shadow(0 0 12px rgba(201, 162, 39, 0.4))',
          transition: 'all 0.3s ease-out'
        }}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={innerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.3}
      />
      {/* Center text */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="hsl(var(--foreground))" className="text-sm font-medium">
        {payload.symbol}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-xs">
        {(percent * 100).toFixed(1)}%
      </text>
    </g>
  );
};

export function TokenAllocationChart() {
  const { data: tokenList, isLoading } = useAggregatedTokenBalances();
  const [activeIndex, setActiveIndex] = useState<number | undefined>();

  const totalValue = useMemo(() => {
    if (!tokenList) return 0;
    return tokenList.reduce((sum, t) => sum + t.totalUsdValue, 0);
  }, [tokenList]);

  const pieData = useMemo(() => {
    if (!tokenList || tokenList.length === 0) return [];
    
    return tokenList
      .filter(t => t.totalUsdValue > 0)
      .map(t => ({
        symbol: t.symbol,
        name: t.name,
        value: t.totalUsdValue,
        color: TOKEN_COLORS[t.symbol] || DEFAULT_COLOR,
        logo: TOKEN_LOGOS[t.symbol],
        percent: totalValue > 0 ? (t.totalUsdValue / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [tokenList, totalValue]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  if (isLoading) {
    return (
      <div className="treasury-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <PieChartIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold gold-text">Portfolio Allocation</h3>
            <p className="text-xs text-muted-foreground">Phân bổ token theo giá trị USD</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-[280px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!pieData || pieData.length === 0) {
    return (
      <div className="treasury-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <PieChartIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold gold-text">Portfolio Allocation</h3>
            <p className="text-xs text-muted-foreground">Phân bổ token theo giá trị USD</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-[280px] text-muted-foreground">
          No token data available
        </div>
      </div>
    );
  }

  return (
    <div className="treasury-card">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10 shadow-lg shadow-primary/20">
          <PieChartIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-heading font-semibold gold-text">Portfolio Allocation</h3>
          <p className="text-xs text-muted-foreground">Phân bổ token theo giá trị USD</p>
        </div>
      </div>

      {/* Content: Chart + Legend */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Pie Chart */}
        <div className="w-full lg:w-1/2 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="value"
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-out'
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {pieData.map((token, index) => (
            <div
              key={token.symbol}
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                activeIndex === index 
                  ? 'bg-primary/10 ring-1 ring-primary/30' 
                  : 'hover:bg-muted/50'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              {/* Token Logo */}
              <div className="relative">
                {token.logo ? (
                  <img 
                    src={token.logo} 
                    alt={token.symbol}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: token.color, color: 'white' }}
                  >
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                {/* Color indicator */}
                <div 
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background"
                  style={{ backgroundColor: token.color }}
                />
              </div>

              {/* Token Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${token.symbol === 'CAMLY' ? 'gold-text' : ''}`}>
                    {token.symbol}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {token.name}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {formatUSD(token.value)}
                </div>
              </div>

              {/* Percentage */}
              <div className="text-right">
                <span className={`font-mono font-semibold text-sm ${
                  token.symbol === 'CAMLY' ? 'gold-text' : ''
                }`}>
                  {token.percent.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Total Value */}
      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total Portfolio Value</span>
        <span className="font-mono font-bold text-lg gold-text">
          {formatUSD(totalValue)}
        </span>
      </div>
    </div>
  );
}
