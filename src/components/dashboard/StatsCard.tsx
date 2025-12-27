import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/mockData';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  type: 'inflow' | 'outflow' | 'netflow' | 'balance';
  icon?: LucideIcon;
  subtitle?: string;
  index?: number;
}

export function StatsCard({ title, value, type, icon: CustomIcon, subtitle, index = 0 }: StatsCardProps) {
  const isPositive = value >= 0;
  
  const getIcon = () => {
    if (CustomIcon) return CustomIcon;
    switch (type) {
      case 'inflow':
        return ArrowDownRight;
      case 'outflow':
        return ArrowUpRight;
      case 'netflow':
        return isPositive ? TrendingUp : TrendingDown;
      default:
        return Minus;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'inflow':
        return {
          bg: 'from-inflow/20 to-inflow/5',
          border: 'border-inflow/20',
          icon: 'text-inflow',
          value: 'inflow-text',
        };
      case 'outflow':
        return {
          bg: 'from-outflow/20 to-outflow/5',
          border: 'border-outflow/20',
          icon: 'text-outflow',
          value: 'outflow-text',
        };
      case 'netflow':
        return isPositive
          ? {
              bg: 'from-inflow/20 to-inflow/5',
              border: 'border-inflow/20',
              icon: 'text-inflow',
              value: 'inflow-text',
            }
          : {
              bg: 'from-outflow/20 to-outflow/5',
              border: 'border-outflow/20',
              icon: 'text-outflow',
              value: 'outflow-text',
            };
      default:
        return {
          bg: 'from-treasury-gold/20 to-treasury-gold/5',
          border: 'border-treasury-gold/20',
          icon: 'text-treasury-gold',
          value: 'gold-text',
        };
    }
  };

  const Icon = getIcon();
  const colors = getColors();

  return (
    <div
      className={cn(
        "treasury-card relative overflow-hidden animate-fade-in",
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Decorative gradient */}
      <div className={cn(
        "absolute top-0 left-0 w-24 h-24 rounded-full blur-2xl opacity-50",
        `bg-gradient-to-br ${colors.bg}`
      )} />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
            colors.bg,
            colors.border,
            "border"
          )}>
            <Icon className={cn("w-5 h-5", colors.icon)} />
          </div>
          {subtitle && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
              {subtitle}
            </span>
          )}
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className={cn("stat-value", colors.value)}>
            {type === 'netflow' && value > 0 ? '+' : ''}
            {formatCurrency(Math.abs(value))}
          </p>
        </div>
      </div>
    </div>
  );
}
