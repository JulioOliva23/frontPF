// FE-17: one message for 404 so a lookup never reveals which numbers exist.
export const RATE_LIMIT_COOLDOWN_SECONDS = 60;

export const TRACKING_MESSAGES = {
  notFound: 'No encontramos una orden con esos datos. Revise el número y el código de su ticket.',
  rateLimited: 'Demasiados intentos. Espere un minuto antes de volver a intentar.',
  network: 'No pudimos consultar en este momento. Intente de nuevo.',
} as const;
