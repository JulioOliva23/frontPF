import { z } from 'zod';

import type { CreateBudgetPayload } from '../../../shared/api/types';

const MONEY = /^\d{1,10}(\.\d{1,2})?$/;
const quantity = z.number({ message: 'Cantidad inválida' }).int('Cantidad entera').min(1, 'Mínimo 1').max(50, 'Máximo 50');

// FE-11: mirrors BudgetItemInputDto. PART prices come from the catalog, so
// the form never sends them (RN-10 / BE-12).
const laborItem = z.object({
  itemType: z.literal('LABOR'),
  description: z.string().trim().min(3, 'Describa el trabajo').max(255, 'Máximo 255 caracteres'),
  quantity,
  unitPrice: z.string().trim().regex(MONEY, 'Monto inválido (ej. 150.00)'),
});

const partItem = z.object({
  itemType: z.literal('PART'),
  sparePartId: z.string().min(1, 'Seleccione un repuesto'),
  description: z.string().trim().min(3).max(255),
  quantity,
});

export const budgetSchema = z.object({
  items: z.array(z.discriminatedUnion('itemType', [laborItem, partItem])).min(1, 'Agregue al menos un ítem').max(50, 'Máximo 50 ítems'),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;

export function toCreateBudgetPayload(values: BudgetFormValues): CreateBudgetPayload {
  return {
    items: values.items.map((item) =>
      item.itemType === 'LABOR'
        ? { itemType: 'LABOR', description: item.description, quantity: item.quantity, unitPrice: item.unitPrice }
        : { itemType: 'PART', description: item.description, quantity: item.quantity, sparePartId: item.sparePartId },
    ),
  };
}
