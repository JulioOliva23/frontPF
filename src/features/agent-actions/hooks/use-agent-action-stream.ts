import { useEffect, useEffectEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getAuthToken, refreshAuthSession } from '../../../shared/api/httpClient';
import { queryKeys } from '../../../shared/api/query-keys';
import type { AgentAction } from '../../../shared/api/types';
import { env } from '../../../shared/config/env';
import { AGENT_ACTIONS_STREAM_PATH } from '../api/agent-actions-api';
import { parseSseChunk, reconnectDelay } from '../lib/sse';
import { upsertAction } from '../lib/agent-action-rules';
import { useInvalidateAfterDecision } from './use-agent-actions';

export type StreamStatus = 'connecting' | 'live' | 'offline';

export interface AgentActionStreamEvent {
  type: 'created' | 'updated';
  action: AgentAction;
}

export interface AgentActionStreamOptions {
  enabled?: boolean;
  // Interceptor: runs for every proposal event before the cache is touched.
  // Return false to drop the event (e.g. a screen that filters by order).
  onEvent?: (event: AgentActionStreamEvent) => boolean | void;
}

function isAgentAction(value: unknown): value is AgentAction {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' && typeof record.status === 'string' && typeof record.workOrderNumber === 'number';
}

// AG-01 (frontend lifecycle hook): subscribes to the backend SSE stream of
// agent proposals and intercepts each event before the UI reacts:
//   ping            → keeps the connection marked "live", nothing else
//   created/updated → validated, passed to onEvent (which may veto it), then
//                     written into the React Query cache so every list and
//                     badge re-renders without refetching; an EXECUTED
//                     proposal invalidates work orders (and stock, RN-09).
// Reconnects with backoff and renews the session once on a 401 (FE-03).
export function useAgentActionStream({ enabled = true, onEvent }: AgentActionStreamOptions = {}): StreamStatus {
  const queryClient = useQueryClient();
  const invalidateAfterDecision = useInvalidateAfterDecision();
  const [status, setStatus] = useState<StreamStatus>('connecting');
  // Reads the latest callbacks without reconnecting the stream on every render.
  const intercept = useEffectEvent((event: AgentActionStreamEvent) => onEvent?.(event));
  const afterExecuted = useEffectEvent((action: AgentAction) => invalidateAfterDecision(action));

  useEffect(() => {
    if (!enabled) return;
    const abort = new AbortController();
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const apply = (event: AgentActionStreamEvent) => {
      if (intercept(event) === false) return;
      const { action } = event;
      queryClient.setQueryData<AgentAction[]>(queryKeys.agentActions.list('ALL'), (list) => (list ? upsertAction(list, action) : list));
      queryClient.setQueryData<AgentAction[]>(queryKeys.agentActions.list('PENDING'), (list) => {
        if (!list) return list;
        return action.status === 'PENDING' ? upsertAction(list, action) : list.filter((item) => item.id !== action.id);
      });
      if (event.type === 'updated' && action.status === 'EXECUTED') afterExecuted(action);
    };

    const handleFrame = (event: string, data: string) => {
      if (event !== 'created' && event !== 'updated') return;
      let payload: unknown;
      try {
        payload = JSON.parse(data);
      } catch {
        return;
      }
      if (isAgentAction(payload)) apply({ type: event, action: payload });
    };

    const scheduleRetry = () => {
      if (abort.signal.aborted) return;
      setStatus('offline');
      retryTimer = setTimeout(() => void connect(), reconnectDelay(attempt++));
    };

    const connect = async () => {
      setStatus('connecting');
      try {
        const token = await getAuthToken();
        const response = await fetch(`${env.apiUrl}${AGENT_ACTIONS_STREAM_PATH}`, {
          headers: { Accept: 'text/event-stream', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          credentials: 'include',
          signal: abort.signal,
        });
        if (response.status === 401 && attempt === 0 && (await refreshAuthSession())) {
          attempt++;
          return void connect();
        }
        if (!response.ok || !response.body) return scheduleRetry();

        setStatus('live');
        attempt = 0;
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          const parsed = parseSseChunk(buffer + value);
          buffer = parsed.rest;
          parsed.frames.forEach((frame) => handleFrame(frame.event, frame.data));
        }
        scheduleRetry();
      } catch {
        scheduleRetry();
      }
    };

    void connect();
    return () => {
      abort.abort();
      clearTimeout(retryTimer);
    };
  }, [enabled, queryClient]);

  return enabled ? status : 'offline';
}
