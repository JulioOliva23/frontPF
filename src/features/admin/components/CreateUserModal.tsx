import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { toApiError } from '../../../shared/api/httpClient';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { Select } from '../../../shared/components/Select';
import { useToast } from '../../../shared/components/toast-context';
import { FormField } from '../../../shared/components/ui/form-field';
import { ROLE_LABELS } from '../../auth/config/role-routes';
import { useUserMutations } from '../hooks/use-admin';
import { createUserSchema, PASSWORD_HINT, ROLE_OPTIONS, type CreateUserFormInput, type CreateUserFormValues } from '../schemas/user-schemas';

const EMPTY: CreateUserFormInput = { username: '', fullName: '', role: 'TECHNICIAN', password: '', confirmPassword: '' };

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// US-F14: staff account creation (POST /users).
export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const { create } = useUserMutations();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormInput, unknown, CreateUserFormValues>({ resolver: zodResolver(createUserSchema), defaultValues: EMPTY });

  const close = () => {
    reset(EMPTY);
    create.reset();
    onClose();
  };

  const onSubmit = async ({ confirmPassword: _confirm, ...values }: CreateUserFormValues) => {
    try {
      const user = await create.mutateAsync(values);
      toast.success('Usuario creado', `${user.fullName} ya puede iniciar sesión como ${ROLE_LABELS[user.role].toLowerCase()}.`);
      close();
    } catch (error) {
      if (toApiError(error)?.isConflict) setError('username', { message: 'Ese nombre de usuario ya está en uso' });
    }
  };

  const serverError = create.error && !toApiError(create.error)?.isConflict ? (toApiError(create.error)?.message ?? 'No se pudo crear el usuario') : null;

  return (
    <Modal isOpen={isOpen} onClose={close} title="Nuevo usuario" subtitle="Cuenta del personal del servicio técnico" maxWidth="lg">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField id="user-full-name" label="Nombre completo" autoComplete="off" error={errors.fullName?.message} {...register('fullName')} />
          </div>
          <FormField
            id="user-username"
            label="Usuario"
            autoComplete="off"
            hint="Con este nombre inicia sesión"
            error={errors.username?.message}
            {...register('username')}
          />
          <Select id="user-role" label="Rol" options={ROLE_OPTIONS} error={errors.role?.message} {...register('role')} />
          <FormField
            id="user-password"
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            hint={PASSWORD_HINT}
            error={errors.password?.message}
            {...register('password')}
          />
          <FormField
            id="user-confirm-password"
            label="Repetir contraseña"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>
        {serverError && (
          <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-300">
            {serverError}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost-light" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Crear usuario
          </Button>
        </div>
      </form>
    </Modal>
  );
}
