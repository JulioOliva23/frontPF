import { describe, expect, it } from 'vitest';

import { agentActionFixture } from '../../../test/fixtures';
import { canApprove, canReject, minutesLeft, requiresTypedConfirmation, upsertAction } from './agent-action-rules';
import { parseSseChunk, reconnectDelay } from './sse';

describe('parseSseChunk', () => {
  it('splits complete frames, keeps the partial tail and skips comments', () => {
    const { frames, rest } = parseSseChunk(': hi\n\nevent: created\ndata: {"a":1}\n\nevent: ping\r\ndata: x\r\n\r\nevent: upd');
    expect(frames).toEqual([
      { event: 'created', data: '{"a":1}' },
      { event: 'ping', data: 'x' },
    ]);
    expect(rest).toBe('event: upd');
  });

  it('joins multi-line data and defaults the event name', () => {
    expect(parseSseChunk('data: a\ndata: b\n\n').frames).toEqual([{ event: 'message', data: 'a\nb' }]);
  });

  it('backs off exponentially up to 30 s', () => {
    expect([0, 1, 2, 10].map(reconnectDelay)).toEqual([1_000, 2_000, 4_000, 30_000]);
  });
});

describe('agent action rules (AG-04, mirrored for the UI)', () => {
  const action = agentActionFixture();

  it('only offers approval to a role the state machine accepts', () => {
    expect(canApprove(action, { id: 'tech-1', role: 'TECHNICIAN' })).toBe(true);
    expect(canApprove(action, { id: 'rec-1', role: 'RECEPTIONIST' })).toBe(false);
    expect(canReject(action, { id: 'rec-1', role: 'RECEPTIONIST' })).toBe(true);
  });

  it('never lets the proposing account decide', () => {
    expect(canApprove(agentActionFixture({ approverRoles: ['RECEPTIONIST'] }), { id: 'agent-user', role: 'RECEPTIONIST' })).toBe(false);
    expect(canReject(action, { id: 'agent-user', role: 'RECEPTIONIST' })).toBe(false);
  });

  it('asks for typed confirmation only for irreversible targets', () => {
    expect(requiresTypedConfirmation({ to: 'CANCELLED' })).toBe(true);
    expect(requiresTypedConfirmation({ to: 'IN_REPAIR' })).toBe(false);
  });

  it('counts whole minutes left and upserts newest first', () => {
    expect(minutesLeft('2026-10-30T12:10:00Z', Date.parse('2026-10-30T12:00:30Z'))).toBe(10);
    const older = agentActionFixture({ id: 'old', createdAt: '2026-10-30T10:00:00Z' });
    const updated = { ...action, status: 'EXECUTED' as const };
    expect(upsertAction([older, action], updated).map((item) => [item.id, item.status])).toEqual([
      [action.id, 'EXECUTED'],
      ['old', 'PENDING'],
    ]);
  });
});
