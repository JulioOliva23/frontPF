import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost' | 'warning' | 'outline-light' | 'ghost-light';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] min-h-[44px] min-w-[44px]';

  const sizeStyles = {
    sm: 'px-3 py-2 text-xs gap-1.5 min-h-[44px]',
    md: 'px-4 py-2.5 text-sm gap-2 min-h-[44px]',
    lg: 'px-6 py-3.5 text-base gap-2.5 min-h-[50px]',
  };

  const variantStyles = {
    primary:
      'primary-action focus:ring-lavender focus:ring-offset-surface-soft',
    secondary: 'bg-[#453D59] text-[#F0EDF8] hover:bg-[#5B516F] hover:text-white focus:ring-[#453D59]',
    outline:
      'border border-[#453D59] bg-[#252037] text-[#F0EDF8] hover:bg-[#453D59] hover:text-white focus:ring-[#C4B5FD]',
    danger: 'bg-red-700 text-white hover:bg-red-600 focus:ring-red-300',
    success: 'bg-mint text-mint-deep hover:bg-mint/90 focus:ring-mint',
    warning: 'bg-[#F59E0B15] text-[#F59E0B] border border-[#F59E0B30] hover:bg-[#F59E0B25] focus:ring-[#F59E0B]',
    ghost: 'text-[#B6B0C7] hover:text-[#F0EDF8] hover:bg-[#453D59] focus:ring-[#453D59]',
    'outline-light':
      'border border-line bg-surface text-ink-soft hover:bg-surface-raised hover:text-ink focus:ring-lavender',
    'ghost-light': 'text-ink-soft hover:text-ink hover:bg-surface-raised focus:ring-lavender',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
