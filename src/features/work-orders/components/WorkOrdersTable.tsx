import { Link } from 'react-router';

import type { WorkOrder } from '../../../shared/api/types';
import { formatWorkOrderNumber } from '../../../shared/lib/tracking-code';
import { WorkOrderStatusBadge } from './WorkOrderStatusBadge';

const dateFormat = new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short' });

export function WorkOrdersTable({ orders }: { orders: WorkOrder[] }) {
  return (
    <div className="orders-table-container min-w-0 md:overflow-x-auto md:rounded-3xl md:border md:border-line md:bg-surface/50">
      <table className="orders-table block w-full text-left text-sm md:table md:min-w-[720px]">
        <thead className="hidden bg-surface-soft/60 text-[10px] uppercase tracking-widest text-muted md:table-header-group">
          <tr>
            <th scope="col" className="px-4 py-3">Orden</th>
            <th scope="col" className="px-4 py-3">Equipo</th>
            <th scope="col" className="px-4 py-3">Cliente</th>
            <th scope="col" className="px-4 py-3">Técnico</th>
            <th scope="col" className="px-4 py-3">Estado</th>
            <th scope="col" className="px-4 py-3">Ingreso</th>
          </tr>
        </thead>
        <tbody className="grid gap-3 md:table-row-group md:divide-y md:divide-line">
          {orders.map((order) => (
            <tr key={order.id} className="grid grid-cols-2 items-center gap-x-3 gap-y-2 rounded-3xl border border-line bg-surface/60 p-5 transition-colors hover:bg-surface md:table-row md:rounded-none md:border-0 md:bg-transparent md:p-0">
              <td className="order-1 font-bold md:table-cell md:px-5 md:py-5">
                <Link to={`/ordenes/${order.id}`} className="text-mint hover:underline">
                  {formatWorkOrderNumber(order.number)}
                </Link>
              </td>
              <td className="order-3 col-span-2 text-lg font-bold md:table-cell md:px-4 md:py-4 md:text-sm md:font-medium">
                {order.device.brand} {order.device.model}
              </td>
              <td data-label="Cliente" className="order-4 text-xs text-muted md:table-cell md:px-4 md:py-4 md:text-sm md:text-ink">{order.customer.name}</td>
              <td data-label="Técnico" className="order-5 text-xs text-muted md:table-cell md:px-4 md:py-4 md:text-sm">{order.technician?.name ?? '—'}</td>
              <td className="order-2 justify-self-end md:table-cell md:px-4 md:py-4">
                <WorkOrderStatusBadge status={order.status} size="sm" />
              </td>
              <td data-label="Ingreso" className="order-6 col-span-2 border-t border-line pt-3 text-[11px] text-muted md:table-cell md:border-0 md:px-4 md:py-4 md:text-xs">{dateFormat.format(new Date(order.createdAt))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
