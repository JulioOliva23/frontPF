import type { Budget, BudgetStatus, DecisionChannel } from '../../../shared/api/types';
import type { BadgeVariant } from '../../../shared/components/Badge';

export const BUDGET_STATUS_LABELS: Readonly<Record<BudgetStatus, string>> = {
  DRAFT: 'Borrador',
  SENT: 'Enviado',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  EXPIRED: 'Expirado',
  SUPERSEDED: 'Reemplazado',
};

export const BUDGET_STATUS_VARIANT: Readonly<Record<BudgetStatus, BadgeVariant>> = {
  DRAFT: 'slate',
  SENT: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'warning',
  SUPERSEDED: 'slate',
};

export const DECISION_CHANNELS: ReadonlyArray<{ value: DecisionChannel; label: string }> = [
  { value: 'IN_PERSON', label: 'En persona' },
  { value: 'PHONE', label: 'Teléfono' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Correo' },
];

export const LABOR_PRESETS = ['Micro-soldadura', 'Cambio de módulo / pantalla', 'Cambio de batería', 'Ensamblaje y limpieza', 'Diagnóstico de placa'] as const;

const DAY_MS = 86_400_000;

// SUP-04 / RN-08: "expired" is derived from expiresAt; the backend only marks
// EXPIRED when someone tries to decide it.
export function effectiveBudgetStatus(budget: Budget, now = Date.now()): BudgetStatus {
  const status = budget.status as BudgetStatus;
  return status === 'SENT' && new Date(budget.expiresAt).getTime() < now ? 'EXPIRED' : status;
}

export function daysUntilExpiry(budget: Budget, now = Date.now()): number {
  return Math.ceil((new Date(budget.expiresAt).getTime() - now) / DAY_MS);
}

// RN-15: client-side preview in integer cents. The authoritative total is the
// one returned by the backend (Prisma.Decimal).
export function toCents(value: string): number {
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(value)) return 0;
  const [whole, fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function centsToAmount(cents: number): string {
  return `${Math.trunc(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}
