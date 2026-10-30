import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  id?: string;
  tone?: 'dark' | 'light';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, leftIcon, rightIcon, id, tone = 'light', className = '', ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const leadingIcon = icon ?? leftIcon;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider ${tone === 'light' ? 'text-muted' : 'text-[#B6B0C7]'}`}
          >
            {label}
            {props.required && <span className="text-red-300 ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-xl shadow-xs">
          {leadingIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B6B0C7]">
              {leadingIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`block min-h-[44px] w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 ${
              tone === 'light'
                ? 'border-line bg-surface text-ink placeholder:text-muted focus:border-mint focus:ring-lavender'
                : 'border-[#453D59] bg-[#100D1D] text-[#F0EDF8] placeholder:text-[#B6B0C7]/80 focus:border-[#C4B5FD] focus:ring-[#C4B5FD]'
            } ${leadingIcon ? 'pl-11' : ''} ${rightIcon ? 'pr-11' : ''} ${
              error
                ? tone === 'light'
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                  : 'border-[#EF4444] bg-[#EF444410] focus:border-[#EF4444] focus:ring-[#EF4444]'
                : tone === 'light'
                  ? 'hover:border-line'
                  : 'border-[#453D59] hover:border-[#5B516F]'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#B6B0C7]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p role="alert" className="mt-1 text-xs font-medium text-red-300">{error}</p>}
        {!error && helperText && (
          <p className="mt-1 text-xs text-[#B6B0C7]">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
