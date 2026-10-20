import { z } from 'zod';

import type { CreateSparePartPayload, SparePartCategory } from '../../../shared/api/types';
import { SPARE_PART_CATEGORY_LABELS } from '../api/spare-parts-api';

const MONEY = /^\d{1,10}(\.\d{1,2})?$/;
const CATEGORIES = Object.keys(SPARE_PART_CATEGORY_LABELS) as [SparePartCategory, ...SparePartCategory[]];

// FE-11: mirrors CreateSparePartDto.
export const sparePartSchema = z.object({
  sku: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9-]{3,50}$/, 'SKU: 3 a 50 letras, números o guiones')),
  name: z.string().trim().min(3, 'Mínimo 3 caracteres').max(150, 'Máximo 150 caracteres'),
  category: z.enum(CATEGORIES, { message: 'Seleccione una categoría' }),
  unitCost: z.string().trim().regex(MONEY, 'Monto inválido (ej. 650.00)'),
  workshopPrice: z.string().trim().regex(MONEY, 'Monto inválido (ej. 980.00)'),
  minStock: z.number({ message: 'Ingrese un número' }).int().min(0, 'Mínimo 0').max(10_000),
  compatibleDeviceModelIds: z.array(z.string()).max(200),
});

export type SparePartFormInput = z.input<typeof sparePartSchema>;
export type SparePartFormValues = z.output<typeof sparePartSchema>;

export const stockEntrySchema = z.object({
  quantity: z.number({ message: 'Ingrese un número' }).int().min(1, 'Mínimo 1').max(10_000),
  reason: z.string().trim().max(500),
});

// Salidas / mermas: negative delta, always with a reason (kardex ADJUSTMENT).
export const stockAdjustmentSchema = z.object({
  direction: z.enum(['IN', 'OUT']),
  quantity: z.number({ message: 'Ingrese un número' }).int().min(1, 'Mínimo 1').max(10_000),
  reason: z.string().trim().min(5, 'Explique el motivo (mínimo 5 caracteres)').max(500),
});

export function toSparePartPayload(values: SparePartFormValues): CreateSparePartPayload {
  return { ...values };
}
