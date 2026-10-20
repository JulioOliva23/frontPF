import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const fieldBaseClasses = [
  'w-full',
  'border border-slate-200 rounded-[11px]',
  'outline-none bg-white text-slate-900',
  'transition-[border-color,box-shadow] duration-150',
  'focus:border-lime-600 focus:ring-[3px] focus:ring-lime-600/15',
  'aria-[invalid=true]:border-red-500',
  'placeholder:text-slate-400',
].join(' ');

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

function describedBy(id: string | undefined, hint?: string, error?: string): string | undefined {
  if (!id) return undefined;
  return [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
}

// forwardRef so react-hook-form's register() can attach (FE-11).
export const FormField = forwardRef<HTMLInputElement, FieldProps>(({ label, error, hint, id, className, ...props }, ref) => (
  <div className="grid gap-[7px]">
    <label htmlFor={id} className="text-xs font-bold text-slate-700">
      {label}
    </label>
    <input
      id={id}
      ref={ref}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy(id, hint, error)}
      className={`${fieldBaseClasses} min-h-[44px] px-[13px] ${className ?? ''}`.trim()}
      {...props}
    />
    {hint && (
      <span className="text-[0.7rem] text-slate-500" id={`${id}-hint`}>
        {hint}
      </span>
    )}
    {error && (
      <span className="text-[0.7rem] text-red-700" id={`${id}-error`} role="alert">
        {error}
      </span>
    )}
  </div>
));
FormField.displayName = 'FormField';

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(({ label, error, hint, id, className, ...props }, ref) => (
  <div className="grid gap-[7px]">
    <label htmlFor={id} className="text-xs font-bold text-slate-700">
      {label}
    </label>
    <textarea
      id={id}
      ref={ref}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy(id, hint, error)}
      className={`${fieldBaseClasses} min-h-[110px] resize-y px-[13px] py-3 ${className ?? ''}`.trim()}
      {...props}
    />
    {hint && (
      <span className="text-[0.7rem] text-slate-500" id={`${id}-hint`}>
        {hint}
      </span>
    )}
    {error && (
      <span className="text-[0.7rem] text-red-700" id={`${id}-error`} role="alert">
        {error}
      </span>
    )}
  </div>
));
TextAreaField.displayName = 'TextAreaField';
