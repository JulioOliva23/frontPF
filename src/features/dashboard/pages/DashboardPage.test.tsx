import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { WorkOrderSummary } from '../../../shared/api/types';
import { sparePartFixture } from '../../../test/fixtures';
import { server } from '../../../test/msw-server';
import { api, renderRoutes } from '../../../test/render';
import { DashboardPage } from './DashboardPage';

const SUMMARY: WorkOrderSummary = {
  active: 7,
  overdue: 2,
  byStatus: [
    { status: 'RECEIVED', count: 4 },
    { status: 'BUDGETED', count: 3 },
    { status: 'DELIVERED', count: 10 },
  ],
};

function mockDashboard({ summary = SUMMARY, lowStock = 2 }: { summary?: WorkOrderSummary | 'error'; lowStock?: number } = {}) {
  server.use(
    http.get(api('/work-orders/summary'), () =>
      summary === 'error' ? HttpResponse.json({ statusCode: 500, message: 'boom' }, { status: 500 }) : HttpResponse.json(summary),
    ),
    http.get(api('/spare-parts/alerts/low-stock'), () =>
      HttpResponse.json(Array.from({ length: lowStock }, (_, index) => sparePartFixture({ id: `p${index}` }))),
    ),
  );
}

function renderDashboard() {
  return renderRoutes([{ path: '/', element: <DashboardPage /> }], { role: 'RECEPTIONIST', at: '/' });
}

const metric = (title: string) => {
  const card = screen.getByText(title).closest('a, div');
  if (!card) throw new Error(`metric ${title} not found`);
  return card as HTMLElement;
};

describe('DashboardPage', () => {
  it('shows the workload counters from the summary and the stock alerts [009/RF-1.1]', async () => {
    mockDashboard();
    renderDashboard();

    expect(await screen.findByText('7')).toBeInTheDocument();
    const indicators = screen.getByRole('region', { name: 'Indicadores' });
    expect(within(indicators).getByRole('link', { name: 'Ver órdenes activas' })).toHaveTextContent('7');
    expect(metric('OTs retrasadas')).toHaveTextContent('2');
    expect(within(indicators).getByRole('link', { name: 'Ver presupuestos por aprobar' })).toHaveTextContent('3');
    expect(await within(indicators).findByRole('link', { name: 'Ver repuestos con stock bajo' })).toHaveTextContent('2');
  });

  it('links to the filtered order list and to the inventory [009/RF-2.1] [009/RF-2.2] [009/RF-2.3]', async () => {
    mockDashboard();
    renderDashboard();
    await screen.findByText('7');

    expect(screen.getByRole('link', { name: 'Ver presupuestos por aprobar' })).toHaveAttribute('href', '/ordenes?status=BUDGETED');
    expect(screen.getByRole('link', { name: /presupuestos pendientes/i })).toHaveAttribute('href', '/ordenes?status=BUDGETED');
    expect(screen.getByRole('link', { name: /^inventario/i })).toHaveAttribute('href', '/inventario');
    expect(screen.getByRole('link', { name: 'Ver repuestos con stock bajo' })).toHaveAttribute('href', '/inventario/alertas');
  });

  it('lists every status with a link to its queue [009/RF-3.1]', async () => {
    mockDashboard();
    renderDashboard();
    const byStatus = await screen.findByRole('region', { name: 'Órdenes por estado' });
    expect(within(byStatus).getByRole('link', { name: /Ingresado\s*4/ })).toHaveAttribute('href', '/ordenes?status=RECEIVED');
  });

  it('offers a retry when the summary fails, keeping the stock counter [009/RF-4.1]', async () => {
    mockDashboard({ summary: 'error', lowStock: 5 });
    renderDashboard();
    expect(await screen.findByText('No se pudo cargar el resumen de órdenes.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    expect(await screen.findByText('5')).toBeInTheDocument();
  });
});

describe('DashboardPage details of the spec', () => {
  afterEach(() => vi.useRealTimers());

  it('shows a placeholder while loading and a dash when a figure cannot be obtained [009/RF-1.2]', async () => {
    mockDashboard({ summary: 'error' });
    renderDashboard();
    expect(within(metric('OTs activas')).getByText('…')).toBeInTheDocument();

    await screen.findByRole('button', { name: 'Reintentar' });
    expect(within(metric('OTs activas')).getByText('—')).toBeInTheDocument();
  });

  it('highlights late orders as an alert and pending budgets and low stock as a warning [009/RF-1.3]', async () => {
    mockDashboard();
    renderDashboard();
    await screen.findByText('Hola, Usuario');
    await vi.waitFor(() => expect(within(metric('OTs retrasadas')).getByText('2')).toHaveClass('text-red-300'));
    expect(within(metric('Presupuestos por aprobar')).getByText('3')).toHaveClass('text-amber-300');
    expect(within(metric('Stock bajo')).getByText('2')).toHaveClass('text-amber-300');
  });

  it('does not highlight anything when there is nothing to worry about [009/RF-1.3]', async () => {
    mockDashboard({ summary: { active: 1, overdue: 0, byStatus: [{ status: 'RECEIVED', count: 1 }] }, lowStock: 0 });
    renderDashboard();
    await vi.waitFor(() => expect(within(metric('OTs retrasadas')).getByText('0')).not.toHaveClass('text-red-300'));
    expect(within(metric('Stock bajo')).getByText('0')).not.toHaveClass('text-amber-300');
  });

  it('offers a prominent "Nuevo ingreso" shortcut [009/RF-2.4]', async () => {
    mockDashboard();
    renderDashboard();
    expect(await screen.findByRole('link', { name: /Nuevo ingreso/ })).toHaveAttribute('href', '/ordenes/nueva');
  });

  it('greets by first name and shows today in Spanish [009/RF-5.1]', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-29T15:00:00'));
    mockDashboard();
    renderDashboard();

    expect(await screen.findByText('Hola, Usuario')).toBeInTheDocument();
    const today = new Date('2026-10-29T15:00:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' });
    expect(screen.getByText(today)).toBeInTheDocument();
    expect(today).toContain('octubre');
  });
});
