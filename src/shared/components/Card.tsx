import type { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'bordered' | 'accent' | 'warning' | 'danger' | 'success' | 'public';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

const variantStyles = {
  default: 'glass-card transition-all text-ink',
  flat: 'bg-[#252037] border border-[#453D59] rounded-xl text-[#F0EDF8]',
  bordered: 'bg-[#201B30] border-2 border-[#453D59] rounded-2xl text-[#F0EDF8]',
  accent: 'bg-[#201B30] border border-[#C4B5FD]/50 shadow-xs shadow-orange-950/20 rounded-2xl text-[#F0EDF8]',
  warning: 'bg-[#F59E0B10] border border-[#F59E0B30] rounded-2xl text-[#F0EDF8]',
  danger: 'bg-[#EF444410] border border-[#EF444430] rounded-2xl text-[#F0EDF8]',
  success: 'bg-[#22C55E10] border border-[#22C55E30] rounded-2xl text-[#F0EDF8]',
  public: 'glass-card text-ink',
};

export function Card({ children, variant = 'public', padding = 'md', className = '', ...props }: CardProps) {
  return (
    <div className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
}
