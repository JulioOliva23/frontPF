import { Link } from 'react-router';

import type { WorkOrder } from '../../../shared/api/types';
import { formatWorkOrderNumber } from '../../../shared/lib/tracking-code';
import { WorkOrderStatusBadge } from './WorkOrderStatusBadge';

const dateFormat = new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short' });

export function WorkOrdersTable({ orders }: { orders: WorkOrder[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Orden</th>
            <th scope="col" className="px-4 py-3">Equipo</th>
            <th scope="col" className="px-4 py-3">Cliente</th>
            <th scope="col" className="px-4 py-3">Técnico</th>
            <th scope="col" className="px-4 py-3">Estado</th>
            <th scope="col" className="px-4 py-3">Ingreso</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-bold">
                <Link to={`/ordenes/${order.id}`} className="text-lime-800 hover:underline">
                  {formatWorkOrderNumber(order.number)}
                </Link>
              </td>
              <td className="px-4 py-3">
                {order.device.brand} {order.device.model}
              </td>
              <td className="px-4 py-3">{order.customer.name}</td>
              <td className="px-4 py-3 text-slate-600">{order.technician?.name ?? '—'}</td>
              <td className="px-4 py-3">
                <WorkOrderStatusBadge status={order.status} size="sm" />
              </td>
              <td className="px-4 py-3 text-slate-500">{dateFormat.format(new Date(order.createdAt))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
