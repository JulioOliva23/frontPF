import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

import { env } from '../config/env';
import { cleanServerMessage } from '../lib/utils';

// Body produced by NestJS: the default `{ statusCode, message, error }` plus
// what AllExceptionsFilter adds (BE-26). `code` and `sparePartIds` are the
// whitelisted domain details (e.g. the Stock Guard, RN-09).
export interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  code?: string;
  sparePartIds?: string[];
  path?: string;
  timestamp?: string;
}

// Proxies and gateways may answer with HTML or plain text; only a JSON
// object is read as an ApiErrorBody.
function asErrorBody(data: unknown): ApiErrorBody | undefined {
  return typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as ApiErrorBody) : undefined;
}

// Shown when the server sends no usable message.
const FALLBACK_MESSAGES: Readonly<Record<number, string>> = {
  0: 'No se pudo conectar con el servidor',
  400: 'La solicitud tiene datos inválidos',
  401: 'Tu sesión expiró, vuelve a iniciar sesión',
  403: 'No tienes permiso para realizar esta acción',
  404: 'No se encontró el recurso solicitado',
  409: 'El recurso cambió o ya existe',
  422: 'La operación no cumple las reglas del negocio',
  429: 'Demasiados intentos, espera un momento',
};

export function fallbackMessage(statusCode: number): string {
  return FALLBACK_MESSAGES[statusCode] ?? (statusCode >= 500 ? 'Error interno del servidor' : `Error inesperado (HTTP ${statusCode})`);
}

// FE-03 / FE-04: the only error type the UI handles.
export class ApiError extends Error {
  // 0 means the request never got an HTTP answer (network, CORS, timeout).
  readonly statusCode: number;
  // Nest's short reason phrase ("Bad Request", "Conflict"...), when sent.
  readonly error?: string;
  readonly code?: string;
  readonly sparePartIds: string[];
  // Validation messages (400) one per entry, already cleaned for the user.
  readonly messages: string[];
  readonly path?: string;

  constructor(statusCode: number, messages: string[], body?: ApiErrorBody) {
    super(messages.join(' · ') || fallbackMessage(statusCode));
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.messages = messages;
    this.error = typeof body?.error === 'string' ? body.error : undefined;
    this.code = typeof body?.code === 'string' ? body.code : undefined;
    this.sparePartIds = Array.isArray(body?.sparePartIds) ? body.sparePartIds : [];
    this.path = typeof body?.path === 'string' ? body.path : undefined;
  }

  get isNetworkError(): boolean {
    return this.statusCode === 0;
  }

  get isValidation(): boolean {
    return this.statusCode === 400;
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isConflict(): boolean {
    return this.statusCode === 409;
  }

  get isUnprocessable(): boolean {
    return this.statusCode === 422;
  }

  get isRateLimited(): boolean {
    return this.statusCode === 429;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }

  get isInsufficientStock(): boolean {
    return this.statusCode === 422 && this.code === 'INSUFFICIENT_STOCK';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function toApiError(error: unknown): ApiError | null {
  return isApiError(error) ? error : null;
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

// Registered by the app shell: called once the session is lost (a 401 the
// refresh could not recover), after AuthProvider has cleared its state.
type SessionExpiredHandler = () => void;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  sessionExpiredHandler = handler;
}

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: env.apiTimeout,
  // SUP-07: lets the browser send the httpOnly refresh cookie once the
  // backend issues it. Cross-origin setups need CORS `credentials: true`.
  withCredentials: true,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout'];
let pendingRefresh: Promise<boolean> | null = null;
let notifiedRefresh: Promise<boolean> | null = null;

function isAuthCall(config: { url?: string } | undefined): boolean {
  return AUTH_ENDPOINTS.some((path) => (config?.url ?? '').includes(path));
}

// Concurrent 401s share one refresh call (FE-03).
function refreshOnce(): Promise<boolean> {
  if (!refreshHandler) return Promise.resolve(false);
  pendingRefresh ??= refreshHandler().finally(() => {
    pendingRefresh = null;
  });
  return pendingRefresh;
}

// Requests issued while a refresh is running wait for it (the queue) instead
// of going out with the expired token and failing with a 401 of their own.
type TrackedConfig = InternalAxiosRequestConfig & { _retry?: boolean; _sentToken?: string | null };

httpClient.interceptors.request.use(async (config: TrackedConfig) => {
  if (pendingRefresh && !isAuthCall(config)) await pendingRefresh;
  // Remembered so a late 401 can tell whether its token was already replaced.
  config._sentToken = currentToken;
  if (currentToken) config.headers.set('Authorization', `Bearer ${currentToken}`);
  return config;
});

export function normalizeMessages(body: ApiErrorBody | undefined, fallback: string): string[] {
  const raw = Array.isArray(body?.message) ? body.message : body?.message ? [body.message] : [];
  const cleaned = raw.map(cleanServerMessage).filter(Boolean);
  return cleaned.length > 0 ? cleaned : [fallback];
}

function statusOf(error: AxiosError): number {
  return error.response?.status ?? 0;
}

function fallbackFor(error: AxiosError): string {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'El servidor tardó demasiado en responder';
  return fallbackMessage(statusOf(error));
}

export function toApiErrorFromAxios(error: AxiosError): ApiError {
  const body = asErrorBody(error.response?.data);
  return new ApiError(statusOf(error), normalizeMessages(body, fallbackFor(error)), body);
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as TrackedConfig | undefined;

    if (statusOf(error) === 401 && original && !original._retry && !isAuthCall(original) && currentToken) {
      original._retry = true;
      // Another request already refreshed while this one was in flight: retry
      // with the new token instead of rotating the refresh token again.
      if (original._sentToken !== currentToken && !pendingRefresh) return httpClient.request(original);
      const refresh = refreshOnce();
      if (await refresh) return httpClient.request(original);
      // FE-03: the session cannot be recovered; AuthProvider already cleared
      // it, the app shell takes the user to the login. Every request that
      // shared this failed refresh lands here: notify only once.
      if (notifiedRefresh !== refresh) {
        notifiedRefresh = refresh;
        sessionExpiredHandler?.();
      }
    }

    return Promise.reject(toApiErrorFromAxios(error));
  },
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.request<T>(config);
  return response.data;
}
