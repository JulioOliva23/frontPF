import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { queryKeys } from '../../../shared/api/query-keys';
import type { AgentAction } from '../../../shared/api/types';
import { agentActionFixture } from '../../../test/fixtures';
import { server } from '../../../test/msw-server';
import { api } from '../../../test/render';
import { useAgentActionStream, type AgentActionStreamOptions } from './use-agent-action-stream';

function sseResponse(frames: string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      // Split mid-frame on purpose: the parser must buffer partial chunks.
      const text = frames.join('');
      controller.enqueue(encoder.encode(text.slice(0, 25)));
      controller.enqueue(encoder.encode(text.slice(25)));
    },
  });
  return new HttpResponse(body, { headers: { 'Content-Type': 'text/event-stream' } });
}

const frame = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

function setup(options: AgentActionStreamOptions, seed: AgentAction[] = []) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(queryKeys.agentActions.list('PENDING'), seed);
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const hook = renderHook(() => useAgentActionStream(options), { wrapper });
  return { client, invalidate, ...hook };
}

describe('useAgentActionStream (AG-01 frontend hook)', () => {
  it('writes created proposals into the cache and removes them once decided', async () => {
    const created = agentActionFixture();
    const executed = { ...created, status: 'EXECUTED' as const };
    server.use(http.get(api('/agent-actions/stream'), () => sseResponse([frame('ping', {}), frame('created', created), frame('updated', executed)])));
    const onEvent = vi.fn();

    const { client, invalidate } = setup({ onEvent });

    await waitFor(() => expect(onEvent).toHaveBeenCalledTimes(2));
    expect(onEvent.mock.calls.map(([event]) => event.type)).toEqual(['created', 'updated']);
    expect(client.getQueryData(queryKeys.agentActions.list('PENDING'))).toEqual([]);
    // EXECUTED into IN_REPAIR: work orders and stock (RN-09) are refreshed.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.workOrders.root });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.spareParts.root });
  });

  it('lets the interceptor veto an event and ignores malformed payloads', async () => {
    server.use(
      http.get(api('/agent-actions/stream'), () =>
        sseResponse([frame('created', { nope: true }), 'event: created\ndata: {broken\n\n', frame('created', agentActionFixture())]),
      ),
    );
    const onEvent = vi.fn(() => false);

    const { client } = setup({ onEvent });

    await waitFor(() => expect(onEvent).toHaveBeenCalledTimes(1));
    expect(client.getQueryData(queryKeys.agentActions.list('PENDING'))).toEqual([]);
  });

  it('reports offline when the stream is unavailable and does nothing when disabled', async () => {
    server.use(http.get(api('/agent-actions/stream'), () => new HttpResponse(null, { status: 503 })));
    const { result } = setup({});
    await waitFor(() => expect(result.current).toBe('offline'));

    const disabled = setup({ enabled: false });
    expect(disabled.result.current).toBe('offline');
  });
});
