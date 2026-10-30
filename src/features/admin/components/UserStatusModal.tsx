import { toApiError } from '../../../shared/api/httpClient';
import type { UserResponse } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/toast-context';
import { useUserMutations } from '../hooks/use-admin';

interface UserStatusModalProps {
  user: UserResponse | null;
  onClose: () => void;
}

// US-F14 / BE-18: confirm before (de)activating. Deactivation is logical: the
// account keeps its history and can be reactivated.
export function UserStatusModal({ user, onClose }: UserStatusModalProps) {
  const { activate, deactivate } = useUserMutations();
  const toast = useToast();
  const deactivating = user?.isActive ?? false;
  const mutation = deactivating ? deactivate : activate;

  const close = () => {
    activate.reset();
    deactivate.reset();
    onClose();
  };

  const confirm = async () => {
    if (!user) return;
    try {
      await mutation.mutateAsync(user.id);
      if (deactivating) toast.warning('Usuario desactivado', `${user.fullName} ya no puede iniciar sesión.`);
      else toast.success('Usuario reactivado', `${user.fullName} puede volver a iniciar sesión.`);
      close();
    } catch {
      // shown below from mutation.error
    }
  };

  return (
    <Modal isOpen={user !== null} onClose={close} title={deactivating ? 'Desactivar usuario' : 'Reactivar usuario'} maxWidth="sm">
      <div className="grid gap-4">
        <p className="text-sm text-muted">
          {deactivating ? (
            <>
              <strong className="text-ink">{user?.fullName}</strong> no podrá iniciar sesión. Sus órdenes, auditoría y movimientos se conservan, y
              puedes reactivarlo cuando quieras.
            </>
          ) : (
            <>
              <strong className="text-ink">{user?.fullName}</strong> podrá volver a iniciar sesión con su contraseña actual.
            </>
          )}
        </p>
        {mutation.error && (
          <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-300">
            {toApiError(mutation.error)?.message ?? 'No se pudo completar la acción'}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost-light" onClick={close}>
            Cancelar
          </Button>
          <Button type="button" variant={deactivating ? 'danger' : 'primary'} isLoading={mutation.isPending} onClick={() => void confirm()}>
            {deactivating ? 'Desactivar' : 'Reactivar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
