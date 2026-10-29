import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { SparePart, UserRole } from '../shared/api/types';
import { sparePartFixture } from '../test/fixtures';
import { server } from '../test/msw-server';
import { api, renderRoutes } from '../test/render';
import { AppSidebar } from './app-sidebar';
import { navItemsForRole } from './navigation';

function mockLowStock(parts: SparePart[]) {
  let calls = 0;
  server.use(
    http.get(api('/spare-parts/alerts/low-stock'), () => {
      calls += 1;
      return HttpResponse.json(parts);
    }),
  );
  return { calls: () => calls };
}

function renderSidebar(role: UserRole) {
  return renderRoutes([{ path: '*', element: <AppSidebar items={navItemsForRole(role)} onLogout={() => undefined} /> }], { role, at: '/' });
}

const parts = (count: number) => Array.from({ length: count }, (_, index) => sparePartFixture({ id: `p${index}`, sku: `SKU-${index}` }));
const inventoryLink = () => screen.getByRole('link', { name: /^Inventario/ });

describe('AppSidebar low-stock badge (US-F13)', () => {
  it('shows the number of low-stock parts on the Inventario item', async () => {
    mockLowStock(parts(3));
    renderSidebar('RECEPTIONIST');
    expect(await within(inventoryLink()).findByLabelText('3 repuestos con stock bajo')).toHaveTextContent('3');
  });

  it('uses the singular for one part', async () => {
    mockLowStock(parts(1));
    renderSidebar('ADMIN');
    expect(await within(inventoryLink()).findByLabelText('1 repuesto con stock bajo')).toHaveTextContent('1');
  });

  it('caps long counts at 99+', async () => {
    mockLowStock(parts(120));
    renderSidebar('ADMIN');
    expect(await within(inventoryLink()).findByLabelText('120 repuestos con stock bajo')).toHaveTextContent('99+');
  });

  it('renders no badge when nothing is low', async () => {
    const lowStock = mockLowStock([]);
    renderSidebar('RECEPTIONIST');
    await waitFor(() => expect(lowStock.calls()).toBe(1));
    expect(within(inventoryLink()).queryByLabelText(/stock bajo/)).not.toBeInTheDocument();
  });

  it('renders no badge when the alert list cannot be loaded', async () => {
    let calls = 0;
    server.use(
      http.get(api('/spare-parts/alerts/low-stock'), () => {
        calls += 1;
        return HttpResponse.json({ statusCode: 500, message: 'boom' }, { status: 500 });
      }),
    );
    renderSidebar('RECEPTIONIST');
    await waitFor(() => expect(calls).toBe(1));
    expect(within(inventoryLink()).queryByLabelText(/stock bajo/)).not.toBeInTheDocument();
  });

  it('never asks technicians for stock alerts (RN-07)', async () => {
    const lowStock = mockLowStock(parts(3));
    renderSidebar('TECHNICIAN');
    expect(await screen.findByRole('link', { name: 'Órdenes de trabajo' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Inventario/ })).not.toBeInTheDocument();
    expect(lowStock.calls()).toBe(0);
  });
});
