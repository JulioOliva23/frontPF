import { z } from 'zod';

import { TRACKING_CODE_PATTERN, normalizeTrackingCode, parseWorkOrderNumber } from '../../../shared/lib/tracking-code';

// FE-17: accepts the formats printed on the ticket.
export const trackingSchema = z.object({
  number: z
    .string()
    .trim()
    .min(1, 'Ingrese el número de orden')
    .transform(parseWorkOrderNumber)
    .refine((value) => Number.isInteger(value) && value >= 1, 'Número de orden inválido (ej. OT-000123)'),
  trackingCode: z
    .string()
    .transform(normalizeTrackingCode)
    .refine((value) => TRACKING_CODE_PATTERN.test(value), 'El código tiene 8 caracteres (ej. K7QM-3XPA)'),
});

export type TrackingFormInput = z.input<typeof trackingSchema>;
export type TrackingFormValues = z.output<typeof trackingSchema>;
