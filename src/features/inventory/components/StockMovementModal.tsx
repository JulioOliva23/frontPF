import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

import { toApiError } from '../../../shared/api/httpClient';
import type { SparePart } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { FormField } from '../../../shared/components/ui/form-field';
import { useSparePartMutations } from '../hooks/use-spare-parts';
import { stockAdjustmentSchema, stockEntrySchema } from '../schemas/spare-part-schema';

export type StockMovementKind = 'entry' | 'adjustment';

interface StockMovementModalProps {
  part: SparePart | null;
  kind: StockMovementKind;
  onClose: () => void;
}

function EntryForm({ part, onClose }: { part: SparePart; onClose: () => void }) {
  const { entry } = useSparePartMutations();
  const { register, handleSubmit, formState } = useForm<z.infer<typeof stockEntrySchema>>({
    resolver: zodResolver(stockEntrySchema),
    defaultValues: { quantity: 1, reason: '' },
  });
  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={handleSubmit(async (values) => {
        await entry.mutateAsync({ id: part.id, payload: { quantity: values.quantity, reason: values.reason || undefined } });
        onClose();
      })}
    >
      <FormField id="entry-quantity" label="Unidades recibidas" type="number" min={1} error={formState.errors.quantity?.message} {...register('quantity', { valueAsNumber: true })} />
      <FormField id="entry-reason" label="Referencia (factura / proveedor)" error={formState.errors.reason?.message} {...register('reason')} />
      {entry.error && <p role="alert" className="text-sm text-red-700">{toApiError(entry.error)?.message}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost-light" onClick={onClose}>Cancelar</Button>
        <Button type="submit" isLoading={formState.isSubmitting}>Registrar entrada</Button>
      </div>
    </form>
  );
}

function AdjustmentForm({ part, onClose }: { part: SparePart; onClose: () => void }) {
  const { adjust } = useSparePartMutations();
  const { register, handleSubmit, formState } = useForm<z.infer<typeof stockAdjustmentSchema>>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: { direction: 'OUT', quantity: 1, reason: '' },
  });
  const error = toApiError(adjust.error);
  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={handleSubmit(async (values) => {
        await adjust.mutateAsync({ id: part.id, payload: { delta: values.direction === 'OUT' ? -values.quantity : values.quantity, reason: values.reason } });
        onClose();
      })}
    >
      <fieldset className="flex gap-2">
        <legend className="mb-2 text-xs font-bold text-slate-700">Tipo de movimiento</legend>
        <label className="flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm">
          <input type="radio" value="OUT" {...register('direction')} /> Salida / merma
        </label>
        <label className="flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm">
          <input type="radio" value="IN" {...register('direction')} /> Corrección positiva
        </label>
      </fieldset>
      <FormField id="adjust-quantity" label="Unidades" type="number" min={1} error={formState.errors.quantity?.message} {...register('quantity', { valueAsNumber: true })} />
      <FormField id="adjust-reason" label="Motivo" error={formState.errors.reason?.message} {...register('reason')} />
      <p className="text-xs text-slate-500">Las unidades reservadas para órdenes ({part.reservedStock}) no pueden darse de baja.</p>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error.statusCode === 422 ? `Solo hay ${part.availableStock} unidad(es) disponibles sin reservar.` : error.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost-light" onClick={onClose}>Cancelar</Button>
        <Button type="submit" isLoading={formState.isSubmitting}>Registrar ajuste</Button>
      </div>
    </form>
  );
}

// Kardex movements: entries (IN) and manual adjustments (ADJUSTMENT, ADMIN).
export function StockMovementModal({ part, kind, onClose }: StockMovementModalProps) {
  return (
    <Modal isOpen={part !== null} onClose={onClose} title={kind === 'entry' ? 'Entrada de stock' : 'Ajuste de stock'} subtitle={part ? `${part.name} · disponible ${part.availableStock}` : undefined} maxWidth="md">
      {part && (kind === 'entry' ? <EntryForm part={part} onClose={onClose} /> : <AdjustmentForm part={part} onClose={onClose} />)}
    </Modal>
  );
}
