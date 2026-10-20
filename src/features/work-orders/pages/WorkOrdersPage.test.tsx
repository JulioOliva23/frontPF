import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../../test/msw-server';
import { api, renderWithProviders } from '../../../test/render';
import { pageOf, workOrderFixture } from '../../../test/fixtures';
import { WorkOrdersPage } from './WorkOrdersPage';

const ORDERS = [
  workOrderFixture(),
  workOrderFixture({ id: 'o2', number: 124, status: 'RECEIVED', statusLabel: 'Ingresado', technician: null, device: { ...workOrderFixture().device, brand: 'Samsung', model: 'Galaxy S23' } }),
];

describe('WorkOrdersPage (US-F02)', () => {
  it('lists orders in a table and filters by status', async () => {
    const seen: Array<string | null> = [];
    server.use(
      http.get(api('/work-orders'), ({ request }) => {
        const status = new URL(request.url).searchParams.get('status');
        seen.push(status);
        return HttpResponse.json(status === 'CANCELLED' ? pageOf([]) : pageOf(ORDERS));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<WorkOrdersPage />, { role: 'RECEPTIONIST' });

    expect(screen.getByText('Todas las órdenes del servicio')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Nuevo ingreso/ })).toHaveAttribute('href', '/ordenes/nueva');
    const row = (await screen.findByRole('link', { name: 'OT-000124' })).closest('tr')!;
    expect(within(row).getByText('Samsung Galaxy S23')).toBeInTheDocument();
    expect(within(row).getByText('—')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Cancelado' }));
    expect(await screen.findByText('No hay órdenes en este estado.')).toBeInTheDocument();
    expect(seen).toContain('CANCELLED');
  });

  it('shows technicians only their orders and hides the intake button (RN-06)', async () => {
    server.use(http.get(api('/work-orders'), () => HttpResponse.json(pageOf([]))));
    renderWithProviders(<WorkOrdersPage />, { role: 'TECHNICIAN' });

    expect(screen.getByText('Tus órdenes asignadas')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Nuevo ingreso/ })).not.toBeInTheDocument();
    expect(await screen.findByText('Todavía no hay órdenes registradas.')).toBeInTheDocument();
  });

  it('shows an error state with retry', async () => {
    let calls = 0;
    server.use(
      http.get(api('/work-orders'), () => {
        calls += 1;
        return calls === 1 ? HttpResponse.json({ statusCode: 500, message: 'boom' }, { status: 500 }) : HttpResponse.json(pageOf(ORDERS));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<WorkOrdersPage />);

    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('link', { name: 'OT-000123' })).toBeInTheDocument();
  });

  it('switches to the board with one column per status', async () => {
    server.use(
      http.get(api('/work-orders'), ({ request }) => {
        const status = new URL(request.url).searchParams.get('status');
        if (status === 'APPROVED') return HttpResponse.json(pageOf([ORDERS[0]], 1, 20, 25));
        if (status === 'RECEIVED') return HttpResponse.json(pageOf([ORDERS[1]]));
        if (status === 'CANCELLED') return HttpResponse.json({ statusCode: 500, message: 'boom' }, { status: 500 });
        return HttpResponse.json(pageOf([]));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<WorkOrdersPage />);

    await user.click(screen.getByRole('radio', { name: 'Tablero' }));
    const approved = await screen.findByRole('region', { name: 'Aprobado' });
    expect(await within(approved).findByText('OT-000123')).toBeInTheDocument();
    expect(within(approved).getByText('Técnico: Técnico Uno')).toBeInTheDocument();
    expect(within(approved).getByText('y 5 más (use la vista de tabla)')).toBeInTheDocument();
    const received = screen.getByRole('region', { name: 'Ingresado' });
    expect(await within(received).findByText('Sin técnico asignado')).toBeInTheDocument();
    await waitFor(() => expect(within(screen.getByRole('region', { name: 'Entregado' })).getByText('Sin órdenes')).toBeInTheDocument());
    expect(await within(screen.getByRole('region', { name: 'Cancelado' })).findByText('No se pudo cargar')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Ingresado' }));
    await waitFor(() => expect(screen.getAllByRole('region')).toHaveLength(1));
  });
});
