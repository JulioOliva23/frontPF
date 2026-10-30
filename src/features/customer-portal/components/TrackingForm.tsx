import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { toApiError } from '../../../shared/api/httpClient';
import type { CustomerWorkOrderStatus } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { FormField } from '../../../shared/components/ui/form-field';
import { customerPortalApi } from '../api/customer-portal-api';
import { RATE_LIMIT_COOLDOWN_SECONDS, TRACKING_MESSAGES } from '../lib/tracking-messages';
import { trackingSchema, type TrackingFormInput, type TrackingFormValues } from '../schemas/tracking-schema';

// FE-17 / SUP-05: number + tracking code. Sent by POST (never in the URL) and
// never persisted.
export function TrackingForm({ onFound }: { onFound: (order: CustomerWorkOrderStatus) => void }) {
  const [cooldown, setCooldown] = useState(0);
  const track = useMutation({ mutationFn: customerPortalApi.track });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackingFormInput, unknown, TrackingFormValues>({ resolver: zodResolver(trackingSchema), defaultValues: { number: '', trackingCode: '' } });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const error = toApiError(track.error);
  const message = error
    ? error.isRateLimited
      ? TRACKING_MESSAGES.rateLimited
      : error.isNotFound
        ? TRACKING_MESSAGES.notFound
        : error.statusCode === 400
          ? error.message
          : TRACKING_MESSAGES.network
    : null;

  const onSubmit = (values: TrackingFormValues) =>
    track.mutate(values, {
      onSuccess: onFound,
      onError: (caught) => toApiError(caught)?.isRateLimited && setCooldown(RATE_LIMIT_COOLDOWN_SECONDS),
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="glass-card grid gap-5 p-6 sm:p-8">
      <FormField id="tracking-number" label="Número de orden" placeholder="OT-000123" autoComplete="off" error={errors.number?.message} {...register('number')} />
      <FormField
        id="tracking-code"
        label="Código de seguimiento (impreso en su ticket)"
        placeholder="K7QM-3XPA"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        hint="No es el PIN ni el patrón de su celular."
        error={errors.trackingCode?.message}
        {...register('trackingCode')}
      />
      {message && (
        <p role="alert" className={`rounded-xl border p-3 text-sm ${error?.isRateLimited ? 'border-orange-400/25 bg-orange-400/10 text-orange-300' : 'border-red-400/25 bg-red-400/10 text-red-300'}`}>
          {message}
        </p>
      )}
      <Button type="submit" size="lg" isLoading={track.isPending} disabled={cooldown > 0}>
        {cooldown > 0 ? `Espere ${cooldown}s` : 'Consultar estado'}
      </Button>
    </form>
  );
}
