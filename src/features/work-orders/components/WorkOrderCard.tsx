import { Link } from 'react-router';

import type { WorkOrder } from '../../../shared/api/types';
import { formatWorkOrderNumber } from '../../../shared/lib/tracking-code';
import { WorkOrderStatusBadge } from './WorkOrderStatusBadge';

export function WorkOrderCard({ order, showStatus = true }: { order: WorkOrder; showStatus?: boolean }) {
  return (
    <Link
      to={`/ordenes/${order.id}`}
      className="glass-card block p-4 transition-colors hover:border-lavender/40"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-extrabold">{formatWorkOrderNumber(order.number)}</span>
        {showStatus && <WorkOrderStatusBadge status={order.status} size="sm" />}
      </div>
      <p className="mt-1 text-xs font-semibold text-ink-soft">
        {order.device.brand} {order.device.model}
      </p>
      <p className="mt-1 line-clamp-2 text-xs text-muted">{order.reportedProblem}</p>
      <p className="mt-2 text-[11px] text-muted">{order.technician ? `Técnico: ${order.technician.name}` : 'Sin técnico asignado'}</p>
    </Link>
  );
}
