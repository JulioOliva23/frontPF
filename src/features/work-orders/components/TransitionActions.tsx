import { useState } from 'react';

import { toApiError } from '../../../shared/api/httpClient';
import type { WorkOrder, WorkOrderStatus } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { TextAreaField } from '../../../shared/components/ui/form-field';
import { useToast } from '../../../shared/components/toast-context';
import { TRANSITION_ACTION_LABELS, WORK_ORDER_STATUS_LABELS } from '../../../shared/lib/work-order-status';
import { useTransitionWorkOrder } from '../hooks/use-work-orders';
import { visibleTransitions } from '../lib/visible-transitions';
import { StockGuardBanner } from './StockGuardBanner';

// FE-08: buttons come from the backend's allowedTransitions for this viewer.
export function TransitionActions({ order }: { order: WorkOrder }) {
  const transition = useTransitionWorkOrder(order.id);
  const toast = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const actions = visibleTransitions(order);
  const error = toApiError(transition.error);

  const run = (to: WorkOrderStatus, withReason?: string) =>
    transition.mutate(
      { to, reason: withReason },
      {
        onSuccess: () => {
          setCancelling(false);
          toast.success(`Orden en "${WORK_ORDER_STATUS_LABELS[to]}"`);
        },
        onError: (caught) => {
          const apiError = toApiError(caught);
          if (apiError?.statusCode === 409) toast.warning('La orden cambió mientras tanto', 'Se actualizó la vista con el estado real.');
        },
      },
    );

  if (actions.length === 0) return null;

  return (
    <section aria-label="Acciones de estado" className="grid gap-3">
      {error?.isInsufficientStock && <StockGuardBanner sparePartIds={error.sparePartIds} />}
      {error && !error.isInsufficientStock && error.statusCode !== 409 && (
        <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-300">
          {error.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {actions.map((to) =>
          to === 'CANCELLED' ? (
            <Button key={to} variant="danger" onClick={() => setCancelling(true)} disabled={transition.isPending}>
              {TRANSITION_ACTION_LABELS[to]}
            </Button>
          ) : (
            <Button key={to} onClick={() => run(to)} isLoading={transition.isPending && transition.variables?.to === to} disabled={transition.isPending}>
              {order.status === 'QUALITY_CONTROL' && to === 'IN_REPAIR' ? 'Devolver a reparación (no pasó control)' : TRANSITION_ACTION_LABELS[to]}
            </Button>
          ),
        )}
      </div>

      <Modal isOpen={cancelling} onClose={() => setCancelling(false)} title="Cancelar orden" maxWidth="md">
        <div className="grid gap-4">
          <TextAreaField id="cancel-reason" label="Motivo" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost-light" onClick={() => setCancelling(false)}>
              Volver
            </Button>
            <Button variant="danger" disabled={reason.trim().length < 3} isLoading={transition.isPending} onClick={() => run('CANCELLED', reason.trim())}>
              Confirmar cancelación
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
