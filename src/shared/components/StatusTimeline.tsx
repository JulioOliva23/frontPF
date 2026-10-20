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
      <div role="status" className={`flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 ${className}`}>
        <XCircle className="h-5 w-5" aria-hidden="true" />
        {interruptedLabel}
      </div>
    );
  }

  return (
    <ol aria-label="Progreso" className={`flex flex-col gap-3 md:flex-row md:items-start md:gap-0 ${className}`}>
      {steps.map((step, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending';
        return (
          <li
            key={step.key}
            aria-current={state === 'current' ? 'step' : undefined}
            className="flex items-center gap-3 md:flex-1 md:flex-col md:gap-2 md:text-center"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                state === 'done'
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : state === 'current'
                    ? 'border-lime-500 bg-lime-400 text-lime-950 ring-4 ring-lime-100'
                    : 'border-slate-300 bg-white text-slate-400'
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
            <span className={`text-xs font-semibold ${state === 'current' ? 'text-slate-900' : state === 'done' ? 'text-emerald-700' : 'text-slate-500'}`}>
              {step.label}
              <span className="sr-only">{state === 'done' ? ' (completado)' : state === 'current' ? ' (actual)' : ' (pendiente)'}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
