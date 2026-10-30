import { describe, expect, it } from 'vitest';

import type { Budget } from '../../../shared/api/types';
import { centsToAmount, daysUntilExpiry, effectiveBudgetStatus, toCents } from './budget-status';

const budget = (overrides: Partial<Budget>): Budget => ({
  id: 'b1',
  workOrderId: 'wo',
  version: 1,
  status: 'SENT',
  laborSubtotal: '0.00',
  partsSubtotal: '0.00',
  total: '0.00',
  currency: 'BOB',
  expiresAt: '2026-10-20T12:00:00.000Z',
  sentAt: null,
  decidedAt: null,
  decisionChannel: null,
  rejectionReason: null,
  items: [],
  ...overrides,
});

describe('budget helpers (RN-08 / RN-15)', () => {
  it('previews totals in integer cents, without floating point drift [005/RF-2.6]', () => {
    expect(toCents('0.10') + toCents('0.20')).toBe(30);
    expect(centsToAmount(toCents('150.10') + 2 * toCents('0.20'))).toBe('150.50');
    expect(toCents('abc')).toBe(0);
  });

  it('treats a SENT budget past its expiry as expired (SUP-04) [005/RF-5.2]', () => {
    const now = new Date('2026-10-21T00:00:00Z').getTime();
    expect(effectiveBudgetStatus(budget({}), now)).toBe('EXPIRED');
    expect(effectiveBudgetStatus(budget({ status: 'APPROVED' }), now)).toBe('APPROVED');
    expect(daysUntilExpiry(budget({}), new Date('2026-10-18T12:00:00Z').getTime())).toBe(2);
  });
});
