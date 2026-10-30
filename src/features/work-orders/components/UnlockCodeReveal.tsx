import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';

import { toApiError } from '../../../shared/api/httpClient';
import type { LockType, UnlockCodeResponse } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { workOrdersApi } from '../api/work-orders-api';

export const REVEAL_DURATION_SECONDS = 30;

interface UnlockCodeRevealProps {
  workOrderId: string;
  lockType: LockType;
  canReveal: boolean;
}

const LOCK_LABELS: Record<LockType, string> = { NONE: 'Sin bloqueo', PIN: 'PIN', PATTERN: 'Patrón', PASSWORD: 'Contraseña' };

// FE-14 / RN-03: masked by default. Each reveal is a fresh call to the audited
// endpoint (no React Query cache), lives only in component state and is wiped
// after 30 s, when the tab is hidden, or on unmount.
export function UnlockCodeReveal({ workOrderId, lockType, canReveal }: UnlockCodeRevealProps) {
  const [confirming, setConfirming] = useState(false);
  const [revealed, setRevealed] = useState<UnlockCodeResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRevealed(null);
    setSecondsLeft(0);
  }, []);

  useEffect(() => {
    const onVisibility = () => document.visibilityState === 'hidden' && hide();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (timer.current) clearInterval(timer.current);
    };
  }, [hide]);

  const reveal = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await workOrdersApi.revealUnlockCode(workOrderId);
      setConfirming(false);
      setRevealed(result);
      setSecondsLeft(REVEAL_DURATION_SECONDS);
      timer.current = setInterval(() => {
        setSecondsLeft((current) => {
          if (current <= 1) {
            hide();
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    } catch (caught) {
      setError(toApiError(caught)?.message ?? 'No se pudo revelar el código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="unlock-title" className="rounded-2xl border border-line bg-surface p-4">
      <h2 id="unlock-title" className="text-sm font-bold uppercase tracking-wide text-muted">
        Código de desbloqueo · {LOCK_LABELS[lockType]}
      </h2>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-2xl font-bold tracking-[0.3em]" aria-live="polite" data-testid="unlock-code-value">
          {revealed ? revealed.unlockCode : '••••••'}
        </p>
        {revealed ? (
          <Button variant="outline-light" size="sm" leftIcon={<EyeOff className="h-4 w-4" />} onClick={hide}>
            Ocultar ({secondsLeft}s)
          </Button>
        ) : (
          canReveal && (
            <Button variant="outline-light" size="sm" leftIcon={<Eye className="h-4 w-4" />} onClick={() => setConfirming(true)}>
              Revelar código
            </Button>
          )
        )}
      </div>
      {!canReveal && <p className="mt-2 text-xs text-muted">Solo el técnico asignado o un administrador pueden revelarlo.</p>}
      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-red-300">
          {error}
        </p>
      )}

      <Modal isOpen={confirming} onClose={() => setConfirming(false)} title="Revelar código de desbloqueo" maxWidth="md">
        <div className="grid gap-4">
          <p className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-300">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            Este acceso quedará registrado con tu usuario y la hora. El código se ocultará solo en {REVEAL_DURATION_SECONDS} segundos.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost-light" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void reveal()} isLoading={loading}>
              Revelar y registrar acceso
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
