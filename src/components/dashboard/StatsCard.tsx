import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatUtils';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
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
        return Wallet;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'inflow':
        return {
          cardClass: 'treasury-card',
          iconBg: 'bg-inflow/10 border-inflow/30',
          iconColor: 'text-inflow',
          valueClass: 'inflow-text',
          decorGradient: 'from-inflow/15 to-transparent',
        };
      case 'outflow':
        return {
          cardClass: 'treasury-card',
          iconBg: 'bg-outflow/10 border-outflow/30',
          iconColor: 'text-outflow',
          valueClass: 'outflow-text',
          decorGradient: 'from-outflow/15 to-transparent',
        };
      case 'netflow':
        return isPositive
          ? {
              cardClass: 'treasury-card',
              iconBg: 'bg-inflow/10 border-inflow/30',
              iconColor: 'text-inflow',
              valueClass: 'inflow-text',
              decorGradient: 'from-inflow/15 to-transparent',
            }
          : {
              cardClass: 'treasury-card',
              iconBg: 'bg-outflow/10 border-outflow/30',
              iconColor: 'text-outflow',
              valueClass: 'outflow-text',
              decorGradient: 'from-outflow/15 to-transparent',
            };
      default:
        return {
          cardClass: 'treasury-card-gold',
          iconBg: 'bg-treasury-gold/15 border-treasury-gold/40',
          iconColor: 'text-treasury-gold',
          valueClass: 'gold-text',
          decorGradient: 'from-treasury-gold/20 to-transparent',
        };
    }
  };

  const Icon = getIcon();
  const styles = getStyles();

  return (
    <div
      className={cn(
        styles.cardClass,
        "relative overflow-hidden animate-fade-in"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Decorative gradient orb */}
      <div className={cn(
        "absolute -top-6 -left-6 w-28 h-28 rounded-full blur-3xl opacity-60",
        `bg-gradient-to-br ${styles.decorGradient}`
      )} />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center border",
            styles.iconBg
          )}>
            <Icon className={cn("w-5 h-5", styles.iconColor)} />
          </div>
          {subtitle && (
            <span className="text-xs font-medium text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-lg border border-border/50">
              {subtitle}
            </span>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className={cn("stat-value", styles.valueClass)}>
            {type === 'netflow' && value > 0 ? '+' : ''}
            {formatCurrency(Math.abs(value))}
          </p>
        </div>
      </div>
    </div>
  );
}
