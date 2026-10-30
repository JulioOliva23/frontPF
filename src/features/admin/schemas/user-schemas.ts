import { z } from 'zod';

import type { UserRole } from '../../../shared/api/types';
import { ROLE_LABELS } from '../../auth/config/role-routes';

// Roles an admin can create or assign here. CUSTOMER accounts need a customer
// record (RN-14) and are not managed from this screen.
export const STAFF_ROLE_OPTIONS = ['ADMIN', 'RECEPTIONIST', 'TECHNICIAN'] as const satisfies readonly UserRole[];
export type StaffRole = (typeof STAFF_ROLE_OPTIONS)[number];
export const ROLE_OPTIONS = STAFF_ROLE_OPTIONS.map((role) => ({ value: role, label: ROLE_LABELS[role] }));

export function isStaffRole(role: UserRole): role is StaffRole {
  return (STAFF_ROLE_OPTIONS as readonly string[]).includes(role);
}

// FE-11: mirrors CreateUserDto / ResetPasswordDto.
export const PASSWORD_HINT = 'Mínimo 10 caracteres, con una minúscula, una mayúscula y un número.';

const password = z
  .string()
  .min(10, 'Mínimo 10 caracteres')
  .max(128, 'Máximo 128 caracteres')
  .regex(/[a-z]/, 'Debe incluir una minúscula')
  .regex(/[A-Z]/, 'Debe incluir una mayúscula')
  .regex(/\d/, 'Debe incluir un número');

const fullName = z.string().trim().min(3, 'Mínimo 3 caracteres').max(150, 'Máximo 150 caracteres');
const role = z.enum(STAFF_ROLE_OPTIONS, { message: 'Seleccione un rol' });

const passwordsMatch = (values: { password: string; confirmPassword: string }) => values.password === values.confirmPassword;
const PASSWORDS_MISMATCH = { path: ['confirmPassword'], message: 'Las contraseñas no coinciden' };

export const createUserSchema = z
  .object({
    username: z
      .string()
      .trim()
      .transform((value) => value.toLowerCase())
      .pipe(z.string().regex(/^[a-z0-9._-]{3,80}$/, 'De 3 a 80 caracteres: letras, números, punto, guion o guion bajo')),
    fullName,
    role,
    password,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, PASSWORDS_MISMATCH);

// Role is left out when it cannot change (own account, CUSTOMER accounts).
export const updateUserSchema = z.object({ fullName, role: role.optional() });

export const resetPasswordSchema = z.object({ password, confirmPassword: z.string() }).refine(passwordsMatch, PASSWORDS_MISMATCH);

export type CreateUserFormInput = z.input<typeof createUserSchema>;
export type CreateUserFormValues = z.output<typeof createUserSchema>;
export type UpdateUserFormValues = z.output<typeof updateUserSchema>;
export type ResetPasswordFormValues = z.output<typeof resetPasswordSchema>;
