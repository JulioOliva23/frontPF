import { WORK_ORDER_STATUS_LABELS } from '../../../shared/lib/work-order-status';
import { useWorkOrderAudit } from '../hooks/use-work-orders';

const dateFormat = new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short' });

// US-F09 / RN-12: read-only, append-only history.
export function AuditTimeline({ workOrderId }: { workOrderId: string }) {
  const { data, isLoading, isError } = useWorkOrderAudit(workOrderId);

  return (
    <section aria-labelledby="audit-title" className="rounded-2xl border border-line bg-surface p-4">
      <h2 id="audit-title" className="text-sm font-bold uppercase tracking-wide text-muted">
        Historial de estados
      </h2>
      {isLoading && <p className="mt-2 text-xs text-muted">Cargando…</p>}
      {isError && <p className="mt-2 text-xs text-red-300">No se pudo cargar el historial.</p>}
      {data?.length === 0 && <p className="mt-2 text-xs text-muted">Sin cambios de estado todavía.</p>}
      <ol className="mt-3 grid gap-3 border-l-2 border-line pl-4">
        {data?.map((entry) => (
          <li key={`${entry.createdAt}-${entry.newStatus}`} className="relative text-xs">
            <span className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full bg-mint" aria-hidden="true" />
            <p className="font-bold text-ink">
              {WORK_ORDER_STATUS_LABELS[entry.previousStatus]} → {WORK_ORDER_STATUS_LABELS[entry.newStatus]}
            </p>
            <p className="text-muted">
              {entry.userName} · {dateFormat.format(new Date(entry.createdAt))}
            </p>
            {entry.reason && <p className="mt-0.5 text-muted">{entry.reason}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
