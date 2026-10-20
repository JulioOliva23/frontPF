import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import type { UserRole } from '../shared/api/types';
import { AuthContext } from '../features/auth/providers/auth-context';
import { ToastProvider } from '../shared/components/ToastContext';
import { server } from '../test/msw-server';
import { api, fakeAuth } from '../test/render';
import { pageOf } from '../test/fixtures';
import { routes } from './router';

function renderApp(path: string, role: UserRole | null, logout = vi.fn(async () => undefined)) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuthContext.Provider value={{ ...fakeAuth(role), logout }}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
  return { router, logout };
}

describe('app routes (FE-07 / FE-08)', () => {
  it('sends anonymous visitors from / to the login', async () => {
    const { router } = renderApp('/', null);
    expect(await screen.findByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/auth/login');
  });

  it('redirects legacy paths', async () => {
    const { router } = renderApp('/login', null);
    expect(await screen.findByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/auth/login');
  });

  it('lands staff on their orders with a role-filtered menu, and logs out', async () => {
    server.use(http.get(api('/work-orders'), () => HttpResponse.json(pageOf([]))));
    const user = userEvent.setup();
    const { router, logout } = renderApp('/', 'TECHNICIAN');

    expect(await screen.findByRole('heading', { name: 'Órdenes de trabajo' })).toBeInTheDocument();
    const [desktopMenu] = screen.getAllByRole('navigation', { name: 'Menú principal' });
    expect(within(desktopMenu).getByRole('link', { name: 'Órdenes de trabajo' })).toHaveAttribute('aria-current', 'page');
    // RN-07: technicians never see budgets nor inventory.
    expect(within(desktopMenu).queryByRole('link', { name: 'Presupuestos' })).not.toBeInTheDocument();
    expect(screen.getByText('Técnico')).toBeInTheDocument();

    await user.click(within(desktopMenu).getByRole('button', { name: 'Cerrar sesión' }));
    expect(logout).toHaveBeenCalledOnce();
    expect(router.state.location.pathname).toBe('/auth/login');
  });

  it('keeps technicians out of front-desk routes', async () => {
    server.use(http.get(api('/work-orders'), () => HttpResponse.json(pageOf([]))));
    const { router } = renderApp('/inventario', 'TECHNICIAN');
    expect(await screen.findByRole('heading', { name: 'Órdenes de trabajo' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/ordenes');
  });

  it('opens the mobile drawer and highlights only the exact menu item', async () => {
    server.use(http.get(api('/spare-parts/alerts/low-stock'), () => HttpResponse.json([])));
    const user = userEvent.setup();
    renderApp('/inventario/alertas', 'ADMIN');

    expect(await screen.findByRole('heading', { name: /Stock bajo/ })).toBeInTheDocument();
    const open = screen.getByRole('button', { name: 'Abrir menú' });
    expect(open).toHaveAttribute('aria-expanded', 'false');
    await user.click(open);
    expect(open).toHaveAttribute('aria-expanded', 'true');

    const [desktopMenu] = screen.getAllByRole('navigation', { name: 'Menú principal' });
    expect(within(desktopMenu).getByRole('link', { name: 'Stock bajo' })).toHaveAttribute('aria-current', 'page');
    expect(within(desktopMenu).getByRole('link', { name: 'Inventario' })).not.toHaveAttribute('aria-current');

    await user.keyboard('{Escape}');
    expect(open).toHaveAttribute('aria-expanded', 'false');
    await user.click(open);
    await user.click(screen.getByRole('button', { name: 'Cerrar menú' }));
    expect(open).toHaveAttribute('aria-expanded', 'false');
  });

  it('sends unknown paths to the role landing page', async () => {
    const { router } = renderApp('/no-existe', 'CUSTOMER');
    expect(await screen.findByText('Estado de su reparación')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/portal-cliente');
  });
});
