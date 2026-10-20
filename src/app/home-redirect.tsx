import { Navigate } from 'react-router';

import { LOGIN_ROUTE, ROLE_DEFAULT_ROUTE } from '../features/auth/config/role-routes';
import { useAuth } from '../features/auth/hooks/useAuth';

export function HomeRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={user ? ROLE_DEFAULT_ROUTE[user.role] : LOGIN_ROUTE} replace />;
}
