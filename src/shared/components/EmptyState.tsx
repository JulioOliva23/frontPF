import type { ReactNode } from 'react';
import { Mascot } from './Mascot';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'dark' | 'light';
  descriptionClassName?: string;
  className?: string;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, tone = 'light', descriptionClassName = '', className = '' }: EmptyStateProps) {
  const isLight = tone === 'light';

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed ${
        isLight ? 'border-line bg-surface' : 'border-[#453D59] bg-[#201B30]/40'
      } ${className}`}
    >
      <div
        className={`${icon ? 'h-14 w-14 rounded-2xl border' : 'mascot-halo h-28 w-28'} flex items-center justify-center mb-4 ${
          !icon ? '' : isLight ? 'bg-mint/10 border-mint/20 text-mint' : 'bg-lavender/10 border-lavender/20 text-lavender'
        }`}
      >
        {icon ?? <Mascot className="h-28 w-28" />}
      </div>
      <h3 className={`text-base font-bold ${isLight ? 'text-ink' : 'text-white'}`}>{title}</h3>
      <p className={`mt-1 text-sm max-w-sm ${isLight ? 'text-muted' : 'text-[#B6B0C7]'} ${descriptionClassName}`}>{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`mt-5 min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
            isLight
              ? 'border-line bg-surface text-ink-soft hover:bg-surface-raised hover:text-ink'
              : 'border-[#453D59] bg-[#252037] text-[#F0EDF8] hover:bg-[#453D59] hover:text-white'
          }`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
