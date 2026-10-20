import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../test/msw-server';
import { api } from '../../test/render';
import { ApiError, request, setAuthToken, setRefreshHandler } from './httpClient';

afterEach(() => {
  setAuthToken(null);
  setRefreshHandler(null);
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
