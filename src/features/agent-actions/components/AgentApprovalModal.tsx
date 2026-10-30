import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

import type { AgentAction } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { TextAreaField } from '../../../shared/components/ui/form-field';
import { WORK_ORDER_STATUS_LABELS } from '../../../shared/lib/work-order-status';
import { formatOrderNumber, requiresTypedConfirmation, STOCK_MOVING_TARGETS } from '../lib/agent-action-rules';

interface AgentApprovalModalProps {
  action: AgentAction | null;
  decision: 'approve' | 'reject';
  isPending: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (note?: string) => void;
}

// Human in the loop (AG-01): nothing runs until the person reads the agent's
// reason and confirms explicitly; irreversible targets also need the order
// number typed back, so a stray click cannot cancel or deliver a device.
export function AgentApprovalModal({ action, decision, isPending, error, onClose, onConfirm }: AgentApprovalModalProps) {
  const [reviewed, setReviewed] = useState(false);
  const [typed, setTyped] = useState('');
  const [note, setNote] = useState('');
  if (!action) return null;

  const approving = decision === 'approve';
  const orderNumber = formatOrderNumber(action.workOrderNumber);
  const needsTyping = approving && requiresTypedConfirmation(action);
  const typedOk = !needsTyping || typed.trim().toUpperCase() === orderNumber;
  const noteOk = note.trim() === '' || note.trim().length >= 3;
  const valid = (approving ? reviewed && typedOk : note.trim().length >= 3) && noteOk;

  const close = () => {
    setReviewed(false);
    setTyped('');
    setNote('');
    onClose();
  };

  return (
    <Modal isOpen onClose={close} title={approving ? `Aprobar cambio de la ${orderNumber}` : `Rechazar propuesta para la ${orderNumber}`} maxWidth="md">
      <div className="grid gap-4">
        <p className="text-sm">
          <span className="font-bold">{WORK_ORDER_STATUS_LABELS[action.from]}</span> → <span className="font-bold text-mint">{WORK_ORDER_STATUS_LABELS[action.to]}</span>
        </p>
        <blockquote className="rounded-xl border border-line bg-surface-raised p-3 text-sm text-ink-soft">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted">Justificación del agente</span>
          {action.reason}
        </blockquote>
        {approving && STOCK_MOVING_TARGETS.includes(action.to) && (
          <p className="text-xs text-amber-200">Este cambio mueve inventario: el Stock Guard reservará o descontará los repuestos del presupuesto (RN-09).</p>
        )}
        {action.lastError && (
          <p className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-xs text-amber-100">Último intento fallido: {action.lastError}</p>
        )}

        {approving && (
          <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 h-5 w-5" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} />
            <span>Revisé la orden y confirmo que este cambio es correcto. Quedará en la auditoría a mi nombre (RN-12).</span>
          </label>
        )}
        {needsTyping && (
          <label className="grid gap-1 text-sm">
            <span>
              Este cambio es irreversible para el cliente. Escribe <span className="font-mono font-bold">{orderNumber}</span> para confirmar.
            </span>
            <input
              aria-label="Número de orden para confirmar"
              className="min-h-[44px] rounded-xl border border-line bg-surface px-3 font-mono"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
            />
          </label>
        )}
        <TextAreaField
          id="agent-decision-note"
          label={approving ? 'Nota (opcional)' : 'Motivo del rechazo'}
          value={note}
          maxLength={300}
          onChange={(event) => setNote(event.target.value)}
        />

        {error && (
          <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost-light" onClick={close}>
            Volver
          </Button>
          <Button
            variant={approving ? 'primary' : 'danger'}
            leftIcon={approving ? <ShieldCheck className="h-4 w-4" aria-hidden="true" /> : undefined}
            disabled={!valid}
            isLoading={isPending}
            onClick={() => onConfirm(note.trim() || undefined)}
          >
            {approving ? 'Aprobar y ejecutar' : 'Rechazar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
