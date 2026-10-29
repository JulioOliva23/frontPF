import { WORK_ORDER_STATUS_LABELS } from '../../../shared/lib/work-order-status';
import { useWorkOrderAudit } from '../hooks/use-work-orders';

const dateFormat = new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short' });

// US-F09 / RN-12: read-only, append-only history.
export function AuditTimeline({ workOrderId }: { workOrderId: string }) {
  const { data, isLoading, isError } = useWorkOrderAudit(workOrderId);

  return (
    <section aria-labelledby="audit-title" className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 id="audit-title" className="text-sm font-bold uppercase tracking-wide text-slate-500">
        Historial de estados
      </h2>
      {isLoading && <p className="mt-2 text-xs text-slate-500">Cargando…</p>}
      {isError && <p className="mt-2 text-xs text-red-700">No se pudo cargar el historial.</p>}
      {data?.length === 0 && <p className="mt-2 text-xs text-slate-500">Sin cambios de estado todavía.</p>}
      <ol className="mt-3 grid gap-3 border-l-2 border-slate-200 pl-4">
        {data?.map((entry) => (
          <li key={`${entry.createdAt}-${entry.newStatus}`} className="relative text-xs">
            <span className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full bg-cyan-500" aria-hidden="true" />
            <p className="font-bold text-slate-800">
              {WORK_ORDER_STATUS_LABELS[entry.previousStatus]} → {WORK_ORDER_STATUS_LABELS[entry.newStatus]}
            </p>
            <p className="text-slate-500">
              {entry.userName} · {dateFormat.format(new Date(entry.createdAt))}
            </p>
            {entry.reason && <p className="mt-0.5 text-slate-600">{entry.reason}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
