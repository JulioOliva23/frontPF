import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readLoginRedirectState } from '../features/auth/config/role-routes';
import { request, setAuthToken, setRefreshHandler } from '../shared/api/httpClient';
import { server } from '../test/msw-server';
import { pageOf } from '../test/fixtures';
import { api, renderRoutes } from '../test/render';
import { isChunkLoadError } from './errors/chunk-load-error';
import { RouteErrorBoundary } from './errors/RouteErrorBoundary';
import { routes } from './router';
import { registerSessionExpiry } from './session-expiry';

function emptyOrdersList() {
  server.use(http.get(api('/work-orders'), () => HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 20 })));
}

// What the front desk shell and dashboard load: sidebar badge + summary.
function frontDeskShell() {
  server.use(
    http.get(api('/spare-parts/alerts/low-stock'), () => HttpResponse.json([])),
    http.get(api('/work-orders/summary'), () => HttpResponse.json({ active: 0, overdue: 0, byStatus: [] })),
  );
}

describe('route tree', () => {
  it('shows a 404 page with navigation for unknown paths', async () => {
    frontDeskShell();
    renderRoutes(routes, { role: 'RECEPTIONIST', at: '/no-existe' });
    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ir a mi inicio/i })).toHaveAttribute('href', '/');
    // Rendered inside AppLayout: the sidebar stays available.
    expect(screen.getAllByRole('navigation', { name: 'Menú principal' }).length).toBeGreaterThan(0);
  });

  it('offers the login on a 404 when nobody is signed in', async () => {
    renderRoutes(routes, { role: null, at: '/no-existe' });
    expect(await screen.findByRole('link', { name: /iniciar sesión/i })).toHaveAttribute('href', '/auth/login');
  });

  it.each([
    ['TECHNICIAN', '/ordenes'],
    ['RECEPTIONIST', '/'],
  ] as const)('keeps %s out of /administracion/* (sent to %s)', async (role, landing) => {
    emptyOrdersList();
    frontDeskShell();
    const router = renderRoutes(routes, { role, at: '/administracion/usuarios' });
    await waitFor(() => expect(router.state.location.pathname).toBe(landing));
  });

  it('opens the dashboard at "/" for the front desk', async () => {
    frontDeskShell();
    renderRoutes(routes, { role: 'RECEPTIONIST', at: '/' });
    expect(await screen.findByRole('region', { name: 'Indicadores' })).toBeInTheDocument();
  });

  it.each([
    ['TECHNICIAN', '/ordenes'],
    ['CUSTOMER', '/portal-cliente'],
    [null, '/auth/login'],
  ] as const)('sends %s from "/" to %s', async (role, landing) => {
    emptyOrdersList();
    server.use(http.get(api('/work-orders/mine'), () => HttpResponse.json([])));
    const router = renderRoutes(routes, { role, at: '/' });
    await waitFor(() => expect(router.state.location.pathname).toBe(landing));
  });

  it('sends anonymous visitors from /administracion/* to the login', async () => {
    const router = renderRoutes(routes, { role: null, at: '/administracion/usuarios' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/login'));
  });

  it('lets ADMIN into the admin screens', async () => {
    frontDeskShell();
    server.use(http.get(api('/users'), () => HttpResponse.json([])), http.get(api('/device-models'), () => HttpResponse.json([])));
    const router = renderRoutes(routes, { role: 'ADMIN', at: '/administracion/usuarios' });
    expect(await screen.findByRole('heading', { name: 'Usuarios', level: 1 })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/administracion/usuarios');
  });

  it('opens the users screen at /administracion', async () => {
    frontDeskShell();
    server.use(http.get(api('/users'), () => HttpResponse.json([])));
    const router = renderRoutes(routes, { role: 'ADMIN', at: '/administracion' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/administracion/usuarios'));
  });

  it('shows a 404 for an unknown admin screen', async () => {
    frontDeskShell();
    renderRoutes(routes, { role: 'ADMIN', at: '/administracion/no-existe' });
    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
  });

  it.each(['TECHNICIAN', 'RECEPTIONIST'] as const)('keeps %s out of the models catalog', async (role) => {
    emptyOrdersList();
    frontDeskShell();
    const router = renderRoutes(routes, { role, at: '/administracion/modelos' });
    await waitFor(() => expect(router.state.location.pathname).not.toBe('/administracion/modelos'));
  });
});

describe('RouteErrorBoundary', () => {
  afterEach(() => vi.restoreAllMocks());

  function Broken(): never {
    throw new Error('boom');
  }

  it('replaces a crashed page with a fallback instead of a blank screen', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderRoutes([{ path: '/', errorElement: <RouteErrorBoundary />, element: <Broken /> }], { role: 'ADMIN', at: '/' });

    expect(await screen.findByRole('heading', { name: 'Algo salió mal en esta pantalla' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/');
  });

  it('asks to reload when a lazy chunk cannot be fetched', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderRoutes(
      [
        {
          path: '/',
          errorElement: <RouteErrorBoundary />,
          lazy: async () => {
            throw new TypeError('Failed to fetch dynamically imported module: /assets/Page-abc.js');
          },
        },
      ],
      { role: 'RECEPTIONIST', at: '/' },
    );
    expect(await screen.findByRole('heading', { name: 'Hay una versión nueva del sistema' })).toBeInTheDocument();
  });

  it('recognises chunk load errors only', () => {
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
    expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(false);
  });
});

describe('session expiry (FE-03)', () => {
  let unregister: (() => void) | null = null;

  afterEach(() => {
    unregister?.();
    unregister = null;
    setAuthToken(null);
    setRefreshHandler(null);
  });

  it('takes the user to the login, remembering the page, when the refresh fails', async () => {
    emptyOrdersList();
    frontDeskShell();
    server.use(http.get(api('/users'), () => HttpResponse.json([])));
    const router = renderRoutes(routes, { role: 'RECEPTIONIST', at: '/ordenes' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/ordenes'));
    unregister = registerSessionExpiry(router);

    server.use(http.get(api('/spare-parts'), () => HttpResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 })));
    setAuthToken('expired');
    setRefreshHandler(async () => false);
    await expect(request({ url: '/spare-parts' })).rejects.toMatchObject({ statusCode: 401 });

    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/login'));
    expect(router.state.location.state).toEqual({ from: '/ordenes', reason: 'session-expired' });
    expect(await screen.findByText(/tu sesión expiró/i)).toBeInTheDocument();
  });

  it('only accepts in-app return paths', () => {
    expect(readLoginRedirectState({ from: '/ordenes/1', reason: 'session-expired' })).toEqual({ from: '/ordenes/1', reason: 'session-expired' });
    expect(readLoginRedirectState({ from: 'https://evil.example' })).toEqual({});
    expect(readLoginRedirectState({ from: '//evil.example' })).toEqual({});
    expect(readLoginRedirectState({ from: '/auth/login', reason: 'other' })).toEqual({});
    expect(readLoginRedirectState(null)).toEqual({});
  });
});

// From main (app routes suite), adapted to the 404 page (phase 1) and the
// front desk dashboard at "/" (phase 2).
describe('app routes (FE-07 / FE-08)', () => {
  it('sends anonymous visitors from / to the login', async () => {
    const router = renderRoutes(routes, { role: null, at: '/' });
    expect(await screen.findByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/auth/login');
  });

  it('redirects legacy paths', async () => {
    const router = renderRoutes(routes, { role: null, at: '/login' });
    expect(await screen.findByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/auth/login');
  });

  it('lands technicians on their orders with a role-filtered menu, and logs out', async () => {
    server.use(http.get(api('/work-orders'), () => HttpResponse.json(pageOf([]))));
    const user = userEvent.setup();
    const logout = vi.fn(async () => undefined);
    const router = renderRoutes(routes, { role: 'TECHNICIAN', at: '/', auth: { logout } });

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
    const router = renderRoutes(routes, { role: 'TECHNICIAN', at: '/inventario' });
    expect(await screen.findByRole('heading', { name: 'Órdenes de trabajo' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/ordenes');
  });

  it('opens the mobile drawer and highlights only the exact menu item', async () => {
    server.use(http.get(api('/spare-parts/alerts/low-stock'), () => HttpResponse.json([])));
    const user = userEvent.setup();
    renderRoutes(routes, { role: 'ADMIN', at: '/inventario/alertas' });

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

  it('shows the 404 page, linked to the role landing page, for unknown paths', async () => {
    const router = renderRoutes(routes, { role: 'CUSTOMER', at: '/no-existe' });
    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ir a mi inicio/i })).toHaveAttribute('href', '/portal-cliente');
    expect(router.state.location.pathname).toBe('/no-existe');
  });
});
