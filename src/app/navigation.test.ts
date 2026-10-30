import { describe, expect, it } from 'vitest';

import { NAV_ITEMS, isItemActive, navItemsForRole } from './navigation';

const labels = (role: Parameters<typeof navItemsForRole>[0]) => navItemsForRole(role).map((item) => item.to);

describe('navigation RBAC (FE-07 / FE-08)', () => {
  it('hides budgets and inventory from technicians (RN-07)', () => {
    expect(labels('TECHNICIAN')).toEqual(['/ordenes']);
  });

  it('shows the full front desk menu to reception and admin', () => {
    for (const role of ['RECEPTIONIST', 'ADMIN'] as const) {
      expect(labels(role)).toEqual(expect.arrayContaining(['/ordenes', '/ordenes/nueva', '/presupuestos', '/inventario', '/inventario/alertas']));
    }
  });

  it('shows the Administración section to ADMIN only (US-F14)', () => {
    expect(labels('ADMIN')).toEqual(expect.arrayContaining(['/administracion/usuarios', '/administracion/modelos']));
    for (const role of ['RECEPTIONIST', 'TECHNICIAN', 'CUSTOMER'] as const) {
      expect(labels(role).some((to) => to.startsWith('/administracion'))).toBe(false);
    }
  });

  it('gives customers no staff links', () => {
    expect(labels('CUSTOMER')).toEqual([]);
  });

  it('does not highlight a parent item while on a sibling route', () => {
    const inventory = NAV_ITEMS.find((item) => item.to === '/inventario')!;
    const orders = NAV_ITEMS.find((item) => item.to === '/ordenes')!;
    expect(isItemActive(inventory, '/inventario/alertas', NAV_ITEMS)).toBe(false);
    expect(isItemActive(orders, '/ordenes/nueva', NAV_ITEMS)).toBe(false);
    expect(isItemActive(orders, '/ordenes/abc', NAV_ITEMS)).toBe(true);
  });
});
