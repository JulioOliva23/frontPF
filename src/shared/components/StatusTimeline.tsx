import { CheckCircle2, Circle, CircleDot, XCircle } from 'lucide-react';

export interface TimelineStep {
  key: string;
  label: string;
}

interface StatusTimelineProps {
  steps: readonly TimelineStep[];
  currentKey: string;
  // A terminal state outside the happy path (e.g. a cancelled order).
  interruptedLabel?: string;
  className?: string;
}

// FE-07: generic progress timeline. Vertical on phones, horizontal from md up.
export function StatusTimeline({ steps, currentKey, interruptedLabel, className = '' }: StatusTimelineProps) {
  const currentIndex = steps.findIndex((step) => step.key === currentKey);

  if (interruptedLabel) {
    return (
      <div role="status" className={`flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm font-semibold text-red-300 ${className}`}>
        <XCircle className="h-5 w-5" aria-hidden="true" />
        {interruptedLabel}
      </div>
    );
  }

  return (
    <ol aria-label="Progreso" className={`flex flex-col gap-0 md:flex-row md:items-start ${className}`}>
      {steps.map((step, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending';
        return (
          <li
            key={step.key}
            aria-current={state === 'current' ? 'step' : undefined}
            data-state={state}
            className="status-step flex min-w-0 items-center gap-4 pb-7 last:pb-0 md:flex-1 md:flex-col md:gap-3 md:pb-0 md:text-center"
          >
            <span
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                state === 'done'
                  ? 'border-mint bg-mint text-mint-deep'
                  : state === 'current'
                    ? 'border-lavender bg-surface text-lavender ring-4 ring-lavender/20'
                    : 'border-line bg-surface text-muted'
              }`}
            >
              {state === 'done' ? (
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              ) : state === 'current' ? (
                <CircleDot className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Circle className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            <span className={`text-xs font-semibold ${state === 'current' ? 'text-lavender' : state === 'done' ? 'text-mint' : 'text-muted'}`}>
              {step.label}
              <span className="sr-only">{state === 'done' ? ' (completado)' : state === 'current' ? ' (actual)' : ' (pendiente)'}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
