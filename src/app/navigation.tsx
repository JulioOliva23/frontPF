import type { ReactNode } from 'react';
import { BellRing, Bot, ClipboardList, ClipboardPlus, FileText, Globe, LayoutDashboard, Package, Smartphone, UsersRound } from 'lucide-react';

import type { UserRole } from '../shared/api/types';
import { ADMIN_ONLY, FRONT_DESK_ROLES, STAFF_ROLES } from '../features/auth/config/role-routes';

export type NavSection = 'operacion' | 'gestion' | 'cliente' | 'administracion';

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles: readonly UserRole[];
  section: NavSection;
  // Live counter rendered next to the label (see app-sidebar.tsx).
  badge?: NavBadge;
}

export type NavBadge = 'low-stock' | 'agent-actions';

// FE-07 / FE-08: same role groups as the router, so a link is visible only
// when its route lets the role in.
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Panel', icon: <LayoutDashboard className="h-4 w-4" />, roles: FRONT_DESK_ROLES, section: 'operacion' },
  { to: '/ordenes', label: 'Órdenes de trabajo', icon: <ClipboardList className="h-4 w-4" />, roles: STAFF_ROLES, section: 'operacion' },
  // AG-01: AI agent proposals waiting for a person.
  { to: '/aprobaciones', label: 'Aprobaciones IA', icon: <Bot className="h-4 w-4" />, roles: STAFF_ROLES, section: 'operacion', badge: 'agent-actions' },
  { to: '/ordenes/nueva', label: 'Recepción de equipo', icon: <ClipboardPlus className="h-4 w-4" />, roles: FRONT_DESK_ROLES, section: 'operacion' },
  { to: '/presupuestos', label: 'Presupuestos', icon: <FileText className="h-4 w-4" />, roles: FRONT_DESK_ROLES, section: 'gestion' },
  // US-F13 / RN-11: parts at or below their minimum stock.
  { to: '/inventario', label: 'Inventario', icon: <Package className="h-4 w-4" />, roles: FRONT_DESK_ROLES, section: 'gestion', badge: 'low-stock' },
  { to: '/inventario/alertas', label: 'Stock bajo', icon: <BellRing className="h-4 w-4" />, roles: FRONT_DESK_ROLES, section: 'gestion' },
  // Staff can open the public portal to check what a customer sees.
  { to: '/portal-cliente', label: 'Portal del cliente', icon: <Globe className="h-4 w-4" />, roles: FRONT_DESK_ROLES, section: 'cliente' },
  // US-F14: ADMIN only, same group as the /administracion RoleGuard.
  { to: '/administracion/usuarios', label: 'Usuarios', icon: <UsersRound className="h-4 w-4" />, roles: ADMIN_ONLY, section: 'administracion' },
  { to: '/administracion/modelos', label: 'Modelos de equipos', icon: <Smartphone className="h-4 w-4" />, roles: ADMIN_ONLY, section: 'administracion' },
];

export const NAV_SECTIONS: ReadonlyArray<{ id: NavSection; label: string }> = [
  { id: 'operacion', label: 'Operación' },
  { id: 'gestion', label: 'Gestión' },
  { id: 'cliente', label: 'Clientes' },
  { id: 'administracion', label: 'Administración' },
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
