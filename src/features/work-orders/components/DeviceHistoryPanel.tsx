import { History } from 'lucide-react';

import type { DeviceHistory } from '../../../shared/api/types';
import { formatWorkOrderNumber } from '../../../shared/lib/tracking-code';
import { WorkOrderStatusBadge } from './WorkOrderStatusBadge';

interface DeviceHistoryPanelProps {
  history: DeviceHistory | null | undefined;
  isLoading: boolean;
}

// RN-13: previous repairs shown as soon as a valid IMEI is typed.
export function DeviceHistoryPanel({ history, isLoading }: DeviceHistoryPanelProps) {
  if (isLoading) return <p className="text-xs text-muted">Buscando historial del equipo…</p>;
  if (history === undefined) return null;
  if (history === null) {
    return <p className="rounded-xl border border-dashed border-line bg-surface p-3 text-xs text-muted">Este IMEI no registra reparaciones previas.</p>;
  }

  return (
    <section aria-label="Historial del equipo" className="rounded-xl border border-sky-400/25 bg-sky-400/10 p-3">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-mint">
        <History className="h-4 w-4" aria-hidden="true" />
        Equipo conocido: {history.deviceModel.brand} {history.deviceModel.model} · {history.repairs.length} reparación(es) previa(s)
      </h3>
      <ul className="grid gap-2">
        {history.repairs.slice(0, 5).map((repair) => (
          <li key={repair.workOrderId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-xs">
            <span className="font-bold text-ink">{formatWorkOrderNumber(repair.number)}</span>
            <span className="min-w-0 flex-1 truncate text-muted">{repair.reportedProblem}</span>
            <WorkOrderStatusBadge status={repair.status} size="sm" />
          </li>
        ))}
      </ul>
    </section>
  );
}
