import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';

import { RoleGuard } from '../features/auth/components/RoleGuard';
import { ADMIN_ONLY, FRONT_DESK_ROLES, LOGIN_ROUTE, STAFF_ROLES } from '../features/auth/config/role-routes';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ADMIN_BASE_PATH, ADMIN_ROUTES } from './admin-routes';
import { AppLayout } from './app-layout';
import { RouteErrorBoundary } from './errors/RouteErrorBoundary';
import { NotFoundPage } from './errors/NotFoundPage';

// FE-07: route map. Every staff route sits behind RoleGuard with the same
// role groups used by the sidebar (navigation.tsx).
//
// Error handling has two levels:
// * inside AppLayout, a pathless route catches errors of any page so the
//   header and sidebar stay usable;
// * the root route is the last resort (login, portal, or AppLayout itself).
export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: LOGIN_ROUTE, element: <LoginPage /> },
      { path: '/login', element: <Navigate to={LOGIN_ROUTE} replace /> },
      {
        // SUP-05: public (number + tracking code) and CUSTOMER session.
        path: '/portal-cliente',
        lazy: async () => ({ Component: (await import('../features/customer-portal/pages/CustomerPortalPage')).CustomerPortalPage }),
      },
      { path: '/tracking', element: <Navigate to="/portal-cliente" replace /> },
      {
        path: '/',
        element: <AppLayout />,
        children: [
          {
            errorElement: <RouteErrorBoundary />,
            children: [
              {
                element: <RoleGuard allowedRoles={STAFF_ROLES} />,
                children: [
                  { path: 'ordenes', lazy: async () => ({ Component: (await import('../features/work-orders/pages/WorkOrdersPage')).WorkOrdersPage }) },
                  { path: 'ordenes/:id', lazy: async () => ({ Component: (await import('../features/work-orders/pages/WorkOrderDetailPage')).WorkOrderDetailPage }) },
                  // AG-01: proposals from the AI agent; the API filters what each role sees.
                  { path: 'aprobaciones', lazy: async () => ({ Component: (await import('../features/agent-actions/pages/AgentApprovalsPage')).AgentApprovalsPage }) },
                ],
              },
              {
                // RN-07: technicians never reach budgets nor inventory. The
                // dashboard is the front desk home; other roles hitting "/"
                // are sent by RoleGuard to their own landing page.
                element: <RoleGuard allowedRoles={FRONT_DESK_ROLES} />,
                children: [
                  { index: true, lazy: async () => ({ Component: (await import('../features/dashboard/pages/DashboardPage')).DashboardPage }) },
                  { path: 'ordenes/nueva', lazy: async () => ({ Component: (await import('../features/work-orders/pages/CheckInPage')).CheckInPage }) },
                  { path: 'presupuestos', lazy: async () => ({ Component: (await import('../features/budgets/pages/BudgetsPage')).BudgetsPage }) },
                  { path: 'presupuestos/:workOrderId', lazy: async () => ({ Component: (await import('../features/budgets/pages/BudgetEditorPage')).BudgetEditorPage }) },
                  { path: 'inventario', lazy: async () => ({ Component: (await import('../features/inventory/pages/InventoryPage')).InventoryPage }) },
                  { path: 'inventario/alertas', lazy: async () => ({ Component: (await import('../features/inventory/pages/LowStockPage')).LowStockPage }) },
                ],
              },
              {
                // US-F14: the whole /administracion/* subtree is ADMIN only;
                // the guard runs before any admin route (or its 404) resolves.
                path: ADMIN_BASE_PATH.slice(1),
                element: <RoleGuard allowedRoles={ADMIN_ONLY} />,
                children: ADMIN_ROUTES,
              },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
