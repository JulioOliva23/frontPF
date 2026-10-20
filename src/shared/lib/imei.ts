// FE-12: verbatim copy of servicio_back/src/domain/devices/imei.ts. Keep both in sync (same tests).
// RN-02: an IMEI is exactly 15 decimal digits whose last digit is the Luhn
// check digit of the first 14 (3GPP TS 23.003).
const IMEI_PATTERN = /^\d{15}$/;

export function isValidImei(value: string): boolean {
  if (!IMEI_PATTERN.test(value)) return false;
  return luhnChecksum(value) === 0;
}

// Returns (sum mod 10) over the full number; 0 means the check digit matches.
export function luhnChecksum(digits: string): number {
  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    let digit = digits.charCodeAt(digits.length - 1 - index) - 48;
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10;
}

// Accepts common human formats ("35-209900-176148-1", spaces) before validating.
export function normalizeImei(raw: string): string {
  return raw.replace(/[\s-]/g, '');
}

// Visual grouping for the check-in form: "35 209900 176148 1".
export function formatImei(digits: string): string {
  const clean = digits.replace(/\D/g, '').slice(0, 15);
  return [clean.slice(0, 2), clean.slice(2, 8), clean.slice(8, 14), clean.slice(14)].filter(Boolean).join(' ');
}
