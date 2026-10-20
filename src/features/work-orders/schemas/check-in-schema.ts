import { z } from 'zod';

import type { CosmeticCondition, CreateWorkOrderPayload, LockType } from '../../../shared/api/types';
import { isValidImei, normalizeImei } from '../../../shared/lib/imei';

export const COSMETIC_ZONES = [
  { key: 'screen', label: 'Pantalla' },
  { key: 'backCover', label: 'Tapa trasera' },
  { key: 'frame', label: 'Marco / bordes' },
  { key: 'cameraLens', label: 'Lente de cámara' },
  { key: 'buttons', label: 'Botones' },
] as const;

export type CosmeticZone = (typeof COSMETIC_ZONES)[number]['key'];

export const COSMETIC_CONDITIONS: ReadonlyArray<{ value: CosmeticCondition; label: string }> = [
  { value: 'OK', label: 'Sin daños' },
  { value: 'SCRATCHED', label: 'Rayado' },
  { value: 'DENTED', label: 'Golpeado' },
  { value: 'CRACKED', label: 'Roto / fisurado' },
  { value: 'MISSING', label: 'Faltante' },
];

export const LOCK_TYPES: ReadonlyArray<{ value: LockType; label: string }> = [
  { value: 'NONE', label: 'Sin bloqueo' },
  { value: 'PIN', label: 'PIN' },
  { value: 'PATTERN', label: 'Patrón' },
  { value: 'PASSWORD', label: 'Contraseña' },
];

// FE-13: same formats as the backend validator (RN-03).
const UNLOCK_CODE_RULES: Record<Exclude<LockType, 'NONE'>, { pattern: RegExp; message: string }> = {
  PIN: { pattern: /^\d{4,16}$/, message: 'El PIN debe tener entre 4 y 16 dígitos' },
  PATTERN: { pattern: /^[1-9](-[1-9]){3,8}$/, message: 'El patrón debe unir al menos 4 puntos' },
  PASSWORD: { pattern: /^[\s\S]{1,64}$/, message: 'La contraseña admite hasta 64 caracteres' },
};

const condition = z.enum(['OK', 'SCRATCHED', 'CRACKED', 'DENTED', 'MISSING']);
const optionalText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);

export const checkInSchema = z
  .object({
    customer: z.object({
      identification: z.string().trim().min(4, 'Mínimo 4 caracteres').max(50, 'Máximo 50 caracteres'),
      name: z.string().trim().min(3, 'Ingrese el nombre completo').max(150, 'Máximo 150 caracteres'),
      phone: z
        .string()
        .trim()
        .refine((value) => value === '' || /^\+?[0-9 ]{7,20}$/.test(value), 'Teléfono inválido'),
      email: z
        .string()
        .trim()
        .refine((value) => value === '' || z.email().safeParse(value).success, 'Correo inválido'),
    }),
    device: z.object({
      brand: z.string().min(1, 'Seleccione la marca'),
      deviceModelId: z.string().min(1, 'Seleccione el modelo'),
      // RN-02: Luhn check on the normalized digits, before anything is sent.
      imei: z
        .string()
        .transform(normalizeImei)
        .refine((value) => /^\d{15}$/.test(value), 'El IMEI tiene 15 dígitos')
        .refine(isValidImei, 'IMEI inválido: el dígito verificador no coincide'),
      color: optionalText(40),
    }),
    reportedProblem: z.string().trim().min(5, 'Describa el problema (mínimo 5 caracteres)').max(1000, 'Máximo 1000 caracteres'),
    batteryLevel: z
      .string()
      .trim()
      .refine((value) => value === '' || (/^\d{1,3}$/.test(value) && Number(value) <= 100), 'Entre 0 y 100'),
    cosmeticCheckIn: z.object({
      screen: condition,
      backCover: condition,
      frame: condition,
      cameraLens: condition,
      buttons: condition,
      notes: optionalText(500),
    }),
    lockType: z.enum(['NONE', 'PIN', 'PATTERN', 'PASSWORD']),
    unlockCode: z.string(),
    promisedAt: z
      .string()
      .refine((value) => value === '' || new Date(value).getTime() > Date.now(), 'La fecha compromiso debe ser futura'),
  })
  .superRefine((data, ctx) => {
    if (data.lockType === 'NONE') return;
    const rule = UNLOCK_CODE_RULES[data.lockType];
    if (!rule.pattern.test(data.unlockCode)) {
      ctx.addIssue({ code: 'custom', path: ['unlockCode'], message: data.unlockCode ? rule.message : 'Ingrese el código de desbloqueo' });
    }
  });

export type CheckInFormInput = z.input<typeof checkInSchema>;
export type CheckInFormValues = z.output<typeof checkInSchema>;

export const CHECK_IN_DEFAULTS: CheckInFormInput = {
  customer: { identification: '', name: '', phone: '', email: '' },
  device: { brand: '', deviceModelId: '', imei: '', color: '' },
  reportedProblem: '',
  batteryLevel: '',
  cosmeticCheckIn: { screen: 'OK', backCover: 'OK', frame: 'OK', cameraLens: 'OK', buttons: 'OK', notes: '' },
  lockType: 'NONE',
  unlockCode: '',
  promisedAt: '',
};

const blankToUndefined = (value: string) => (value === '' ? undefined : value);

// Maps the form to CreateWorkOrderDto: empty strings are omitted (the backend
// rejects unknown/empty fields) and the unlock code is only sent when needed.
export function toCreateWorkOrderPayload(values: CheckInFormValues): CreateWorkOrderPayload {
  const { notes, ...zones } = values.cosmeticCheckIn;
  return {
    customer: {
      identification: values.customer.identification,
      name: values.customer.name,
      phone: blankToUndefined(values.customer.phone),
      email: blankToUndefined(values.customer.email),
    },
    device: { imei: values.device.imei, deviceModelId: values.device.deviceModelId, color: blankToUndefined(values.device.color) },
    reportedProblem: values.reportedProblem,
    batteryLevel: values.batteryLevel === '' ? undefined : Number(values.batteryLevel),
    cosmeticCheckIn: { ...zones, notes: blankToUndefined(notes) },
    lockType: values.lockType,
    unlockCode: values.lockType === 'NONE' ? undefined : values.unlockCode,
    promisedAt: values.promisedAt === '' ? undefined : new Date(values.promisedAt).toISOString(),
  };
}
