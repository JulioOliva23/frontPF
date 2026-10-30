import { useState } from 'react';
import { KeyRound } from 'lucide-react';

import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { useRegenerateTrackingCode } from '../hooks/use-work-orders';

// SUP-05: lost ticket. A new code invalidates the previous one.
export function TrackingCodePanel({ workOrderId }: { workOrderId: string }) {
  const regenerate = useRegenerateTrackingCode(workOrderId);
  const [confirming, setConfirming] = useState(false);

  return (
    <section aria-label="Código de seguimiento" className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Código de seguimiento</h2>
      {regenerate.data ? (
        <div className="mt-3 rounded-xl bg-surface-soft p-3 text-center text-white">
          <p className="font-mono text-2xl font-extrabold tracking-[0.2em]">{regenerate.data.trackingCode}</p>
          <p className="mt-1 text-[11px] text-ink-soft">Entréguelo al cliente ahora; no se volverá a mostrar.</p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">El código se entregó en el ticket de ingreso y no se puede volver a consultar.</p>
      )}
      <Button className="mt-3" variant="outline-light" size="sm" leftIcon={<KeyRound className="h-4 w-4" />} onClick={() => setConfirming(true)}>
        Generar nuevo código
      </Button>
      <Modal isOpen={confirming} onClose={() => setConfirming(false)} title="Generar nuevo código" maxWidth="md">
        <div className="grid gap-4">
          <p className="text-sm text-muted">El código anterior dejará de funcionar en el portal del cliente.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost-light" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button isLoading={regenerate.isPending} onClick={() => regenerate.mutate(undefined, { onSuccess: () => setConfirming(false) })}>
              Generar
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
