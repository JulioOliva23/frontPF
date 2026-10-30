import { Wrench } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Cargando...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-line bg-surface px-6 py-16">
      <div className="relative" aria-hidden="true">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-mint" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Wrench className="h-4 w-4 text-mint" />
        </div>
      </div>
      <p className="text-sm font-medium text-muted">{message}</p>
    </div>
  )
}
