import { describe, expect, it } from 'vitest';

import { CHECK_IN_DEFAULTS, checkInSchema, toCreateWorkOrderPayload, type CheckInFormInput } from './check-in-schema';

function intake(overrides: Partial<CheckInFormInput> = {}): CheckInFormInput {
  return {
    ...CHECK_IN_DEFAULTS,
    customer: { identification: '8456123 LP', name: 'María Quispe', phone: '', email: '' },
    device: { brand: 'Apple', deviceModelId: 'm1', imei: '35 209900 176148 1', color: '' },
    reportedProblem: 'Pantalla rota tras caída',
    ...overrides,
  };
}

const issuePaths = (input: CheckInFormInput) => {
  const result = checkInSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
};

describe('check-in schema (RN-01, RN-02, RN-03)', () => {
  it('accepts a formatted, Luhn-valid IMEI and normalizes it [002/RF-1.3]', () => {
    const result = checkInSchema.safeParse(intake());
    expect(result.success).toBe(true);
    expect(result.success && result.data.device.imei).toBe('352099001761481');
  });

  it('rejects an IMEI whose check digit is wrong before submitting (RN-02) [002/RF-1.2]', () => {
    const result = checkInSchema.safeParse(intake({ device: { ...intake().device, imei: '352099001761482' } }));
    expect(result.success).toBe(false);
    expect(!result.success && result.error.issues[0].message).toMatch(/dígito verificador/);
  });

  it.each([
    ['PIN', '12'],
    ['PIN', ''],
    ['PATTERN', '1-2'],
  ] as const)('rejects lock %s with code %p (RN-03)', (lockType, unlockCode) => {
    expect(issuePaths(intake({ lockType, unlockCode }))).toContain('unlockCode');
  });

  it('accepts a 4-node pattern and a device without lock [002/RF-4.2]', () => {
    expect(issuePaths(intake({ lockType: 'PATTERN', unlockCode: '1-5-9-6' }))).toEqual([]);
    expect(issuePaths(intake({ lockType: 'NONE', unlockCode: '' }))).toEqual([]);
  });

  it('rejects battery above 100 and a past promise date [002/RF-3.3] [002/RF-3.4]', () => {
    expect(issuePaths(intake({ batteryLevel: '120', promisedAt: '2000-01-01T10:00' }))).toEqual(expect.arrayContaining(['batteryLevel', 'promisedAt']));
  });

  it('leaves the battery out of the payload when it is not informed, e.g. a phone that does not turn on [002/RF-3.2]', () => {
    const parsed = checkInSchema.parse(intake({ batteryLevel: '' }));
    // What travels to the server is the JSON of the payload: no battery key at all.
    expect(JSON.parse(JSON.stringify(toCreateWorkOrderPayload(parsed)))).not.toHaveProperty('batteryLevel');
    expect(issuePaths(intake({ batteryLevel: '' }))).not.toContain('batteryLevel');
  });

  it('builds the API payload without empty fields nor an unlock code for NONE [002/RF-4.3]', () => {
    const parsed = checkInSchema.parse(intake({ batteryLevel: '35', lockType: 'NONE', unlockCode: '' }));
    const payload = toCreateWorkOrderPayload(parsed);
    expect(payload).toMatchObject({ batteryLevel: 35, lockType: 'NONE', device: { imei: '352099001761481', deviceModelId: 'm1' } });
    expect(payload.unlockCode).toBeUndefined();
    expect(payload.customer.phone).toBeUndefined();
    expect(payload.device).not.toHaveProperty('brand');
  });
});
