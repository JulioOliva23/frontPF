import type { ReactNode } from 'react';
import { Card } from './Card';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  variant?: 'default' | 'accent' | 'warning' | 'danger';
  theme?: 'dark' | 'light';
  className?: string;
}

export function MetricCard({ title, value, subtitle, icon, variant = 'default', theme = 'dark', className = '' }: MetricCardProps) {
  const isLight = theme === 'light';

  const iconStyle = isLight
    ? variant === 'danger'
      ? 'bg-red-400/10 text-red-300 border border-red-400/25'
      : variant === 'warning'
        ? 'bg-amber-400/10 text-amber-300 border border-amber-400/25'
        : 'bg-lavender/10 text-lavender border border-lavender/20'
    : 'bg-[#C4B5FD15] text-[#C4B5FD] border border-[#C4B5FD30]';

  const valueStyle = isLight
    ? variant === 'danger'
      ? 'text-red-300'
      : variant === 'warning'
        ? 'text-amber-300'
        : 'text-ink'
    : 'text-white';

  return (
    <Card variant={isLight ? 'public' : variant} className={`relative h-full overflow-hidden ${className}`}>
      <div className="relative">
        <div>
          <p className={`min-h-7 pr-9 text-[9px] font-semibold uppercase tracking-wider ${isLight ? 'text-muted' : 'text-[#B6B0C7]'}`}>{title}</p>
          <p className={`mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight ${valueStyle}`}>{value}</p>
          {subtitle && <p className={`mt-1 text-xs font-medium ${isLight ? 'text-muted' : 'text-[#B6B0C7]'}`}>{subtitle}</p>}
        </div>
        <div className={`absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-xl ${iconStyle}`}>{icon}</div>
      </div>
    </Card>
  );
}
