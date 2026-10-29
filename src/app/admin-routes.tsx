import { Navigate, type RouteObject } from 'react-router';

import { NotFoundPage } from './errors/NotFoundPage';

export const ADMIN_BASE_PATH = '/administracion';

// US-F14: admin screens. Only ADMIN reaches them: router.tsx wraps this list
// in RoleGuard(ADMIN_ONLY), so any other role is sent to its landing page.
export const ADMIN_ROUTES: RouteObject[] = [
  { index: true, element: <Navigate to="usuarios" replace /> },
  { path: 'usuarios', lazy: async () => ({ Component: (await import('../features/admin/pages/UsersPage')).UsersPage }) },
  { path: 'modelos', lazy: async () => ({ Component: (await import('../features/admin/pages/DeviceModelsPage')).DeviceModelsPage }) },
  { path: '*', element: <NotFoundPage /> },
];
