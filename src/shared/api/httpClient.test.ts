import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../test/msw-server';
import { api } from '../../test/render';
import { ApiError, httpClient, request, setAuthToken, setRefreshHandler, setSessionExpiredHandler } from './httpClient';

afterEach(() => {
  setAuthToken(null);
  setRefreshHandler(null);
  setSessionExpiredHandler(null);
});

// Answers 200 only to the given token, 401 to anything else.
function onlyAccepts(token: string, onCall?: (authorization: string | null) => void) {
  return ({ request: incoming }: { request: Request }) => {
    const authorization = incoming.headers.get('Authorization');
    onCall?.(authorization);
    return authorization === `Bearer ${token}`
      ? HttpResponse.json({ ok: true })
      : HttpResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('httpClient session handling (FE-03 / SUP-07)', () => {
  it('sends credentials so the httpOnly refresh cookie can travel', () => {
    expect(httpClient.defaults.withCredentials).toBe(true);
  });

  it('shares one refresh among concurrent 401s and retries all of them', async () => {
    server.use(http.get(api('/work-orders'), onlyAccepts('fresh')), http.get(api('/spare-parts'), onlyAccepts('fresh')));
    setAuthToken('expired');
    const refresh = vi.fn(async () => {
      setAuthToken('fresh');
      return true;
    });
    setRefreshHandler(refresh);

    await expect(Promise.all([request({ url: '/work-orders' }), request({ url: '/spare-parts' })])).resolves.toEqual([{ ok: true }, { ok: true }]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('queues a request issued while a refresh is running instead of sending the old token', async () => {
    const seen: Array<string | null> = [];
    server.use(
      http.get(api('/work-orders'), onlyAccepts('fresh')),
      http.get(api('/spare-parts'), onlyAccepts('fresh', (authorization) => seen.push(authorization))),
    );
    setAuthToken('expired');
    const gate = deferred<void>();
    const refreshStarted = deferred<void>();
    setRefreshHandler(async () => {
      refreshStarted.resolve();
      await gate.promise;
      setAuthToken('fresh');
      return true;
    });

    const first = request({ url: '/work-orders' });
    await refreshStarted.promise;
    const queued = request({ url: '/spare-parts' });
    gate.resolve();

    await expect(Promise.all([first, queued])).resolves.toEqual([{ ok: true }, { ok: true }]);
    expect(seen).toEqual(['Bearer fresh']);
  });

  it('reports the expired session once when the refresh fails', async () => {
    server.use(http.get(api('/work-orders'), onlyAccepts('never')), http.get(api('/spare-parts'), onlyAccepts('never')));
    setAuthToken('expired');
    setRefreshHandler(async () => {
      setAuthToken(null);
      return false;
    });
    const expired = vi.fn();
    setSessionExpiredHandler(expired);

    const results = await Promise.allSettled([request({ url: '/work-orders' }), request({ url: '/spare-parts' })]);
    expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected']);
    expect((results[0] as PromiseRejectedResult).reason).toMatchObject({ statusCode: 401, isUnauthorized: true });
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it('does not report an expired session for anonymous 401s', async () => {
    server.use(http.get(api('/work-orders/mine'), () => HttpResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 })));
    const refresh = vi.fn(async () => true);
    const expired = vi.fn();
    setRefreshHandler(refresh);
    setSessionExpiredHandler(expired);

    await expect(request({ url: '/work-orders/mine' })).rejects.toMatchObject({ statusCode: 401 });
    expect(refresh).not.toHaveBeenCalled();
    expect(expired).not.toHaveBeenCalled();
  });
});

describe('ApiError mapping (FE-04)', () => {
  it('maps the NestJS body { statusCode, message, error }', async () => {
    server.use(
      http.post(api('/users'), () => HttpResponse.json({ statusCode: 409, message: 'Username already taken', error: 'Conflict' }, { status: 409 })),
    );
    const error = (await request({ url: '/users', method: 'POST' }).catch((caught: unknown) => caught)) as ApiError;
    expect(error).toMatchObject({ statusCode: 409, error: 'Conflict', messages: ['Username already taken'], isConflict: true });
    expect(error.message).toBe('Username already taken');
  });

  it('falls back to a readable message when the body is not JSON', async () => {
    server.use(http.get(api('/work-orders'), () => new HttpResponse('<html>Bad Gateway</html>', { status: 502, headers: { 'Content-Type': 'text/html' } })));
    const error = (await request({ url: '/work-orders' }).catch((caught: unknown) => caught)) as ApiError;
    expect(error).toMatchObject({ statusCode: 502, isServerError: true, messages: ['Error interno del servidor'] });
  });

  it('flags network failures with status 0', async () => {
    server.use(http.get(api('/work-orders'), () => HttpResponse.error()));
    const error = (await request({ url: '/work-orders' }).catch((caught: unknown) => caught)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ statusCode: 0, isNetworkError: true, messages: ['No se pudo conectar con el servidor'] });
  });

  it('uses the status fallback when the server sends no message', async () => {
    server.use(http.delete(api('/users/u1'), () => HttpResponse.json({ statusCode: 403 }, { status: 403 })));
    const error = (await request({ url: '/users/u1', method: 'DELETE' }).catch((caught: unknown) => caught)) as ApiError;
    expect(error).toMatchObject({ isForbidden: true, message: 'No tienes permiso para realizar esta acción' });
  });
});

describe('httpClient (FE-03 / FE-04)', () => {
  it('injects the in-memory bearer token', async () => {
    let authorization: string | null = null;
    server.use(
      http.get(api('/work-orders'), ({ request: incoming }) => {
        authorization = incoming.headers.get('Authorization');
        return HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 20 });
      }),
    );
    setAuthToken('token-1');
    await request({ url: '/work-orders' });
    expect(authorization).toBe('Bearer token-1');
  });

  it('normalizes validation messages and strips requirement codes', async () => {
    server.use(
      http.post(api('/work-orders'), () =>
        HttpResponse.json({ statusCode: 400, message: ['device.RN-02: imei must be 15 digits with a valid Luhn check digit', 'reportedProblem must be longer'] }, { status: 400 }),
      ),
    );
    const error = (await request({ url: '/work-orders', method: 'POST' }).catch((caught: unknown) => caught)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.messages).toEqual(['device. imei must be 15 digits with a valid Luhn check digit', 'reportedProblem must be longer']);
  });

  it('exposes the Stock Guard details (RN-09)', async () => {
    server.use(
      http.post(api('/work-orders/x/transitions'), () =>
        HttpResponse.json({ statusCode: 422, message: 'RN-09: insufficient stock', code: 'INSUFFICIENT_STOCK', sparePartIds: ['p1'] }, { status: 422 }),
      ),
    );
    const error = (await request({ url: '/work-orders/x/transitions', method: 'POST' }).catch((caught: unknown) => caught)) as ApiError;
    expect(error.isInsufficientStock).toBe(true);
    expect(error.sparePartIds).toEqual(['p1']);
  });

  it('refreshes once on 401 and retries the request', async () => {
    let calls = 0;
    server.use(
      http.get(api('/work-orders'), ({ request: incoming }) => {
        calls += 1;
        return incoming.headers.get('Authorization') === 'Bearer fresh'
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
      }),
    );
    setAuthToken('expired');
    const refresh = vi.fn(async () => {
      setAuthToken('fresh');
      return true;
    });
    setRefreshHandler(refresh);
    await expect(request({ url: '/work-orders' })).resolves.toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(calls).toBe(2);
  });

  it('never tries to refresh a failed login', async () => {
    server.use(http.post(api('/auth/login'), () => HttpResponse.json({ statusCode: 401, message: 'Credenciales incorrectas' }, { status: 401 })));
    setAuthToken('something');
    const refresh = vi.fn(async () => true);
    setRefreshHandler(refresh);
    await expect(request({ url: '/auth/login', method: 'POST' })).rejects.toMatchObject({ statusCode: 401 });
    expect(refresh).not.toHaveBeenCalled();
  });

  it('flags rate limiting', async () => {
    server.use(http.post(api('/public/tracking'), () => HttpResponse.json({ statusCode: 429, message: 'ThrottlerException: Too Many Requests' }, { status: 429 })));
    const error = (await request({ url: '/public/tracking', method: 'POST' }).catch((caught: unknown) => caught)) as ApiError;
    expect(error.isRateLimited).toBe(true);
  });
});
