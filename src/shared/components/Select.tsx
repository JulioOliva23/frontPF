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
      <label htmlFor={id} className="text-xs font-bold text-slate-700">
        {label}
      </label>
      <select
        id={id}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={`min-h-[44px] w-full rounded-[11px] border border-slate-200 bg-white px-[13px] text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-[3px] focus:ring-cyan-600/15 aria-[invalid=true]:border-red-500 ${className}`}
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
        <span id={errorId} className="text-[0.7rem] text-red-700">
          {error}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
