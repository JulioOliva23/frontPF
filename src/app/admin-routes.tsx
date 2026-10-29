import type { RouteObject } from 'react-router';

import { NotFoundPage } from './errors/NotFoundPage';

// US-F14 (phase 3): admin screens live under /admin/* and only ADMIN reaches
// them (the RoleGuard wrapping this list in router.tsx). Add each screen here
// as a lazy route, e.g.
//   { path: 'usuarios', lazy: async () => ({ Component: (await import('../features/admin/pages/UsersPage')).UsersPage }) },
// Until then an admin sees the 404 for any /admin path.
export const ADMIN_ROUTES: RouteObject[] = [
  { index: true, element: <NotFoundPage /> },
  { path: '*', element: <NotFoundPage /> },
];
