import type { WorkOrderStatus } from '../../../shared/api/types';
import { WORK_ORDER_STATUS_LABELS } from '../../../shared/lib/work-order-status';
import type { WorkOrderFilters } from '../api/work-orders-api';
import { useWorkOrders } from '../hooks/use-work-orders';
import { WorkOrderCard } from './WorkOrderCard';

const COLUMN_PAGE_SIZE = 20;

// Filters every column shares (the status is the column itself).
type ColumnFilters = Pick<WorkOrderFilters, 'technicianId' | 'search'>;

function BoardColumn({ status, filters }: { status: WorkOrderStatus; filters: ColumnFilters }) {
  const { data, isLoading, isError } = useWorkOrders({ ...filters, status, page: 1, pageSize: COLUMN_PAGE_SIZE });
  return (
    <section aria-label={WORK_ORDER_STATUS_LABELS[status]} className="flex w-72 shrink-0 flex-col rounded-2xl bg-surface-raised p-3">
      <h2 className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-muted">
        {WORK_ORDER_STATUS_LABELS[status]}
        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted">{data?.total ?? '…'}</span>
      </h2>
      <div className="grid gap-2">
        {isLoading && <div className="h-20 animate-pulse rounded-xl bg-surface" />}
        {isError && <p className="text-xs text-red-300">No se pudo cargar</p>}
        {data?.data.map((order) => <WorkOrderCard key={order.id} order={order} showStatus={false} />)}
        {data && data.total > COLUMN_PAGE_SIZE && (
          <p className="text-center text-[11px] text-muted">y {data.total - COLUMN_PAGE_SIZE} más (use la vista de tabla)</p>
        )}
        {data?.total === 0 && <p className="py-4 text-center text-[11px] text-muted">Sin órdenes</p>}
      </div>
    </section>
  );
}

// One query per column; the backend filters by status (and by technician
// for TECHNICIAN users, RN-06).
export function WorkOrdersBoard({ statuses, filters = {} }: { statuses: readonly WorkOrderStatus[]; filters?: ColumnFilters }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="flex gap-3">
        {statuses.map((status) => (
          <BoardColumn key={status} status={status} filters={filters} />
        ))}
      </div>
    </div>
  );
}
