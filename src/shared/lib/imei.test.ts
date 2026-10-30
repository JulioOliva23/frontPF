import { describe, expect, it } from 'vitest';

import { formatImei, isValidImei, luhnChecksum, normalizeImei } from './imei';

// FE-12: same vectors as servicio_back/unit-tests/imei.spec.ts.
describe('IMEI (RN-02)', () => {
  it.each(['490154203237518', '356938035643809', '352099001761481'])('accepts Luhn-valid IMEI %s', (imei) => {
    expect(isValidImei(imei)).toBe(true);
  });

  it('rejects a wrong check digit and malformed input [002/RF-1.2]', () => {
    expect(isValidImei('490154203237519')).toBe(false);
    expect(isValidImei('49015420323751')).toBe(false);
    expect(isValidImei('49015420323751A')).toBe(false);
  });

  it('normalizes and formats for display [002/RF-1.3]', () => {
    expect(normalizeImei('35-209900-176148-1')).toBe('352099001761481');
    expect(formatImei('352099001761481')).toBe('35 209900 176148 1');
    expect(formatImei('35a20')).toBe('35 20');
    expect(luhnChecksum('79927398713')).toBe(0);
  });
});
