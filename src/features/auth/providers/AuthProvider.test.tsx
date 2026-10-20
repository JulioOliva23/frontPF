import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { server } from '../../../test/msw-server';
import { api } from '../../../test/render';
import { useAuth } from '../hooks/useAuth';
import { AuthProvider } from './AuthProvider';

function WhoAmI() {
  const { user, isLoading } = useAuth();
  return <p>{isLoading ? 'loading' : (user?.role ?? 'anonymous')}</p>;
}

afterEach(() => sessionStorage.clear());

describe('AuthProvider (FE-16)', () => {
  it('restores the session with a single refresh even under StrictMode double effects', async () => {
    sessionStorage.setItem('servicio_refresh_token', 'refresh-1');
    let refreshCalls = 0;
    server.use(
      http.post(api('/auth/refresh'), () => {
        refreshCalls += 1;
        return HttpResponse.json({ accessToken: 'a2', refreshToken: 'refresh-2', id: 'u1', fullName: 'Ana', username: 'ana', role: 'RECEPTIONIST' });
      }),
    );
    render(
      <StrictMode>
        <AuthProvider>
          <WhoAmI />
        </AuthProvider>
      </StrictMode>,
    );
    expect(await screen.findByText('RECEPTIONIST')).toBeInTheDocument();
    // Two refreshes with the same token would make the backend revoke the family.
    expect(refreshCalls).toBe(1);
    expect(sessionStorage.getItem('servicio_refresh_token')).toBe('refresh-2');
    expect(globalThis.localStorage?.getItem('servicio_refresh_token') ?? null).toBeNull();
  });

  it('ends anonymous when there is no stored session', async () => {
    render(
      <AuthProvider>
        <WhoAmI />
      </AuthProvider>,
    );
    expect(await screen.findByText('anonymous')).toBeInTheDocument();
  });
});
