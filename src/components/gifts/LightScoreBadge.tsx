import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LightScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LightScoreBadge({ score, size = 'md', className }: LightScoreBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-3 py-1.5 gap-1.5',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        'bg-gradient-to-r from-treasury-gold/20 to-treasury-gold/10',
        'border border-treasury-gold/40 text-treasury-gold',
        sizeClasses[size],
        className,
      )}
    >
      <Sparkles className={iconSize[size]} />
      <span className="font-mono">{Math.round(score)}</span>
    </div>
  );
}
