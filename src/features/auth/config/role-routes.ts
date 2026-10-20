import type { UserRole } from '../../../shared/api/types';

export const LOGIN_ROUTE = '/auth/login';

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
