import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { toApiError } from '../../../shared/api/httpClient';
import type { SparePart } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { Select } from '../../../shared/components/Select';
import { FormField } from '../../../shared/components/ui/form-field';
import { SPARE_PART_CATEGORY_LABELS } from '../api/spare-parts-api';
import { useSparePartMutations } from '../hooks/use-spare-parts';
import { sparePartSchema, toSparePartPayload, type SparePartFormInput, type SparePartFormValues } from '../schemas/spare-part-schema';
import { DeviceModelPicker } from './DeviceModelPicker';

interface SparePartFormModalProps {
  isOpen: boolean;
  part: SparePart | null;
  onClose: () => void;
}

const CATEGORY_OPTIONS = Object.entries(SPARE_PART_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

// ADMIN only (BE-29). Edit cannot change the SKU (UpdateSparePartDto).
export function SparePartFormModal({ isOpen, part, onClose }: SparePartFormModalProps) {
  const { create, update } = useSparePartMutations();
  const mutation = part ? update : create;
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SparePartFormInput, unknown, SparePartFormValues>({
    resolver: zodResolver(sparePartSchema),
    values: part
      ? {
          sku: part.sku,
          name: part.name,
          category: part.category,
          unitCost: part.unitCost ?? '',
          workshopPrice: part.workshopPrice ?? '',
          minStock: part.minStock,
          compatibleDeviceModelIds: part.compatibleDeviceModelIds,
        }
      : { sku: '', name: '', category: 'DISPLAY_OLED', unitCost: '', workshopPrice: '', minStock: 1, compatibleDeviceModelIds: [] },
  });

  const onSubmit = async (values: SparePartFormValues) => {
    if (part) {
      const { sku: _sku, ...changes } = toSparePartPayload(values);
      await update.mutateAsync({ id: part.id, payload: changes });
    } else {
      await create.mutateAsync(toSparePartPayload(values));
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={part ? 'Editar repuesto' : 'Nuevo repuesto'} maxWidth="xl">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="part-sku" label="SKU" disabled={Boolean(part)} error={errors.sku?.message} {...register('sku')} />
          <Select id="part-category" label="Categoría" options={CATEGORY_OPTIONS} error={errors.category?.message} {...register('category')} />
          <div className="sm:col-span-2">
            <FormField id="part-name" label="Nombre" error={errors.name?.message} {...register('name')} />
          </div>
          <FormField id="part-cost" label="Costo unitario (BOB)" inputMode="decimal" error={errors.unitCost?.message} {...register('unitCost')} />
          <FormField id="part-price" label="Precio taller (BOB)" inputMode="decimal" error={errors.workshopPrice?.message} {...register('workshopPrice')} />
          <FormField id="part-min" label="Stock mínimo" type="number" min={0} error={errors.minStock?.message} {...register('minStock', { valueAsNumber: true })} />
        </div>
        <Controller
          control={control}
          name="compatibleDeviceModelIds"
          render={({ field }) => <DeviceModelPicker value={field.value} onChange={field.onChange} />}
        />
        {mutation.error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {toApiError(mutation.error)?.statusCode === 409 ? 'Ya existe un repuesto con ese SKU.' : toApiError(mutation.error)?.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost-light" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
