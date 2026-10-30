import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { toApiError } from '../../../shared/api/httpClient';
import type { UserResponse } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/toast-context';
import { FormField } from '../../../shared/components/ui/form-field';
import { useUserMutations } from '../hooks/use-admin';
import { PASSWORD_HINT, resetPasswordSchema, type ResetPasswordFormValues } from '../schemas/user-schemas';

const EMPTY: ResetPasswordFormValues = { password: '', confirmPassword: '' };

interface ResetPasswordModalProps {
  user: UserResponse | null;
  onClose: () => void;
}

// US-F14: the admin sets a new password (POST /users/:id/password). The
// user's previous sessions stop renewing (AuthService.refresh).
export function ResetPasswordModal({ user, onClose }: ResetPasswordModalProps) {
  const { resetPassword } = useUserMutations();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: EMPTY });

  const close = () => {
    reset(EMPTY);
    resetPassword.reset();
    onClose();
  };

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!user) return;
    try {
      await resetPassword.mutateAsync({ id: user.id, password: values.password });
      toast.success('Contraseña restablecida', `Comunica la nueva contraseña a ${user.fullName} por un canal seguro.`);
      close();
    } catch {
      // shown below from resetPassword.error
    }
  };

  return (
    <Modal isOpen={user !== null} onClose={close} title="Restablecer contraseña" subtitle={user ? `${user.fullName} · @${user.username}` : undefined} maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormField
          id="reset-password"
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          hint={PASSWORD_HINT}
          error={errors.password?.message}
          {...register('password')}
        />
        <FormField
          id="reset-confirm-password"
          label="Repetir contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <p className="rounded-xl bg-amber-400/10 p-3 text-xs text-amber-300">Las sesiones abiertas de este usuario dejarán de funcionar en los próximos minutos.</p>
        {resetPassword.error && (
          <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-300">
            {toApiError(resetPassword.error)?.message ?? 'No se pudo restablecer la contraseña'}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost-light" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Restablecer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
