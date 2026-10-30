import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Ocurrio un error al cargar los datos.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-line bg-surface px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-400/25 bg-red-400/10">
        <AlertTriangle className="h-6 w-6 text-red-300" />
      </div>
      <h3 className="text-sm font-bold text-ink">Error</h3>
      <p className="max-w-md text-xs text-muted">{message}</p>
      {onRetry && (
        <Button variant="outline-light" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
