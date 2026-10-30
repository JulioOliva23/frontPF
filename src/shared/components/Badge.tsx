import type { ReactNode } from 'react';

export type BadgeVariant = 'slate' | 'info' | 'amber' | 'success' | 'purple' | 'danger' | 'warning';

export interface BadgeProps {
  children?: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  slate: 'bg-surface-raised text-ink-soft border-line',
  info: 'bg-sky-400/10 text-mint border-sky-400/25',
  amber: 'bg-amber-400/10 text-amber-300 border-amber-400/25',
  success: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25',
  purple: 'bg-violet-400/10 text-violet-300 border-violet-400/25',
  danger: 'bg-red-400/10 text-red-300 border-red-400/25',
  warning: 'bg-orange-400/10 text-orange-300 border-orange-400/25',
};

const dotStyles: Record<BadgeVariant, string> = {
  slate: 'bg-slate-400',
  info: 'bg-sky-400',
  amber: 'bg-amber-400',
  success: 'bg-emerald-400',
  purple: 'bg-violet-400',
  danger: 'bg-red-400',
  warning: 'bg-orange-400',
};

// FE-07: domain-agnostic; features map their own statuses to a variant.
export function Badge({ children, variant = 'slate', size = 'md', dot = false, className = '' }: BadgeProps) {
  const sizing = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border font-semibold ${sizing} ${variantStyles[variant]} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]}`} aria-hidden="true" />}
      {children}
    </span>
  );
}
