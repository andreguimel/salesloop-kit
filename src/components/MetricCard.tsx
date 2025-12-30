import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'success';
  delay?: number;
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  variant = 'default',
  delay = 0 
}: MetricCardProps) {
  return (
    <div 
      className={cn(
        'relative group p-4 md:p-6 rounded-xl md:rounded-2xl glass hover-glow animate-fade-up overflow-hidden',
        variant === 'primary' && 'gradient-border',
        variant === 'accent' && 'gradient-border'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background glow effect */}
      {variant === 'primary' && (
        <div className="absolute -top-20 -right-20 w-32 md:w-40 h-32 md:h-40 rounded-full bg-primary/20 blur-3xl group-hover:bg-primary/30 transition-colors duration-500" />
      )}
      {variant === 'accent' && (
        <div className="absolute -top-20 -right-20 w-32 md:w-40 h-32 md:h-40 rounded-full bg-accent/20 blur-3xl group-hover:bg-accent/30 transition-colors duration-500" />
      )}
      {variant === 'success' && (
        <div className="absolute -top-20 -right-20 w-32 md:w-40 h-32 md:h-40 rounded-full bg-success/20 blur-3xl group-hover:bg-success/30 transition-colors duration-500" />
      )}
      
      <div className="relative flex items-start justify-between gap-2">
        <div className="space-y-1 md:space-y-3 min-w-0">
          <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-2xl md:text-4xl font-bold tracking-tight">
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </p>
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
              trend.isPositive 
                ? 'bg-success/20 text-success' 
                : 'bg-destructive/20 text-destructive'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-2 md:p-3 rounded-lg md:rounded-xl transition-transform duration-300 group-hover:scale-110 shrink-0',
          variant === 'primary' && 'gradient-primary',
          variant === 'accent' && 'gradient-accent',
          variant === 'success' && 'bg-success',
          variant === 'default' && 'bg-secondary'
        )}>
          <Icon className={cn(
            'h-4 w-4 md:h-5 md:w-5',
            variant !== 'default' ? 'text-primary-foreground' : 'text-muted-foreground'
          )} />
        </div>
      </div>
    </div>
  );
}
