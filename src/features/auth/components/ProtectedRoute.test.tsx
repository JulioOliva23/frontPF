import { screen } from '@testing-library/react';
import { Route } from 'react-router';
import { describe, expect, it } from 'vitest';

import type { UserRole } from '../../../shared/api/types';
import { renderWithProviders } from '../../../test/render';
import { FRONT_DESK_ROLES } from '../config/role-routes';
import { ProtectedRoute } from './ProtectedRoute';

const extra = (
  <>
    <Route path="/auth/login" element={<p>login page</p>} />
    <Route path="/ordenes" element={<p>orders page</p>} />
    <Route path="/portal-cliente" element={<p>portal page</p>} />
  </>
);

function renderGuard(role: UserRole | null) {
  return renderWithProviders(<ProtectedRoute allowedRoles={FRONT_DESK_ROLES} />, {
    role,
    route: '/presupuestos',
    path: '/presupuestos',
    extraRoutes: extra,
  });
}

describe('ProtectedRoute (FE-08)', () => {
  it('sends technicians away from budgets to their orders (RN-07)', () => {
    renderGuard('TECHNICIAN');
    expect(screen.getByText('orders page')).toBeInTheDocument();
  });

  it('sends anonymous visitors to the login', () => {
    renderGuard(null);
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('sends customers to the portal', () => {
    renderGuard('CUSTOMER');
    expect(screen.getByText('portal page')).toBeInTheDocument();
  });
});
