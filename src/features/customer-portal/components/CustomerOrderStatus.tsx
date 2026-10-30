import { Smartphone, Sparkles } from 'lucide-react';
import { Mascot } from '../../../shared/components/Mascot';
import type { CustomerWorkOrderStatus } from '../../../shared/api/types';
import { StatusTimeline } from '../../../shared/components/StatusTimeline';
import { formatBoB } from '../../../shared/lib/money';
import { formatWorkOrderNumber } from '../../../shared/lib/tracking-code';
import { WORK_ORDER_FLOW, WORK_ORDER_STATUS_LABELS } from '../../../shared/lib/work-order-status';

const STEPS = WORK_ORDER_FLOW.map((status) => ({ key: status, label: WORK_ORDER_STATUS_LABELS[status] }));

// RN-14: only what CustomerWorkOrderStatusDto exposes.
export function CustomerOrderStatus({ order }: { order: CustomerWorkOrderStatus }) {
  return (
    <article aria-label={`Orden ${formatWorkOrderNumber(order.number)}`} className="glass-card grid gap-7 p-5 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-12 shrink-0 items-center justify-center rounded-2xl border border-lavender/25 bg-lavender/10 text-lavender"><Smartphone className="h-8 w-8" aria-hidden="true" /></span>
          <div><p className="text-xs font-bold uppercase tracking-widest text-muted">{formatWorkOrderNumber(order.number)}</p>
          <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">{order.device}</h2></div>
        </div>
        <p className="rounded-full border border-mint/25 bg-mint/10 px-3 py-2 text-xs font-bold text-mint">{order.statusLabel}</p>
      </header>
      <div className="rounded-2xl border border-line bg-surface-soft/40 p-5"><h3 className="mb-6 text-sm font-bold">Estado de tu equipo</h3><StatusTimeline steps={STEPS} currentKey={order.status} interruptedLabel={order.status === 'CANCELLED' ? 'La reparación fue cancelada. Puede retirar su equipo en el local.' : undefined} /></div>
      <dl className="grid gap-5 rounded-2xl border border-line bg-surface-soft/30 p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted">Entrega estimada</dt>
          <dd className="font-semibold">{order.promisedAt ? new Date(order.promisedAt).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : 'Por confirmar'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Presupuesto</dt>
          <dd className="font-semibold">{order.budgetTotal ? formatBoB(order.budgetTotal) : 'Pendiente'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Última actualización</dt>
          <dd className="font-semibold">{new Date(order.updatedAt).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })}</dd>
        </div>
      </dl>
      <div className="flex items-center gap-4 border-t border-line pt-5"><Mascot className="h-14 w-14 shrink-0" /><p className="text-xs leading-relaxed text-muted"><Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-lavender" aria-hidden="true" />Aquí encontrarás la última información disponible de tu reparación.</p></div>
    </article>
  );
}
