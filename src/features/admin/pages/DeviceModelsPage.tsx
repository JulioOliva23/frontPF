import { useMemo, useState } from 'react';
import { Search, Smartphone } from 'lucide-react';

import { toApiError } from '../../../shared/api/httpClient';
import type { DeviceModel } from '../../../shared/api/types';
import { Badge } from '../../../shared/components/Badge';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { useToast } from '../../../shared/components/toast-context';
import { DeviceModelQuickAdd } from '../components/DeviceModelQuickAdd';
import { useDeviceModelCatalog, useDeviceModelMutations } from '../hooks/use-admin';
import { groupByBrand, matchesModelSearch } from '../schemas/device-model-schema';

// US-F14: commercial models grouped by brand (they anchor spare part
// compatibility, RN-10). Deactivating hides a model from intake; its devices,
// history and compatibilities stay.
export function DeviceModelsPage() {
  const catalog = useDeviceModelCatalog();
  const { update } = useDeviceModelMutations();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const all = catalog.data ?? [];
  const groups = useMemo(
    () => groupByBrand((catalog.data ?? []).filter((entry) => (showInactive || entry.isActive) && matchesModelSearch(entry, search))),
    [catalog.data, showInactive, search],
  );
  const activeCount = all.filter((entry) => entry.isActive).length;
  const inactiveCount = all.length - activeCount;

  const toggle = async (entry: DeviceModel) => {
    setPendingId(entry.id);
    try {
      await update.mutateAsync({ id: entry.id, payload: { isActive: !entry.isActive } });
      if (entry.isActive) toast.warning('Modelo desactivado', `${entry.brand} ${entry.model} ya no aparece en la recepción.`);
      else toast.success('Modelo reactivado', `${entry.brand} ${entry.model} vuelve a estar disponible.`);
    } catch (error) {
      toast.danger('No se pudo actualizar el modelo', toApiError(error)?.message);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">Modelos de equipos</h1>
        <p className="text-sm text-slate-500">
          {catalog.data ? `${activeCount} activos${inactiveCount ? ` · ${inactiveCount} desactivados` : ''}` : 'Catálogo de marcas y modelos'}
        </p>
      </header>

      {catalog.data && <DeviceModelQuickAdd catalog={all} />}

      <div role="search" aria-label="Filtros de modelos" className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <label htmlFor="models-search" className="sr-only">
            Buscar modelos
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="models-search"
            type="search"
            value={search}
            placeholder="Buscar marca o modelo"
            onChange={(event) => setSearch(event.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-lime-600 focus:ring-[3px] focus:ring-lime-600/15"
          />
        </div>
        <label className="flex min-h-[44px] items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} className="h-4 w-4 accent-lime-600" />
          Mostrar desactivados
        </label>
      </div>

      {catalog.isLoading && <LoadingSkeleton />}
      {catalog.isError && <ErrorState message="No se pudo cargar el catálogo de modelos." onRetry={() => void catalog.refetch()} />}
      {catalog.data && groups.length === 0 && (
        <EmptyState
          icon={<Smartphone className="h-7 w-7" aria-hidden="true" />}
          title={search.trim() ? 'Sin resultados' : 'Sin modelos'}
          description={search.trim() ? `Ningún modelo coincide con “${search.trim()}”.` : 'Agrega el primer modelo con el formulario de arriba.'}
          actionLabel={search.trim() ? 'Limpiar búsqueda' : undefined}
          onAction={search.trim() ? () => setSearch('') : undefined}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <section key={group.brand} aria-label={group.brand} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <h2 className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm font-extrabold text-slate-900">
              {group.brand}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{group.models.length}</span>
            </h2>
            <ul className="divide-y divide-slate-100">
              {group.models.map((entry) => (
                <li key={entry.id} className="flex min-h-[48px] items-center justify-between gap-2 px-4 py-2">
                  <span className={`text-sm ${entry.isActive ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{entry.model}</span>
                  <span className="flex items-center gap-2">
                    {!entry.isActive && (
                      <Badge variant="slate" size="sm">
                        Desactivado
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => void toggle(entry)}
                      disabled={pendingId === entry.id}
                      aria-label={`${entry.isActive ? 'Desactivar' : 'Reactivar'} ${entry.brand} ${entry.model}`}
                      className="min-h-[36px] rounded-lg px-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                    >
                      {entry.isActive ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
