import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import * as authService from '../api/auth-service';
import { setAuthToken, setRefreshHandler } from '../../../shared/api/httpClient';
import type { AuthResponse } from '../../../shared/api/types';
import { AuthContext, type AuthContextValue } from './auth-context';

// FE-16 / SUP-07: refresh token in sessionStorage (dies with the tab), access
// token in memory only. Never localStorage.
const STORAGE_KEY = 'servicio_refresh_token';

const storage = {
  read(): string | null {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },
  write(token: string): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, token);
    } catch {
      // storage unavailable: the session simply won't survive a reload
    }
  },
  clear(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};

// The backend rotates refresh tokens and revokes the whole family when a used
// token is presented again (BE-E10). Concurrent callers (StrictMode double
// effects, parallel 401s) must therefore share ONE refresh per token.
let inFlight: { token: string; promise: Promise<AuthResponse> } | null = null;

function refreshOnce(token: string): Promise<AuthResponse> {
  if (inFlight?.token !== token) {
    const promise = authService.refresh(token).finally(() => {
      if (inFlight?.promise === promise) inFlight = null;
    });
    inFlight = { token, promise };
  }
  return inFlight.promise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<authService.AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(() => storage.read() !== null);

  const applySession = useCallback((response: AuthResponse) => {
    setAuthToken(response.accessToken);
    storage.write(response.refreshToken);
    const next = authService.toAuthUser(response);
    setUser(next);
    return next;
  }, []);

  const clearSession = useCallback(() => {
    setAuthToken(null);
    storage.clear();
    setUser(null);
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const stored = storage.read();
    if (!stored) {
      clearSession();
      return false;
    }
    try {
      applySession(await refreshOnce(stored));
      return true;
    } catch {
      // FE-03: a failed refresh ends the session; ProtectedRoute redirects.
      clearSession();
      return false;
    }
  }, [applySession, clearSession]);

  const login = useCallback(
    async (username: string, password: string) => applySession(await authService.login(username, password)),
    [applySession],
  );

  const logout = useCallback(async () => {
    const stored = storage.read();
    if (stored) {
      try {
        await authService.logout(stored);
      } catch {
        // best effort: the local session is cleared regardless
      }
    }
    clearSession();
  }, [clearSession]);

  // The HTTP client calls this on a 401 to retry the request once.
  useEffect(() => {
    setRefreshHandler(refreshSession);
    return () => setRefreshHandler(null);
  }, [refreshSession]);

  // Restore the session after a reload within the same tab. State is only
  // touched asynchronously, once the shared refresh settles.
  useEffect(() => {
    const stored = storage.read();
    if (!stored) return;
    let active = true;
    refreshOnce(stored)
      .then((response) => active && applySession(response))
      .catch(() => active && clearSession())
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [applySession, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
