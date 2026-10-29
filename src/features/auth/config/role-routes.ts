import type { UserRole } from '../../../shared/api/types';

export const LOGIN_ROUTE = '/auth/login';

// Router state passed to the login: the route to return to and, when the
// session died on its own, why the user was sent there.
export interface LoginRedirectState {
  from?: string;
  reason?: 'session-expired';
}

export function readLoginRedirectState(state: unknown): LoginRedirectState {
  if (typeof state !== 'object' || state === null) return {};
  const { from, reason } = state as Record<string, unknown>;
  return {
    // Only in-app paths: never an absolute URL injected through history state.
    ...(typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && from !== LOGIN_ROUTE ? { from } : {}),
    ...(reason === 'session-expired' ? { reason } : {}),
  };
}

// FE-07: landing route of each role after login or when it hits a route it
// cannot access.
export const ROLE_DEFAULT_ROUTE: Readonly<Record<UserRole, string>> = {
  ADMIN: '/ordenes',
  RECEPTIONIST: '/ordenes',
  TECHNICIAN: '/ordenes',
  CUSTOMER: '/portal-cliente',
};

export const ROLE_LABELS: Readonly<Record<UserRole, string>> = {
  ADMIN: 'Administrador',
  RECEPTIONIST: 'Recepción',
  TECHNICIAN: 'Técnico',
  CUSTOMER: 'Cliente',
};

// Role groups shared by the router and the sidebar so both stay aligned (FE-08).
export const STAFF_ROLES: readonly UserRole[] = ['ADMIN', 'RECEPTIONIST', 'TECHNICIAN'];
// RN-07: budgets and inventory are hidden from technicians.
export const FRONT_DESK_ROLES: readonly UserRole[] = ['ADMIN', 'RECEPTIONIST'];
export const ADMIN_ONLY: readonly UserRole[] = ['ADMIN'];
