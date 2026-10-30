import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, options, placeholder, id, className = '', ...props }, ref) => {
  const errorId = error && id ? `${id}-error` : undefined;
  return (
    <div className="grid gap-[7px]">
      <label htmlFor={id} className="text-xs font-bold text-ink-soft">
        {label}
      </label>
      <select
        id={id}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={`min-h-[44px] w-full rounded-[11px] border border-line bg-surface px-[13px] text-sm text-ink outline-none focus:border-mint focus:ring-[3px] focus:ring-lavender/15 aria-[invalid=true]:border-red-500 ${className}`}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={errorId} className="text-[0.7rem] text-red-300">
          {error}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
