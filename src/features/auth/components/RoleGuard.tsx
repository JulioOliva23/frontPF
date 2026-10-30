import { Navigate, Outlet, useLocation } from 'react-router';

import type { UserRole } from '../../../shared/api/types';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { LOGIN_ROUTE, ROLE_DEFAULT_ROUTE } from '../config/role-routes';
import { useAuth } from '../hooks/useAuth';

interface RoleGuardProps {
  allowedRoles: readonly UserRole[];
}

// FE-08: cosmetic guard. The backend still enforces every permission.
export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (!user) return <Navigate to={LOGIN_ROUTE} replace state={{ from: location.pathname }} />;
  if (!allowedRoles.includes(user.role)) return <Navigate to={ROLE_DEFAULT_ROUTE[user.role]} replace />;
  return <Outlet />;
}
