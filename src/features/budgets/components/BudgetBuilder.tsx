import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';

import { toApiError } from '../../../shared/api/httpClient';
import type { SparePart } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { Select } from '../../../shared/components/Select';
import { formatBoB } from '../../../shared/lib/money';
import { useCompatibleParts, useCreateBudget } from '../hooks/use-budgets';
import { LABOR_PRESETS, centsToAmount, toCents } from '../lib/budget-status';
import { budgetSchema, toCreateBudgetPayload, type BudgetFormValues } from '../schemas/budget-schema';

interface BudgetBuilderProps {
  workOrderId: string;
  deviceModelId: string;
  deviceLabel: string;
  onCreated: () => void;
}

const inputClass =
  'min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/15 aria-[invalid=true]:border-red-500';

// US-F05: labor lines priced by the front desk + compatible parts priced by
// the catalog. The preview total is informative; the backend computes the
// real one with Decimal arithmetic (RN-15).
export function BudgetBuilder({ workOrderId, deviceModelId, deviceLabel, onCreated }: BudgetBuilderProps) {
  const parts = useCompatibleParts(deviceModelId);
  const create = useCreateBudget(workOrderId);
  const [partToAdd, setPartToAdd] = useState('');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({ resolver: zodResolver(budgetSchema), defaultValues: { items: [] } });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = useWatch({ control, name: 'items' }) ?? [];

  const partsById = new Map<string, SparePart>((parts.data?.data ?? []).map((part) => [part.id, part]));
  const previewCents = items.reduce((sum, item) => {
    const unit = item.itemType === 'LABOR' ? toCents(item.unitPrice ?? '') : toCents(partsById.get(item.sparePartId)?.workshopPrice ?? '0');
    return sum + unit * (Number.isFinite(item.quantity) ? item.quantity : 0);
  }, 0);

  const addPart = () => {
    const part = partsById.get(partToAdd);
    if (!part) return;
    append({ itemType: 'PART', sparePartId: part.id, description: part.name, quantity: 1 });
    setPartToAdd('');
  };

  const onSubmit = async (values: BudgetFormValues) => {
    try {
      await create.mutateAsync(toCreateBudgetPayload(values));
      onCreated();
    } catch {
      // Shown below from create.error; rethrowing would be an unhandled rejection.
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Nueva versión de presupuesto</h2>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Select
          id="part-to-add"
          label={`Repuestos compatibles con ${deviceLabel}`}
          placeholder={parts.isLoading ? 'Cargando…' : (parts.data?.total ?? 0) === 0 ? 'No hay repuestos compatibles' : 'Seleccione un repuesto'}
          value={partToAdd}
          onChange={(event) => setPartToAdd(event.target.value)}
          options={(parts.data?.data ?? []).map((part) => ({
            value: part.id,
            label: `${part.name} · ${formatBoB(part.workshopPrice)} · disp. ${part.availableStock}`,
          }))}
        />
        <Button type="button" variant="outline-light" leftIcon={<Plus className="h-4 w-4" />} disabled={!partToAdd} onClick={addPart}>
          Agregar repuesto
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {LABOR_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => append({ itemType: 'LABOR', description: preset, quantity: 1, unitPrice: '' })}
            className="min-h-[44px] rounded-full border border-dashed border-slate-300 px-3 text-xs font-semibold text-slate-600 hover:border-cyan-500 hover:text-cyan-800"
          >
            + {preset}
          </button>
        ))}
      </div>

      {fields.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="py-2">Tipo</th>
                <th scope="col" className="py-2">Descripción</th>
                <th scope="col" className="w-20 py-2">Cant.</th>
                <th scope="col" className="w-32 py-2">Precio unit.</th>
                <th scope="col" className="w-12 py-2">
                  <span className="sr-only">Quitar</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fields.map((field, index) => {
                const itemErrors = errors.items?.[index];
                const isLabor = field.itemType === 'LABOR';
                return (
                  <tr key={field.id}>
                    <td className="py-2 pr-2 text-xs font-bold text-slate-500">{isLabor ? 'Mano de obra' : 'Repuesto'}</td>
                    <td className="py-2 pr-2">
                      <input
                        aria-label={`Descripción del ítem ${index + 1}`}
                        className={inputClass}
                        aria-invalid={Boolean(itemErrors?.description)}
                        readOnly={!isLabor}
                        {...register(`items.${index}.description`)}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        aria-label={`Cantidad del ítem ${index + 1}`}
                        type="number"
                        min={1}
                        max={50}
                        className={inputClass}
                        aria-invalid={Boolean(itemErrors?.quantity)}
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      {isLabor ? (
                        <input
                          aria-label={`Precio del ítem ${index + 1}`}
                          inputMode="decimal"
                          placeholder="0.00"
                          className={inputClass}
                          aria-invalid={Boolean(itemErrors && 'unitPrice' in itemErrors && itemErrors.unitPrice)}
                          {...register(`items.${index}.unitPrice` as const)}
                        />
                      ) : (
                        <span className="text-xs text-slate-600">{formatBoB(partsById.get((items[index] as { sparePartId?: string })?.sparePartId ?? '')?.workshopPrice)}</span>
                      )}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        aria-label={`Quitar ítem ${index + 1}`}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {errors.items?.root?.message && <p role="alert" className="text-xs text-red-700">{errors.items.root.message}</p>}
      {errors.items?.message && <p role="alert" className="text-xs text-red-700">{errors.items.message}</p>}
      {Array.isArray(errors.items) && errors.items.some(Boolean) && (
        <p role="alert" className="text-xs text-red-700">Revise los campos marcados en rojo.</p>
      )}
      {create.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {toApiError(create.error)?.message}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <p className="text-sm">
          Total estimado: <strong data-testid="budget-preview-total">{formatBoB(centsToAmount(previewCents))}</strong>
        </p>
        <Button type="submit" isLoading={isSubmitting} disabled={fields.length === 0}>
          Guardar borrador
        </Button>
      </div>
    </form>
  );
}
