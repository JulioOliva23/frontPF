import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '../../shared/api/httpClient';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Never retry client errors (403/404/422...); only network/5xx once.
        retry: (failureCount, error) => !(error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) && failureCount < 1,
      },
    },
  });
}
