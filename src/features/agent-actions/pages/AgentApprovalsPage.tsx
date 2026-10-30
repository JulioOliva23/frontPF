import { useEffect, useState } from 'react';
import { Bot, Radio } from 'lucide-react';
import { Link } from 'react-router';

import { toApiError } from '../../../shared/api/httpClient';
import type { AgentAction } from '../../../shared/api/types';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { useToast } from '../../../shared/components/toast-context';
import { WORK_ORDER_STATUS_LABELS } from '../../../shared/lib/work-order-status';
import { useAuth } from '../../auth/hooks/useAuth';
import { AgentApprovalModal } from '../components/AgentApprovalModal';
import { useAgentStreamStatus } from '../components/agent-stream-status';
import { useAgentActionDecision, useAgentActions } from '../hooks/use-agent-actions';
import { AGENT_ACTION_STATUS_LABELS, canApprove, canReject, formatOrderNumber, minutesLeft } from '../lib/agent-action-rules';

const STREAM_LABELS = { live: 'En vivo', connecting: 'Conectando…', offline: 'Sin conexión en vivo' } as const;
const STATUS_TONE = { PENDING: 'amber', EXECUTED: 'success', REJECTED: 'danger', EXPIRED: 'slate' } as const;

// Re-render every 30 s so the "vence en" countdown stays honest.
function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

// AG-01: what the AI agent proposed (through the MCP server) and is waiting
// for a person. Approving runs the transition as the current user.
export function AgentApprovalsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const streamStatus = useAgentStreamStatus();
  const now = useNow();
  const { data, isLoading, isError, refetch } = useAgentActions();
  const { approve, reject } = useAgentActionDecision();
  const [selected, setSelected] = useState<{ action: AgentAction; decision: 'approve' | 'reject' } | null>(null);

  const pending = data?.filter((action) => action.status === 'PENDING' && minutesLeft(action.expiresAt, now) > 0) ?? [];
  const decided = data?.filter((action) => !pending.includes(action)).slice(0, 10) ?? [];
  const mutation = selected?.decision === 'reject' ? reject : approve;

  const confirm = (note?: string) => {
    if (!selected) return;
    const { action, decision } = selected;
    mutation.mutate(
      { id: action.id, note },
      {
        onSuccess: () => {
          setSelected(null);
          if (decision === 'approve') toast.success(`${formatOrderNumber(action.workOrderNumber)} pasó a ${WORK_ORDER_STATUS_LABELS[action.to]}`);
          else toast.info('Propuesta rechazada');
        },
      },
    );
  };

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            <Bot className="h-6 w-6 text-lavender" aria-hidden="true" /> Aprobaciones del agente
          </h1>
          <p className="text-sm text-muted">Cambios de estado que el asistente de IA propuso. Nada se ejecuta sin tu confirmación.</p>
        </div>
        <span role="status" className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-muted">
          <Radio className={`h-3.5 w-3.5 ${streamStatus === 'live' ? 'text-mint' : 'text-muted'}`} aria-hidden="true" />
          {STREAM_LABELS[streamStatus]}
        </span>
      </header>

      {isLoading && <LoadingSkeleton />}
      {isError && <ErrorState message="No se pudieron cargar las propuestas." onRetry={() => void refetch()} />}
      {data && pending.length === 0 && (
        <EmptyState title="Sin propuestas pendientes" description="Cuando el agente proponga un cambio aparecerá aquí al instante." />
      )}

      <ul className="grid gap-3 md:grid-cols-2" aria-label="Propuestas pendientes">
        {pending.map((action) => (
          <li key={action.id} className="glass-card grid gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <Link to={`/ordenes/${action.workOrderId}`} className="font-bold hover:underline">
                {formatOrderNumber(action.workOrderNumber)}
              </Link>
              <span className="text-xs text-muted">vence en {minutesLeft(action.expiresAt, now)} min</span>
            </div>
            <p className="text-sm">
              {WORK_ORDER_STATUS_LABELS[action.from]} → <span className="font-bold text-mint">{WORK_ORDER_STATUS_LABELS[action.to]}</span>
            </p>
            <p className="text-sm text-ink-soft">{action.reason}</p>
            {action.lastError && <p className="text-xs text-amber-200">Último intento: {action.lastError}</p>}
            {user && (
              <div className="flex flex-wrap justify-end gap-2">
                {canReject(action, user) && (
                  <Button variant="ghost-light" size="sm" onClick={() => setSelected({ action, decision: 'reject' })}>
                    Rechazar
                  </Button>
                )}
                {canApprove(action, user) ? (
                  <Button size="sm" onClick={() => setSelected({ action, decision: 'approve' })}>
                    Revisar y aprobar
                  </Button>
                ) : (
                  <span className="self-center text-xs text-muted">La aprueba: {action.approverRoles.join(' o ')}</span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {decided.length > 0 && (
        <section aria-label="Decisiones recientes" className="grid gap-2">
          <h2 className="text-sm font-bold text-muted">Recientes</h2>
          <ul className="grid gap-2">
            {decided.map((action) => (
              <li key={action.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                <span>
                  {formatOrderNumber(action.workOrderNumber)} · {WORK_ORDER_STATUS_LABELS[action.from]} → {WORK_ORDER_STATUS_LABELS[action.to]}
                </span>
                <Badge variant={STATUS_TONE[action.status]} size="sm">
                  {AGENT_ACTION_STATUS_LABELS[action.status]}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AgentApprovalModal
        key={selected?.action.id ?? 'none'}
        action={selected?.action ?? null}
        decision={selected?.decision ?? 'approve'}
        isPending={mutation.isPending}
        error={mutation.isError ? (toApiError(mutation.error)?.message ?? 'No se pudo completar la acción') : undefined}
        onClose={() => {
          mutation.reset();
          setSelected(null);
        }}
        onConfirm={confirm}
      />
    </div>
  );
}
