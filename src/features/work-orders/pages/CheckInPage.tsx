import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

import { toApiError } from '../../../shared/api/httpClient';
import type { CreatedWorkOrder } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Select } from '../../../shared/components/Select';
import { FormField, TextAreaField } from '../../../shared/components/ui/form-field';
import { formatImei, isValidImei, normalizeImei } from '../../../shared/lib/imei';
import { CosmeticChecklist } from '../components/CosmeticChecklist';
import { DeviceHistoryPanel } from '../components/DeviceHistoryPanel';
import { IntakeTicket } from '../components/IntakeTicket';
import { UnlockCodeField } from '../components/UnlockCodeField';
import { useCreateWorkOrder, useDeviceHistory, useDeviceModels } from '../hooks/use-work-orders';
import {
  CHECK_IN_DEFAULTS,
  LOCK_TYPES,
  checkInSchema,
  toCreateWorkOrderPayload,
  type CheckInFormInput,
  type CheckInFormValues,
} from '../schemas/check-in-schema';

function ImeiStatus({ imei }: { imei: string }) {
  const digits = normalizeImei(imei);
  if (digits.length < 15) return <span className="text-[0.7rem] text-muted">{digits.length}/15 dígitos</span>;
  return isValidImei(digits) ? (
    <span className="flex items-center gap-1 text-[0.7rem] font-semibold text-emerald-300">
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> IMEI válido
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[0.7rem] font-semibold text-red-300">
      <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Dígito verificador incorrecto
    </span>
  );
}

// US-F03: device check-in and work order creation in a single screen.
export function CheckInPage() {
  const navigate = useNavigate();
  const [created, setCreated] = useState<CreatedWorkOrder | null>(null);
  const models = useDeviceModels();
  const createOrder = useCreateWorkOrder();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckInFormInput, unknown, CheckInFormValues>({ resolver: zodResolver(checkInSchema), defaultValues: CHECK_IN_DEFAULTS });

  const [brand, imei, lockType] = useWatch({ control, name: ['device.brand', 'device.imei', 'lockType'] });
  const imeiDigits = normalizeImei(imei ?? '');
  const history = useDeviceHistory(isValidImei(imeiDigits) ? imeiDigits : '');

  const brands = useMemo(() => [...new Set((models.data ?? []).map((model) => model.brand))].sort(), [models.data]);
  const brandModels = useMemo(() => (models.data ?? []).filter((model) => model.brand === brand), [models.data, brand]);

  const onSubmit = async (values: CheckInFormValues) => {
    try {
      setCreated(await createOrder.mutateAsync(toCreateWorkOrderPayload(values)));
    } catch {
      // Shown from createOrder.error; rethrowing would be an unhandled rejection.
    }
  };

  if (created) {
    return (
      <IntakeTicket
        order={created}
        onOpenOrder={() => navigate(`/ordenes/${created.id}`)}
        onNewIntake={() => {
          setCreated(null);
          createOrder.reset();
          reset(CHECK_IN_DEFAULTS);
        }}
      />
    );
  }

  const serverError = toApiError(createOrder.error);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">Recepción de equipo</h1>
        <p className="text-sm text-muted">Registra el equipo y abre la orden de trabajo.</p>
      </header>

      {serverError && (
        <div role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-300">
          <p className="font-bold">No se pudo registrar la orden</p>
          <ul className="mt-1 list-disc pl-5">
            {serverError.messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Cliente</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="customer-identification" label="Documento de identidad" error={errors.customer?.identification?.message} {...register('customer.identification')} />
            <FormField id="customer-name" label="Nombre completo" error={errors.customer?.name?.message} {...register('customer.name')} />
            <FormField id="customer-phone" label="Teléfono" type="tel" inputMode="tel" error={errors.customer?.phone?.message} {...register('customer.phone')} />
            <FormField id="customer-email" label="Correo (opcional)" type="email" error={errors.customer?.email?.message} {...register('customer.email')} />
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Equipo</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="device-brand"
              label="Marca"
              placeholder={models.isLoading ? 'Cargando…' : 'Seleccione'}
              options={brands.map((name) => ({ value: name, label: name }))}
              error={errors.device?.brand?.message}
              {...register('device.brand', { onChange: () => setValue('device.deviceModelId', '') })}
            />
            <Select
              id="device-model"
              label="Modelo"
              placeholder={brand ? 'Seleccione' : 'Elija la marca primero'}
              disabled={!brand}
              options={brandModels.map((model) => ({ value: model.id, label: model.model }))}
              error={errors.device?.deviceModelId?.message}
              {...register('device.deviceModelId')}
            />
            <Controller
              control={control}
              name="device.imei"
              render={({ field }) => (
                <div className="grid gap-1">
                  <FormField
                    id="device-imei"
                    label="IMEI"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="35 209900 176148 1"
                    hint="Marque *#06# o revise la bandeja SIM"
                    error={errors.device?.imei?.message}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(formatImei(event.target.value))}
                  />
                  <ImeiStatus imei={field.value ?? ''} />
                </div>
              )}
            />
            <FormField id="device-color" label="Color" error={errors.device?.color?.message} {...register('device.color')} />
          </div>
          <div className="mt-4">
            <DeviceHistoryPanel history={history.data} isLoading={history.isFetching} />
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Ingreso</h2>
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
          <TextAreaField id="reported-problem" label="Problema reportado por el cliente" error={errors.reportedProblem?.message} {...register('reportedProblem')} />
          <FormField
            id="battery-level"
            label="Batería %"
            inputMode="numeric"
            hint="Vacío si el equipo no enciende"
            error={errors.batteryLevel?.message}
            {...register('batteryLevel')}
          />
          <FormField id="promised-at" label="Fecha compromiso" type="datetime-local" error={errors.promisedAt?.message} {...register('promisedAt')} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Estado cosmético</h2>
          <Controller
            control={control}
            name="cosmeticCheckIn"
            render={({ field }) => (
              <CosmeticChecklist value={field.value} onChange={(zone, condition) => field.onChange({ ...field.value, [zone]: condition })} />
            )}
          />
          <div className="mt-4">
            <FormField id="cosmetic-notes" label="Observaciones" error={errors.cosmeticCheckIn?.notes?.message} {...register('cosmeticCheckIn.notes')} />
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Bloqueo del equipo</h2>
          <div className="grid gap-4">
            <Select
              id="lock-type"
              label="Tipo de bloqueo"
              options={LOCK_TYPES}
              {...register('lockType', { onChange: () => setValue('unlockCode', '') })}
            />
            <Controller
              control={control}
              name="unlockCode"
              render={({ field }) => <UnlockCodeField lockType={lockType} value={field.value} onChange={field.onChange} error={errors.unlockCode?.message} />}
            />
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          Registrar orden
        </Button>
      </div>
    </form>
  );
}
