import { describe, expect, it } from 'vitest';

import { deviceModelSchema, groupByBrand, matchesModelSearch } from './device-model-schema';
import { createUserSchema, resetPasswordSchema, updateUserSchema } from './user-schemas';

const valid = { username: 'Tecnico.01', fullName: 'Ana Pérez', role: 'TECHNICIAN', password: 'Segura12345', confirmPassword: 'Segura12345' };

describe('createUserSchema (mirrors CreateUserDto)', () => {
  it('normalizes the username to lowercase [008/RF-2.2]', () => {
    expect(createUserSchema.parse(valid).username).toBe('tecnico.01');
  });

  it.each([
    ['sinmayuscula1', 'Debe incluir una mayúscula'],
    ['SINMINUSCULA1', 'Debe incluir una minúscula'],
    ['SinNumeroAqui', 'Debe incluir un número'],
    ['Corta1', 'Mínimo 10 caracteres'],
  ])('rejects the password "%s"', (password, message) => {
    const result = createUserSchema.safeParse({ ...valid, password, confirmPassword: password });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(message);
  });

  it('rejects usernames with spaces or symbols [008/RF-2.2]', () => {
    expect(createUserSchema.safeParse({ ...valid, username: 'ana perez' }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...valid, username: 'ana@taller' }).success).toBe(false);
  });

  it('never offers the CUSTOMER role (RN-14) [008/RF-2.4]', () => {
    expect(createUserSchema.safeParse({ ...valid, role: 'CUSTOMER' }).success).toBe(false);
  });

  it('requires both passwords to match [008/RF-2.3]', () => {
    const result = resetPasswordSchema.safeParse({ password: 'Segura12345', confirmPassword: 'Segura12346' });
    expect(result.error?.issues[0]).toMatchObject({ path: ['confirmPassword'], message: 'Las contraseñas no coinciden' });
  });

  it('lets an edit omit the role [008/RF-3.2]', () => {
    expect(updateUserSchema.parse({ fullName: ' Ana ' + 'Rojas ' })).toEqual({ fullName: 'Ana Rojas' });
  });
});

describe('device model catalog helpers', () => {
  const catalog = [
    { id: '1', brand: 'Apple', model: 'iPhone 13', isActive: true },
    { id: '2', brand: 'apple', model: 'iPhone 9', isActive: true },
    { id: '3', brand: 'Samsung', model: 'Galaxy A10', isActive: false },
  ];

  it('groups case-insensitively and sorts numbers naturally [008/RF-5.1]', () => {
    const groups = groupByBrand(catalog);
    expect(groups.map((group) => group.brand)).toEqual(['Apple', 'Samsung']);
    expect(groups[0].models.map((entry) => entry.model)).toEqual(['iPhone 9', 'iPhone 13']);
  });

  it('flags a duplicate even with other case or spaces, also for inactive models [008/RF-6.2]', () => {
    const schema = deviceModelSchema(catalog);
    expect(schema.safeParse({ brand: 'APPLE', model: ' iphone 13 ' }).success).toBe(false);
    expect(schema.safeParse({ brand: 'samsung', model: 'galaxy a10' }).success).toBe(false);
    expect(schema.safeParse({ brand: 'Apple', model: 'iPhone 14' }).success).toBe(true);
  });

  it('searches brand and model together [008/RF-5.3]', () => {
    expect(matchesModelSearch(catalog[0], 'apple 13')).toBe(true);
    expect(matchesModelSearch(catalog[0], 'galaxy')).toBe(false);
    expect(matchesModelSearch(catalog[0], '  ')).toBe(true);
  });
});
