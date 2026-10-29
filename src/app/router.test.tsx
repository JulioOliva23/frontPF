import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from '../features/auth/providers/auth-context';
import { readLoginRedirectState } from '../features/auth/config/role-routes';
import { request, setAuthToken, setRefreshHandler } from '../shared/api/httpClient';
import type { UserRole } from '../shared/api/types';
import { ToastProvider } from '../shared/components/ToastContext';
import { server } from '../test/msw-server';
import { api, fakeAuth } from '../test/render';
import { isChunkLoadError } from './errors/chunk-load-error';
import { RouteErrorBoundary } from './errors/RouteErrorBoundary';
import { routes } from './router';
import { registerSessionExpiry } from './session-expiry';

function renderRoutes(routeObjects: RouteObject[], { role = null, at }: { role?: UserRole | null; at: string | { pathname: string; state: unknown } }) {
  const router = createMemoryRouter(routeObjects, { initialEntries: [at] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={fakeAuth(role)}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
  return router;
}

function emptyOrdersList() {
  server.use(http.get(api('/work-orders'), () => HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 20 })));
}

describe('route tree', () => {
  it('shows a 404 page with navigation for unknown paths', async () => {
    renderRoutes(routes, { role: 'RECEPTIONIST', at: '/no-existe' });
    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ir a mi inicio/i })).toHaveAttribute('href', '/ordenes');
    // Rendered inside AppLayout: the sidebar stays available.
    expect(screen.getAllByRole('navigation', { name: 'Menú principal' }).length).toBeGreaterThan(0);
  });

  it('offers the login on a 404 when nobody is signed in', async () => {
    renderRoutes(routes, { role: null, at: '/no-existe' });
    expect(await screen.findByRole('link', { name: /iniciar sesión/i })).toHaveAttribute('href', '/auth/login');
  });

  it.each(['TECHNICIAN', 'RECEPTIONIST'] as const)('keeps %s out of /admin/*', async (role) => {
    emptyOrdersList();
    const router = renderRoutes(routes, { role, at: '/admin/usuarios' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/ordenes'));
  });

  it('sends anonymous visitors from /admin/* to the login', async () => {
    const router = renderRoutes(routes, { role: null, at: '/admin/usuarios' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/login'));
  });

  it('lets ADMIN into /admin/* (404 until the screens exist)', async () => {
    const router = renderRoutes(routes, { role: 'ADMIN', at: '/admin/usuarios' });
    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/usuarios');
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
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/ordenes');
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
