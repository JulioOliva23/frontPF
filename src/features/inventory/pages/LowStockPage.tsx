import { BellRing } from 'lucide-react';

import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { SPARE_PART_CATEGORY_LABELS } from '../api/spare-parts-api';
import { StockBadge } from '../components/StockBadge';
import { useLowStock } from '../hooks/use-spare-parts';

// US-F13 / RN-11: parts at or below their minimum.
export function LowStockPage() {
  const { data, isLoading, isError, refetch } = useLowStock();

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold">
          <BellRing className="h-6 w-6 text-orange-500" aria-hidden="true" /> Stock bajo
        </h1>
        <p className="text-sm text-slate-500">Repuestos con stock disponible igual o menor al mínimo.</p>
      </header>
      {isLoading && <LoadingSkeleton />}
      {isError && <ErrorState message="No se pudieron cargar las alertas." onRetry={() => void refetch()} />}
      {data?.length === 0 && <EmptyState title="Todo en orden" description="Ningún repuesto está por debajo de su stock mínimo." />}
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((part) => (
          <li key={part.id} className="rounded-2xl border border-orange-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{part.name}</p>
                <p className="font-mono text-[11px] text-slate-500">
                  {part.sku} · {SPARE_PART_CATEGORY_LABELS[part.category]}
                </p>
              </div>
              <StockBadge part={part} />
            </div>
            <p className="mt-3 text-sm">
              Disponible <strong>{part.availableStock}</strong> · mínimo {part.minStock} · reservado {part.reservedStock}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
