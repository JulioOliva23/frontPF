import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { toApiError } from '../../../shared/api/httpClient';
import type { UserResponse } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { Select } from '../../../shared/components/Select';
import { useToast } from '../../../shared/components/toast-context';
import { FormField } from '../../../shared/components/ui/form-field';
import { ROLE_LABELS } from '../../auth/config/role-routes';
import { useUserMutations } from '../hooks/use-admin';
import { isStaffRole, ROLE_OPTIONS, updateUserSchema, type UpdateUserFormValues } from '../schemas/user-schemas';

interface EditUserModalProps {
  user: UserResponse | null;
  // The signed-in admin: their own role is locked (the backend refuses it too).
  isSelf: boolean;
  onClose: () => void;
}

// US-F14: name and role (PATCH /users/:id). Username is permanent and a
// CUSTOMER account keeps its role (RN-14).
export function EditUserModal({ user, isSelf, onClose }: EditUserModalProps) {
  const { update } = useUserMutations();
  const toast = useToast();
  const roleLocked = isSelf || (user !== null && !isStaffRole(user.role));
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    values: user ? { fullName: user.fullName, ...(roleLocked || !isStaffRole(user.role) ? {} : { role: user.role }) } : undefined,
  });

  const close = () => {
    update.reset();
    onClose();
  };

  const onSubmit = async (values: UpdateUserFormValues) => {
    if (!user) return;
    const payload = roleLocked || !values.role ? { fullName: values.fullName } : values;
    try {
      const saved = await update.mutateAsync({ id: user.id, payload });
      toast.success('Usuario actualizado', `${saved.fullName} · ${ROLE_LABELS[saved.role]}`);
      close();
    } catch {
      // shown below from update.error
    }
  };

  return (
    <Modal isOpen={user !== null} onClose={close} title="Editar usuario" subtitle={user ? `@${user.username}` : undefined} maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormField id="edit-full-name" label="Nombre completo" error={errors.fullName?.message} {...register('fullName')} />
        {user && !roleLocked ? (
          <Select id="edit-role" label="Rol" options={ROLE_OPTIONS} error={errors.role?.message} {...register('role')} />
        ) : (
          user && (
            <div className="grid gap-1">
              <span className="text-xs font-bold text-ink-soft">Rol</span>
              <p className="text-sm text-ink">{ROLE_LABELS[user.role]}</p>
              <p className="text-xs text-muted">
                {isSelf ? 'No puedes cambiar tu propio rol.' : 'Las cuentas de cliente mantienen su rol: están vinculadas a un cliente.'}
              </p>
            </div>
          )
        )}
        <p className="rounded-xl bg-surface-soft p-3 text-xs text-muted">
          {isSelf
            ? 'Al guardar, tendrás que volver a iniciar sesión en los próximos minutos.'
            : 'Al guardar, este usuario tendrá que volver a iniciar sesión en los próximos minutos.'}
        </p>
        {update.error && (
          <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-300">
            {toApiError(update.error)?.message ?? 'No se pudo guardar'}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost-light" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}
