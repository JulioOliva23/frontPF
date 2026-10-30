import { useState } from 'react';

import type { DecisionChannel } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { Select } from '../../../shared/components/Select';
import { TextAreaField } from '../../../shared/components/ui/form-field';
import { DECISION_CHANNELS } from '../lib/budget-status';

interface BudgetDecisionModalProps {
  decision: 'approve' | 'reject' | null;
  isPending: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (channel: DecisionChannel, reason: string) => void;
}

// RN-05: the customer's explicit answer, with the channel used.
export function BudgetDecisionModal({ decision, isPending, error, onClose, onConfirm }: BudgetDecisionModalProps) {
  const [channel, setChannel] = useState<DecisionChannel | ''>('');
  const [reason, setReason] = useState('');
  const rejecting = decision === 'reject';
  const valid = channel !== '' && (!rejecting || reason.trim().length >= 3);

  return (
    <Modal isOpen={decision !== null} onClose={onClose} title={rejecting ? 'Registrar rechazo del cliente' : 'Registrar aprobación del cliente'} maxWidth="md">
      <div className="grid gap-4">
        <Select
          id="decision-channel"
          label="¿Por qué medio respondió el cliente?"
          placeholder="Seleccione"
          value={channel}
          onChange={(event) => setChannel(event.target.value as DecisionChannel | '')}
          options={DECISION_CHANNELS}
        />
        {rejecting && (
          <TextAreaField id="reject-reason" label="Motivo del rechazo" value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} />
        )}
        <p className="text-xs text-muted">
          {rejecting ? 'La orden pasará a "Cancelado" y el equipo quedará listo para devolverse.' : 'La orden pasará a "Aprobado" y el técnico podrá iniciar la reparación.'}
        </p>
        {error && (
          <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost-light" onClick={onClose}>
            Volver
          </Button>
          <Button variant={rejecting ? 'danger' : 'primary'} disabled={!valid} isLoading={isPending} onClick={() => channel && onConfirm(channel, reason.trim())}>
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
