import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readLoginRedirectState } from '../features/auth/config/role-routes';
import { request, setAuthToken, setRefreshHandler } from '../shared/api/httpClient';
import { server } from '../test/msw-server';
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
