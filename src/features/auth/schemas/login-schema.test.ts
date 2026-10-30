import { describe, expect, it } from 'vitest';

import { loginSchema } from './login-schema';

// US-00 / FE-08: the login form only requires non-empty username and password.
describe('login-schema', () => {
  it('accepts valid credentials [001/RF-1.1]', () => {
    const result = loginSchema.safeParse({ username: 'recep01', password: 'Servicio2026!' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty username [001/RF-1.1]', () => {
    const result = loginSchema.safeParse({ username: '', password: 'x' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El nombre de usuario es obligatorio');
    }
  });

  it('rejects a username longer than 80 characters [001/RF-1.1]', () => {
    const result = loginSchema.safeParse({ username: 'u'.repeat(81), password: 'x' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Máximo 80 caracteres');
    }
  });

  it('rejects an empty password [001/RF-1.1]', () => {
    const result = loginSchema.safeParse({ username: 'recep01', password: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('La contraseña es obligatoria');
    }
  });
});