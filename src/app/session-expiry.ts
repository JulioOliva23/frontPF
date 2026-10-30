import type { createBrowserRouter } from 'react-router';

import { LOGIN_ROUTE, type LoginRedirectState } from '../features/auth/config/role-routes';
import { setSessionExpiredHandler } from '../shared/api/httpClient';

type AppRouter = ReturnType<typeof createBrowserRouter>;

// FE-03: when a 401 cannot be recovered by the refresh, AuthProvider has
// already cleared the session; this takes the user to the login, remembering
// where they were so they land there again after signing in.
export function registerSessionExpiry(router: AppRouter): () => void {
  setSessionExpiredHandler(() => {
    const { pathname } = router.state.location;
    if (pathname === LOGIN_ROUTE) return;
    const state: LoginRedirectState = { from: pathname, reason: 'session-expired' };
    void router.navigate(LOGIN_ROUTE, { replace: true, state });
  });
  return () => setSessionExpiredHandler(null);
}
