import { useState } from 'react';
import { ClipboardPlus, Columns3, Rows3, SearchX } from 'lucide-react';
import { Link } from 'react-router';

import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { Pagination } from '../../../shared/components/Pagination';
import { ALL_WORK_ORDER_STATUSES } from '../../../shared/lib/work-order-status';
import { FRONT_DESK_ROLES } from '../../auth/config/role-routes';
import { useAuth } from '../../auth/hooks/useAuth';
import { StatusFilterChips } from '../components/StatusFilterChips';
import { TechnicianFilter } from '../components/TechnicianFilter';
import { WorkOrderSearchInput } from '../components/WorkOrderSearchInput';
import { WorkOrdersBoard } from '../components/WorkOrdersBoard';
import { WorkOrdersTable } from '../components/WorkOrdersTable';
import { useWorkOrders } from '../hooks/use-work-orders';
import { useWorkOrderFilters, type WorkOrderListFilters } from '../hooks/use-work-order-filters';

type View = 'table' | 'board';
const PAGE_SIZE = 20;

interface TableViewProps {
  filters: WorkOrderListFilters;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

// Keyed by the filters in the page, so any filter change starts at page 1.
function TableView({ filters, hasActiveFilters, onResetFilters }: TableViewProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useWorkOrders({ ...filters, page, pageSize: PAGE_SIZE });
  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState message="No se pudieron cargar las órdenes." onRetry={() => void refetch()} />;
  if (!data || data.total === 0) {
    return hasActiveFilters ? (
      <EmptyState
        icon={<SearchX className="h-7 w-7" aria-hidden="true" />}
        title="Sin resultados"
        description={
          filters.search
            ? `Ninguna orden coincide con “${filters.search}” y los filtros elegidos. Revisa el número de OT, el IMEI o el nombre del cliente.`
            : 'Ninguna orden coincide con los filtros elegidos.'
        }
        actionLabel="Limpiar filtros"
        onAction={onResetFilters}
      />
    ) : (
      <EmptyState title="Sin órdenes" description="Todavía no hay órdenes registradas." />
    );
  }
  return (
    <div className="grid gap-4">
      <WorkOrdersTable orders={data.data} />
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
    </div>
  );
}

// US-F02: list of work orders. Technicians only receive their own (RN-06).
// Status, technician and search live in the URL (?status=&technicianId=&search=).
export function WorkOrdersPage() {
  const { user } = useAuth();
  const [view, setView] = useState<View>('table');
  const { filters, setStatus, setTechnicianId, setSearch, reset } = useWorkOrderFilters();
  const isFrontDesk = user ? FRONT_DESK_ROLES.includes(user.role) : false;
  // RN-06: the backend ignores technicianId for technicians; so does the UI.
  const effectiveFilters: WorkOrderListFilters = isFrontDesk ? filters : { ...filters, technicianId: undefined };
  const effectiveHasFilters = Boolean(effectiveFilters.status || effectiveFilters.technicianId || effectiveFilters.search);

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Órdenes de trabajo</h1>
          <p className="text-sm text-slate-500">{user?.role === 'TECHNICIAN' ? 'Tus órdenes asignadas' : 'Todas las órdenes del servicio'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Vista" className="flex rounded-xl border border-slate-200 bg-white p-1">
            {(
              [
                { id: 'table', label: 'Tabla', icon: <Rows3 className="h-4 w-4" aria-hidden="true" /> },
                { id: 'board', label: 'Tablero', icon: <Columns3 className="h-4 w-4" aria-hidden="true" /> },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={view === option.id}
                onClick={() => setView(option.id)}
                className={`flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold ${view === option.id ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
          {isFrontDesk && (
            <Link
              to="/ordenes/nueva"
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-bold text-cyan-950 shadow-sm hover:bg-cyan-300"
            >
              <ClipboardPlus className="h-4 w-4" aria-hidden="true" /> Nuevo ingreso
            </Link>
          )}
        </div>
      </header>

      <div role="search" aria-label="Filtros de órdenes" className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <WorkOrderSearchInput value={effectiveFilters.search ?? ''} onChange={setSearch} />
          {isFrontDesk && <TechnicianFilter value={effectiveFilters.technicianId} onChange={setTechnicianId} />}
          {effectiveHasFilters && (
            <button
              type="button"
              onClick={reset}
              className="min-h-[44px] rounded-xl px-3 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <StatusFilterChips value={effectiveFilters.status} onChange={setStatus} />
      </div>

      {view === 'table' ? (
        <TableView
          key={JSON.stringify(effectiveFilters)}
          filters={effectiveFilters}
          hasActiveFilters={effectiveHasFilters}
          onResetFilters={reset}
        />
      ) : (
        <WorkOrdersBoard
          statuses={effectiveFilters.status ? [effectiveFilters.status] : ALL_WORK_ORDER_STATUSES}
          filters={{ technicianId: effectiveFilters.technicianId, search: effectiveFilters.search }}
        />
      )}
    </div>
  );
}
