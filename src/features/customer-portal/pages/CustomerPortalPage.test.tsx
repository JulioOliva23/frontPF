import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../../../test/msw-server';
import { CustomerOrderStatus } from '../components/CustomerOrderStatus';
import { api, renderRoutes, renderWithProviders } from '../../../test/render';
import { customerStatusFixture } from '../../../test/fixtures';
import { CustomerPortalPage } from './CustomerPortalPage';

const renderPortal = (options: Parameters<typeof renderWithProviders>[1]) =>
  renderWithProviders(<CustomerPortalPage />, {
    route: '/portal-cliente',
    path: '/portal-cliente',
    extraRoutes: <Route path="/auth/login" element={<p>Pantalla de login</p>} />,
    ...options,
  });

describe('CustomerPortalPage (US-F10 / SUP-05)', () => {
  it('looks up one order anonymously and lets the visitor search again [007/RF-1.3] [007/RF-4.1] [007/RF-6.1]', async () => {
    server.use(http.post(api('/public/tracking'), () => HttpResponse.json(customerStatusFixture())));
    const user = userEvent.setup();
    renderPortal({ role: null });

    expect(screen.getByRole('link', { name: 'Ingresar con mi cuenta' })).toHaveAttribute('href', '/auth/login');
    await user.type(screen.getByLabelText('Número de orden'), '123');
    await user.type(screen.getByLabelText(/Código de seguimiento/), 'K7QM3XPA');
    await user.click(screen.getByRole('button', { name: 'Consultar estado' }));

    const card = await screen.findByRole('article', { name: 'Orden OT-000123' });
    expect(card).toHaveTextContent('Apple iPhone 13');
    expect(card).toHaveTextContent('1.130,00 BOB');
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('En Reparación');

    await user.click(screen.getByRole('button', { name: 'Consultar otra orden' }));
    expect(screen.getByRole('heading', { name: 'Consulte el estado de su equipo' })).toBeInTheDocument();
  });

  it('lists every order of a logged-in customer, including cancelled ones (RN-14) [007/RF-5.1] [007/RF-4.2]', async () => {
    server.use(
      http.get(api('/work-orders/mine'), () =>
        HttpResponse.json([
          customerStatusFixture(),
          customerStatusFixture({ id: 'w2', number: 99, status: 'CANCELLED', statusLabel: 'Cancelado', promisedAt: null, budgetTotal: null }),
        ]),
      ),
    );
    renderPortal({ role: 'CUSTOMER' });

    expect(screen.getByRole('heading', { name: 'Hola, Usuario Prueba' })).toBeInTheDocument();
    const cancelled = await screen.findByRole('article', { name: 'Orden OT-000099' });
    expect(cancelled).toHaveTextContent('La reparación fue cancelada');
    expect(cancelled).toHaveTextContent('Por confirmar');
    expect(cancelled).toHaveTextContent('Pendiente');
  });

  it('tells a customer without orders and logs them out [007/RF-5.2]', async () => {
    server.use(http.get(api('/work-orders/mine'), () => HttpResponse.json([])));
    const logout = vi.fn(async () => undefined);
    const user = userEvent.setup();
    renderPortal({ role: 'CUSTOMER', auth: { logout } });

    expect(await screen.findByText('Sin equipos en el servicio')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(logout).toHaveBeenCalledOnce();
  });

  it('shows staff the public form without account links [007/RF-6.2]', () => {
    renderPortal({ role: 'RECEPTIONIST' });
    expect(screen.queryByRole('link', { name: 'Ingresar con mi cuenta' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Número de orden')).toBeInTheDocument();
  });
});

describe('CustomerPortalPage other cases of the spec', () => {
  it('shows only the fields of the customer view, never internal data [007/RF-4.3]', () => {
    const leaked = { ...customerStatusFixture(), unlockCode: '4821', unitCost: '650.00', trackingCodeHash: '$argon2id$secreto', internalNotes: 'cliente moroso', preliminaryDiagnosis: 'placa dañada' };
    renderWithProviders(<CustomerOrderStatus order={leaked} />, { role: null });

    const card = screen.getByRole('article', { name: 'Orden OT-000123' });
    for (const secret of ['4821', '650', 'argon2', 'moroso', 'placa dañada']) {
      expect(card).not.toHaveTextContent(secret);
    }
  });

  it('closes the session and stays on the public portal page [007/RF-5.3]', async () => {
    server.use(http.get(api('/work-orders/mine'), () => HttpResponse.json([])));
    const logout = vi.fn(async () => undefined);
    const router = renderRoutes([{ path: '/portal-cliente', element: <CustomerPortalPage /> }], { role: 'CUSTOMER', at: '/portal-cliente', auth: { logout } });
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(logout).toHaveBeenCalledOnce();
    expect(router.state.location.pathname).toBe('/portal-cliente');
    expect(router.state.historyAction).toBe('REPLACE');
  });
});
