import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, MemoryRouter, Route, RouterProvider, Routes, type RouteObject } from 'react-router';

import { env } from '../shared/config/env';
import type { UserRole } from '../shared/api/types';
import { AuthContext, type AuthContextValue } from '../features/auth/providers/auth-context';
import { ToastProvider } from '../shared/components/ToastContext';

export const api = (path: string) => `${env.apiUrl}${path}`;

export function fakeAuth(role: UserRole | null, id = 'user-1'): AuthContextValue {
  return {
    user: role ? { id, fullName: 'Usuario Prueba', username: 'prueba', role } : null,
    isAuthenticated: role !== null,
    isLoading: false,
    login: async () => {
      throw new Error('not used');
    },
    logout: async () => undefined,
  };
}

interface Options {
  role?: UserRole | null;
  userId?: string;
  route?: string;
  path?: string;
  extraRoutes?: ReactNode;
}

function testQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

// Data router version: returns the router so a test can read the location
// (pathname, query params, state) after navigations.
export function renderRoutes(
  routeObjects: RouteObject[],
  { role = null, userId, at }: { role?: UserRole | null; userId?: string; at: string | { pathname: string; search?: string; state?: unknown } },
) {
  const router = createMemoryRouter(routeObjects, { initialEntries: [at] });
  render(
    <QueryClientProvider client={testQueryClient()}>
      <AuthContext.Provider value={fakeAuth(role, userId)}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
  return router;
}

export function renderWithProviders(ui: ReactElement, { role = 'RECEPTIONIST', userId, route = '/', path = '/', extraRoutes }: Options = {}) {
  return render(
    <QueryClientProvider client={testQueryClient()}>
      <AuthContext.Provider value={fakeAuth(role, userId)}>
        <ToastProvider>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path={path} element={ui} />
              {extraRoutes}
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}
