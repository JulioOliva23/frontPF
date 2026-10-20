import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

import { env } from '../config/env';
import { cleanServerMessage } from '../lib/utils';

// Body produced by AllExceptionsFilter (BE-26). `code` and `sparePartIds` are
// the whitelisted domain details (e.g. the Stock Guard, RN-09).
export interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  code?: string;
  sparePartIds?: string[];
  path?: string;
  timestamp?: string;
}

// FE-03 / FE-04: the only error type the UI handles.
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly sparePartIds: string[];
  // Validation messages (400) one per entry, already cleaned for the user.
  readonly messages: string[];

  constructor(statusCode: number, messages: string[], body?: ApiErrorBody) {
    super(messages.join(' · ') || `HTTP ${statusCode}`);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.messages = messages;
    this.code = body?.code;
    this.sparePartIds = Array.isArray(body?.sparePartIds) ? body.sparePartIds : [];
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isRateLimited(): boolean {
    return this.statusCode === 429;
  }

  get isInsufficientStock(): boolean {
    return this.statusCode === 422 && this.code === 'INSUFFICIENT_STOCK';
  }
}

export function toApiError(error: unknown): ApiError | null {
  return error instanceof ApiError ? error : null;
}

// Access token lives in memory only (FE-16).
let currentToken: string | null = null;

export function setAuthToken(token: string | null): void {
  currentToken = token;
}

// Registered by AuthProvider: refreshes the session or reports failure.
type RefreshHandler = () => Promise<boolean>;
let refreshHandler: RefreshHandler | null = null;

export function setRefreshHandler(handler: RefreshHandler | null): void {
  refreshHandler = handler;
}

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: env.apiTimeout,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (currentToken) config.headers.set('Authorization', `Bearer ${currentToken}`);
  return config;
});

const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout'];
let pendingRefresh: Promise<boolean> | null = null;

// Concurrent 401s share one refresh call (FE-03).
function refreshOnce(): Promise<boolean> {
  if (!refreshHandler) return Promise.resolve(false);
  pendingRefresh ??= refreshHandler().finally(() => {
    pendingRefresh = null;
  });
  return pendingRefresh;
}

export function normalizeMessages(body: ApiErrorBody | undefined, fallback: string): string[] {
  const raw = Array.isArray(body?.message) ? body.message : body?.message ? [body.message] : [];
  const cleaned = raw.map(cleanServerMessage).filter(Boolean);
  return cleaned.length > 0 ? cleaned : [fallback];
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status ?? 0;
    const isAuthCall = AUTH_ENDPOINTS.some((path) => (original?.url ?? '').includes(path));

    if (status === 401 && original && !original._retry && !isAuthCall && currentToken) {
      original._retry = true;
      if (await refreshOnce()) return httpClient.request(original);
    }

    const fallback = status === 0 ? 'No se pudo conectar con el servidor' : `HTTP ${status}`;
    return Promise.reject(new ApiError(status, normalizeMessages(error.response?.data, fallback), error.response?.data));
  },
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.request<T>(config);
  return response.data;
}
