const apiTimeout = Number(import.meta.env.VITE_API_TIMEOUT ?? 10_000);

export const env = {
  apiUrl: import.meta.env.VITE_API_URL?.trim() || '/api/v1',
  apiTimeout: Number.isFinite(apiTimeout) && apiTimeout > 0 ? apiTimeout : 10_000,
} as const;
