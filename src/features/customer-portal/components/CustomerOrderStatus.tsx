import type { CustomerWorkOrderStatus } from '../../../shared/api/types';
import { StatusTimeline } from '../../../shared/components/StatusTimeline';
import { formatBoB } from '../../../shared/lib/money';
import { formatWorkOrderNumber } from '../../../shared/lib/tracking-code';
import { WORK_ORDER_FLOW, WORK_ORDER_STATUS_LABELS } from '../../../shared/lib/work-order-status';

const STEPS = WORK_ORDER_FLOW.map((status) => ({ key: status, label: WORK_ORDER_STATUS_LABELS[status] }));

// RN-14: only what CustomerWorkOrderStatusDto exposes.
export function CustomerOrderStatus({ order }: { order: CustomerWorkOrderStatus }) {
  return (
    <article aria-label={`Orden ${formatWorkOrderNumber(order.number)}`} className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{formatWorkOrderNumber(order.number)}</p>
          <h2 className="text-lg font-extrabold">{order.device}</h2>
        </div>
        <p className="rounded-full bg-lime-100 px-3 py-1 text-sm font-bold text-lime-900">{order.statusLabel}</p>
      </header>
      <StatusTimeline steps={STEPS} currentKey={order.status} interruptedLabel={order.status === 'CANCELLED' ? 'La reparación fue cancelada. Puede retirar su equipo en el local.' : undefined} />
      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-500">Entrega estimada</dt>
          <dd className="font-semibold">{order.promisedAt ? new Date(order.promisedAt).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : 'Por confirmar'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Presupuesto</dt>
          <dd className="font-semibold">{order.budgetTotal ? formatBoB(order.budgetTotal) : 'Pendiente'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Última actualización</dt>
          <dd className="font-semibold">{new Date(order.updatedAt).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })}</dd>
        </div>
      </dl>
    </article>
  );
}
