import type { AgentAction, UserRole, WorkOrderStatus } from '../../../shared/api/types';

// Mirrors AG-04 in the backend for conditional rendering only; the API
// re-checks every decision (FE-08).
export function canApprove(action: AgentAction, user: { id: string; role: UserRole }): boolean {
  return action.status === 'PENDING' && action.requestedBy.id !== user.id && action.approverRoles.includes(user.role);
}

export function canReject(action: AgentAction, user: { id: string; role: UserRole }): boolean {
  return action.status === 'PENDING' && action.requestedBy.id !== user.id;
}

// Irreversible for the customer: the person types the order number to confirm.
export const IRREVERSIBLE_TARGETS: readonly WorkOrderStatus[] = ['DELIVERED', 'CANCELLED'];

export function requiresTypedConfirmation(action: Pick<AgentAction, 'to'>): boolean {
  return IRREVERSIBLE_TARGETS.includes(action.to);
}

// Statuses whose transition moves stock (Stock Guard, RN-09).
export const STOCK_MOVING_TARGETS: readonly WorkOrderStatus[] = ['IN_REPAIR', 'QUALITY_CONTROL'];

export function formatOrderNumber(number: number): string {
  return `OT-${String(number).padStart(6, '0')}`;
}

export function minutesLeft(expiresAt: string, now: number): number {
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 60_000));
}

export const AGENT_ACTION_STATUS_LABELS: Readonly<Record<AgentAction['status'], string>> = {
  PENDING: 'Pendiente',
  EXECUTED: 'Ejecutada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
};

// Keeps a list sorted newest first after inserting or replacing one proposal.
export function upsertAction(list: readonly AgentAction[] | undefined, action: AgentAction): AgentAction[] {
  const others = (list ?? []).filter((item) => item.id !== action.id);
  return [action, ...others].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
