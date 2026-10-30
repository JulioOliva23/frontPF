import { request } from '../../../shared/api/httpClient';
import type {
  CreateDeviceModelPayload,
  CreateUserPayload,
  DeviceModel,
  UpdateDeviceModelPayload,
  UpdateUserPayload,
  UserResponse,
} from '../../../shared/api/types';

// US-F14: ADMIN endpoints of /users and /device-models.
export const usersAdminApi = {
  // includeInactive is honoured only for ADMIN by the backend.
  list: () => request<UserResponse[]>({ url: '/users', params: { includeInactive: true } }),
  create: (payload: CreateUserPayload) => request<UserResponse>({ url: '/users', method: 'POST', data: payload }),
  update: (id: string, payload: UpdateUserPayload) => request<UserResponse>({ url: `/users/${id}`, method: 'PATCH', data: payload }),
  resetPassword: (id: string, password: string) => request<void>({ url: `/users/${id}/password`, method: 'POST', data: { password } }),
  activate: (id: string) => request<UserResponse>({ url: `/users/${id}/activate`, method: 'POST' }),
  deactivate: (id: string) => request<UserResponse>({ url: `/users/${id}`, method: 'DELETE' }),
};

export const deviceModelsAdminApi = {
  list: () => request<DeviceModel[]>({ url: '/device-models', params: { includeInactive: true } }),
  create: (payload: CreateDeviceModelPayload) => request<DeviceModel>({ url: '/device-models', method: 'POST', data: payload }),
  update: (id: string, payload: UpdateDeviceModelPayload) => request<DeviceModel>({ url: `/device-models/${id}`, method: 'PATCH', data: payload }),
};
