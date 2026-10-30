import { useState } from 'react';
import { Plus, Search } from 'lucide-react';

import type { SparePart, SparePartCategory } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { Pagination } from '../../../shared/components/Pagination';
import { Select } from '../../../shared/components/Select';
import { formatBoB } from '../../../shared/lib/money';
import { useAuth } from '../../auth/hooks/useAuth';
import { useDeviceModels } from '../../work-orders/hooks/use-work-orders';
import { SPARE_PART_CATEGORY_LABELS } from '../api/spare-parts-api';
import { CompatibilityModal } from '../components/CompatibilityModal';
import { SparePartFormModal } from '../components/SparePartFormModal';
import { StockBadge } from '../components/StockBadge';
import { StockMovementModal, type StockMovementKind } from '../components/StockMovementModal';
import { useSpareParts } from '../hooks/use-spare-parts';

const PAGE_SIZE = 20;
const CATEGORY_OPTIONS = Object.entries(SPARE_PART_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

// US-F11 / US-F12: catalog + stock movements. Route limited to ADMIN and
// RECEPTIONIST (RN-07); catalog edits and adjustments are ADMIN only.
export function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const models = useDeviceModels();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<SparePartCategory | ''>('');
  const [deviceModelId, setDeviceModelId] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ part: SparePart | null } | null>(null);
  const [compatibility, setCompatibility] = useState<SparePart | null>(null);
  const [movement, setMovement] = useState<{ part: SparePart; kind: StockMovementKind } | null>(null);

  const filters = {
    search: search.trim() || undefined,
    category: category || undefined,
    deviceModelId: deviceModelId || undefined,
    page,
    pageSize: PAGE_SIZE,
  };
  const { data, isLoading, isError, refetch } = useSpareParts(filters);
  const resetPage = () => setPage(1);

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Inventario de repuestos</h1>
          <p className="text-sm text-muted">Pantallas, baterías, flex, cámaras y componentes SMD/IC.</p>
        </div>
        {isAdmin && (
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ part: null })}>
            Nuevo repuesto
          </Button>
        )}
      </header>

      <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4 md:grid-cols-3">
        <div className="grid gap-[7px]">
          <label htmlFor="parts-search" className="text-xs font-bold text-ink-soft">
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="parts-search"
              value={search}
              maxLength={80}
              onChange={(event) => {
                setSearch(event.target.value);
                resetPage();
              }}
              placeholder="Nombre o SKU"
              className="min-h-[44px] w-full rounded-[11px] border border-line pl-9 pr-3 text-sm outline-none focus:border-mint focus:ring-[3px] focus:ring-lavender/15"
            />
          </div>
        </div>
        <Select
          id="parts-category"
          label="Categoría"
          placeholder="Todas"
          value={category}
          options={CATEGORY_OPTIONS}
          onChange={(event) => {
            setCategory(event.target.value as SparePartCategory | '');
            resetPage();
          }}
        />
        <Select
          id="parts-model"
          label="Compatible con"
          placeholder="Cualquier modelo"
          value={deviceModelId}
          options={(models.data ?? []).map((model) => ({ value: model.id, label: `${model.brand} ${model.model}` }))}
          onChange={(event) => {
            setDeviceModelId(event.target.value);
            resetPage();
          }}
        />
      </div>

      {isLoading && <LoadingSkeleton />}
      {isError && <ErrorState message="No se pudo cargar el inventario." onRetry={() => void refetch()} />}
      {data?.total === 0 && <EmptyState title="Sin repuestos" description="No hay repuestos que coincidan con los filtros." />}
      {data && data.total > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-surface-soft text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Repuesto</th>
                <th scope="col" className="px-4 py-3">Categoría</th>
                {isAdmin && <th scope="col" className="px-4 py-3 text-right">Costo</th>}
                <th scope="col" className="px-4 py-3 text-right">Precio al cliente</th>
                <th scope="col" className="px-4 py-3 text-right">Disp. / Res. / Mín.</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.data.map((part) => (
                <tr key={part.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{part.name}</p>
                    <p className="font-mono text-[11px] text-muted">{part.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{SPARE_PART_CATEGORY_LABELS[part.category]}</td>
                  {isAdmin && <td className="px-4 py-3 text-right">{formatBoB(part.unitCost)}</td>}
                  <td className="px-4 py-3 text-right">{formatBoB(part.workshopPrice)}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {part.availableStock} / {part.reservedStock} / {part.minStock}
                  </td>
                  <td className="px-4 py-3">
                    <StockBadge part={part} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Button size="sm" variant="outline-light" onClick={() => setCompatibility(part)}>
                        Modelos ({part.compatibleDeviceModelIds.length})
                      </Button>
                      <Button size="sm" variant="outline-light" onClick={() => setMovement({ part, kind: 'entry' })}>
                        Entrada
                      </Button>
                      {isAdmin && (
                        <>
                          <Button size="sm" variant="outline-light" onClick={() => setMovement({ part, kind: 'adjustment' })}>
                            Ajuste
                          </Button>
                          <Button size="sm" variant="ghost-light" onClick={() => setEditing({ part })}>
                            Editar
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4">
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
          </div>
        </div>
      )}

      {editing && <SparePartFormModal isOpen part={editing.part} onClose={() => setEditing(null)} />}
      {compatibility && <CompatibilityModal key={compatibility.id} part={compatibility} canEdit={isAdmin} onClose={() => setCompatibility(null)} />}
      <StockMovementModal key={movement ? `${movement.part.id}-${movement.kind}` : 'none'} part={movement?.part ?? null} kind={movement?.kind ?? 'entry'} onClose={() => setMovement(null)} />
    </div>
  );
}
