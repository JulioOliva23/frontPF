import { Link } from 'react-router';

import type { WorkOrder } from '../../../shared/api/types';
import { formatWorkOrderNumber } from '../../../shared/lib/tracking-code';
import { WorkOrderStatusBadge } from './WorkOrderStatusBadge';

export function WorkOrderCard({ order, showStatus = true }: { order: WorkOrder; showStatus?: boolean }) {
  return (
    <Link
      to={`/ordenes/${order.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-3 shadow-xs transition-all hover:border-lime-400 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-extrabold">{formatWorkOrderNumber(order.number)}</span>
        {showStatus && <WorkOrderStatusBadge status={order.status} size="sm" />}
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-700">
        {order.device.brand} {order.device.model}
      </p>
      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{order.reportedProblem}</p>
      <p className="mt-2 text-[11px] text-slate-400">{order.technician ? `Técnico: ${order.technician.name}` : 'Sin técnico asignado'}</p>
    </Link>
  );
}
