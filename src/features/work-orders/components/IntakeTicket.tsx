import { Printer } from 'lucide-react';

import type { CreatedWorkOrder } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { formatWorkOrderNumber } from '../../../shared/lib/tracking-code';

interface IntakeTicketProps {
  order: CreatedWorkOrder;
  onNewIntake: () => void;
  onOpenOrder: () => void;
}

// SUP-05 / FE-17: the tracking code comes back only once, in the creation
// response; this is the only screen that shows it. Printable.
export function IntakeTicket({ order, onNewIntake, onOpenOrder }: IntakeTicketProps) {
  return (
    <section aria-labelledby="ticket-title" className="mx-auto max-w-md">
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 print:border-slate-900">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-500">Ticket de ingreso</p>
        <h2 id="ticket-title" className="mt-1 text-center text-3xl font-extrabold tracking-wide text-slate-900">
          {formatWorkOrderNumber(order.number)}
        </h2>
        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-500">Cliente</dt>
          <dd className="font-semibold">{order.customer.name}</dd>
          <dt className="text-slate-500">Equipo</dt>
          <dd className="font-semibold">
            {order.device.brand} {order.device.model}
            {order.device.color ? ` · ${order.device.color}` : ''}
          </dd>
          <dt className="text-slate-500">IMEI</dt>
          <dd className="font-mono">{order.device.imei}</dd>
          <dt className="text-slate-500">Problema</dt>
          <dd>{order.reportedProblem}</dd>
          {order.promisedAt && (
            <>
              <dt className="text-slate-500">Entrega estimada</dt>
              <dd>{new Date(order.promisedAt).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })}</dd>
            </>
          )}
        </dl>
        <div className="mt-6 rounded-xl bg-slate-900 p-4 text-center text-white">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Código de seguimiento</p>
          <p className="mt-1 font-mono text-3xl font-extrabold tracking-[0.2em]" data-testid="tracking-code">
            {order.trackingCode}
          </p>
          <p className="mt-2 text-[11px] text-slate-300">Consulte el estado en /portal-cliente con el número de orden y este código.</p>
        </div>
        <p className="mt-3 text-center text-[11px] text-slate-500">Este código no es el PIN de su celular.</p>
      </div>
      <p role="note" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800 print:hidden">
        Imprima o entregue el ticket ahora: el código de seguimiento no se volverá a mostrar. Si se pierde, regenérelo desde el detalle de la orden.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <Button leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
          Imprimir ticket
        </Button>
        <Button variant="outline-light" onClick={onOpenOrder}>
          Ver orden
        </Button>
        <Button variant="ghost-light" onClick={onNewIntake}>
          Nuevo ingreso
        </Button>
      </div>
    </section>
  );
}
