import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';

import { toApiError } from '../../../shared/api/httpClient';
import type { DeviceModel } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { useToast } from '../../../shared/components/toast-context';
import { FormField } from '../../../shared/components/ui/form-field';
import { useDeviceModelMutations } from '../hooks/use-admin';
import { canonicalBrand, deviceModelSchema, groupByBrand, type DeviceModelFormValues } from '../schemas/device-model-schema';

const EMPTY: DeviceModelFormValues = { brand: '', model: '' };

// US-F14: inline form (POST /device-models). Existing brands are suggested
// so "Apple" is not typed three different ways; the brand stays filled after
// saving to add several models of the same brand in a row.
export function DeviceModelQuickAdd({ catalog }: { catalog: readonly DeviceModel[] }) {
  const { create } = useDeviceModelMutations();
  const toast = useToast();
  const schema = useMemo(() => deviceModelSchema(catalog), [catalog]);
  const brands = useMemo(() => groupByBrand(catalog).map((group) => group.brand), [catalog]);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<DeviceModelFormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  const onSubmit = async (values: DeviceModelFormValues) => {
    try {
      const saved = await create.mutateAsync({ ...values, brand: canonicalBrand(values.brand, catalog) });
      toast.success('Modelo agregado', `${saved.brand} ${saved.model}`);
      reset({ brand: saved.brand, model: '' });
      setFocus('model');
    } catch (error) {
      setError('model', {
        message: toApiError(error)?.isConflict ? 'Este modelo ya está registrado para esa marca' : (toApiError(error)?.message ?? 'No se pudo guardar'),
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Agregar modelo"
      className="grid items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto]"
    >
      <FormField id="model-brand" label="Marca" list="model-brand-options" autoComplete="off" placeholder="Ej. Samsung" error={errors.brand?.message} {...register('brand')} />
      <datalist id="model-brand-options">
        {brands.map((brand) => (
          <option key={brand} value={brand} />
        ))}
      </datalist>
      <FormField id="model-name" label="Modelo" autoComplete="off" placeholder="Ej. Galaxy A54" error={errors.model?.message} {...register('model')} />
      <Button type="submit" isLoading={isSubmitting} leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />} className="sm:mt-[25px]">
        Agregar
      </Button>
    </form>
  );
}
