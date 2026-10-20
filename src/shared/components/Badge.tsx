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
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-orange-50 text-orange-700 border-orange-200',
};

const dotStyles: Record<BadgeVariant, string> = {
  slate: 'bg-slate-400',
  info: 'bg-sky-500',
  amber: 'bg-amber-500',
  success: 'bg-emerald-500',
  purple: 'bg-violet-500',
  danger: 'bg-red-500',
  warning: 'bg-orange-500',
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
