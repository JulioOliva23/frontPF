import { Link } from 'react-router';

import type { WorkOrderStatus } from '../../../shared/api/types';
import { EmptyState } from '../../../shared/components/EmptyState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { formatWorkOrderNumber } from '../../../shared/lib/tracking-code';
import { WorkOrderStatusBadge } from '../../work-orders/components/WorkOrderStatusBadge';
import { useWorkOrders } from '../../work-orders/hooks/use-work-orders';

function Queue({ status, title, description }: { status: WorkOrderStatus; title: string; description: string }) {
  const { data, isLoading } = useWorkOrders({ status, page: 1, pageSize: 50 });
  return (
    <section aria-labelledby={`queue-${status}`} className="grid gap-3">
      <div>
        <h2 id={`queue-${status}`} className="text-sm font-bold uppercase tracking-wide text-muted">
          {title} {data && <span className="text-muted">({data.total})</span>}
        </h2>
        <p className="text-xs text-muted">{description}</p>
      </div>
      {isLoading && <LoadingSkeleton rows={2} />}
      {data?.total === 0 && <EmptyState title="Nada pendiente" description="No hay órdenes en esta etapa." />}
      <ul className="grid gap-2 md:grid-cols-2">
        {data?.data.map((order) => (
          <li key={order.id}>
            <Link to={`/presupuestos/${order.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 hover:border-mint">
              <span>
                <span className="block text-sm font-extrabold">{formatWorkOrderNumber(order.number)}</span>
                <span className="block text-xs text-muted">
                  {order.device.brand} {order.device.model} · {order.customer.name}
                </span>
              </span>
              <WorkOrderStatusBadge status={order.status} size="sm" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// RN-07: front desk only (the router keeps technicians out).
export function BudgetsPage() {
  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-2xl font-extrabold">Presupuestos</h1>
        <p className="text-sm text-muted">Arme cotizaciones y registre la respuesta del cliente.</p>
      </header>
      <Queue status="IN_DIAGNOSIS" title="Por presupuestar" description="Órdenes en diagnóstico, listas para cotizar." />
      <Queue status="BUDGETED" title="Esperando respuesta del cliente" description="Presupuestos enviados pendientes de aprobación." />
    </div>
  );
}
