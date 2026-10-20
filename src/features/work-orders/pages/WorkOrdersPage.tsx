import { useState } from 'react';
import { ClipboardPlus, Columns3, Rows3 } from 'lucide-react';
import { Link } from 'react-router';

import type { WorkOrderStatus } from '../../../shared/api/types';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { Pagination } from '../../../shared/components/Pagination';
import { ALL_WORK_ORDER_STATUSES } from '../../../shared/lib/work-order-status';
import { FRONT_DESK_ROLES } from '../../auth/config/role-routes';
import { useAuth } from '../../auth/hooks/useAuth';
import { StatusFilterChips } from '../components/StatusFilterChips';
import { WorkOrdersBoard } from '../components/WorkOrdersBoard';
import { WorkOrdersTable } from '../components/WorkOrdersTable';
import { useWorkOrders } from '../hooks/use-work-orders';

type View = 'table' | 'board';
const PAGE_SIZE = 20;

function TableView({ status }: { status: WorkOrderStatus | undefined }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useWorkOrders({ status, page, pageSize: PAGE_SIZE });
  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState message="No se pudieron cargar las órdenes." onRetry={() => void refetch()} />;
  if (!data || data.total === 0) {
    return <EmptyState title="Sin órdenes" description={status ? 'No hay órdenes en este estado.' : 'Todavía no hay órdenes registradas.'} />;
  }
  return (
    <div className="grid gap-4">
      <WorkOrdersTable orders={data.data} />
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
    </div>
  );
}

// US-F02: list of work orders. Technicians only receive their own (RN-06).
export function WorkOrdersPage() {
  const { user } = useAuth();
  const [view, setView] = useState<View>('table');
  const [status, setStatus] = useState<WorkOrderStatus | undefined>(undefined);
  const canCreate = user ? FRONT_DESK_ROLES.includes(user.role) : false;

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
                className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold ${view === option.id ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
          {canCreate && (
            <Link
              to="/ordenes/nueva"
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-lime-400 px-4 text-sm font-bold text-lime-950 shadow-sm hover:bg-lime-300"
            >
              <ClipboardPlus className="h-4 w-4" aria-hidden="true" /> Nuevo ingreso
            </Link>
          )}
        </div>
      </header>

      <StatusFilterChips value={status} onChange={setStatus} />

      {view === 'table' ? <TableView key={status ?? 'all'} status={status} /> : <WorkOrdersBoard statuses={status ? [status] : ALL_WORK_ORDER_STATUSES} />}
    </div>
  );
}
