import type { ReactNode } from 'react';
import { BellRing, ClipboardList, ClipboardPlus, FileText, Globe, Package } from 'lucide-react';

import type { UserRole } from '../shared/api/types';
import { FRONT_DESK_ROLES, STAFF_ROLES } from '../features/auth/config/role-routes';

export type NavSection = 'operacion' | 'gestion' | 'cliente';

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles: readonly UserRole[];
  section: NavSection;
}

// FE-07 / FE-08: same role groups as the router, so a link is visible only
// when its route lets the role in.
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/ordenes', label: 'Órdenes de trabajo', icon: <ClipboardList className="h-4 w-4" />, roles: STAFF_ROLES, section: 'operacion' },
  { to: '/ordenes/nueva', label: 'Recepción de equipo', icon: <ClipboardPlus className="h-4 w-4" />, roles: FRONT_DESK_ROLES, section: 'operacion' },
  { to: '/presupuestos', label: 'Presupuestos', icon: <FileText className="h-4 w-4" />, roles: FRONT_DESK_ROLES, section: 'gestion' },
  { to: '/inventario', label: 'Inventario', icon: <Package className="h-4 w-4" />, roles: FRONT_DESK_ROLES, section: 'gestion' },
  { to: '/inventario/alertas', label: 'Stock bajo', icon: <BellRing className="h-4 w-4" />, roles: FRONT_DESK_ROLES, section: 'gestion' },
  // Staff can open the public portal to check what a customer sees.
  { to: '/portal-cliente', label: 'Portal del cliente', icon: <Globe className="h-4 w-4" />, roles: FRONT_DESK_ROLES, section: 'cliente' },
];

export const NAV_SECTIONS: ReadonlyArray<{ id: NavSection; label: string }> = [
  { id: 'operacion', label: 'Operación' },
  { id: 'gestion', label: 'Gestión' },
  { id: 'cliente', label: 'Clientes' },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

// "/inventario" must not light up while on "/inventario/alertas", and
// "/ordenes" must not light up on "/ordenes/nueva" (they are separate items).
export function isItemActive(item: NavItem, pathname: string, items: readonly NavItem[]): boolean {
  if (pathname === item.to) return true;
  if (!pathname.startsWith(`${item.to}/`)) return false;
  return !items.some((other) => other !== item && other.to.startsWith(`${item.to}/`) && pathname.startsWith(other.to));
}
