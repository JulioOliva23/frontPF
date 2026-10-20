import { request } from '../../../shared/api/httpClient';
import type {
  CreateWorkOrderPayload,
  CreatedWorkOrder,
  DeviceHistory,
  DeviceModel,
  PaginatedWorkOrders,
  TrackingCodeResponse,
  UnlockCodeResponse,
  UserResponse,
  WorkOrder,
  WorkOrderAuditEntry,
  WorkOrderStatus,
} from '../../../shared/api/types';

export interface WorkOrderFilters {
  status?: WorkOrderStatus;
  page?: number;
  pageSize?: number;
}

export const workOrdersApi = {
  list: (filters: WorkOrderFilters) => request<PaginatedWorkOrders>({ url: '/work-orders', params: filters }),
  get: (id: string) => request<WorkOrder>({ url: `/work-orders/${id}` }),
  create: (payload: CreateWorkOrderPayload) => request<CreatedWorkOrder>({ url: '/work-orders', method: 'POST', data: payload }),
  assignTechnician: (id: string, technicianId: string) =>
    request<WorkOrder>({ url: `/work-orders/${id}/assign-technician`, method: 'POST', data: { technicianId } }),
  updateDiagnosis: (id: string, preliminaryDiagnosis: string) =>
    request<WorkOrder>({ url: `/work-orders/${id}/diagnosis`, method: 'PATCH', data: { preliminaryDiagnosis } }),
  transition: (id: string, to: WorkOrderStatus, reason?: string) =>
    request<{ id: string; status: WorkOrderStatus }>({ url: `/work-orders/${id}/transitions`, method: 'POST', data: { to, reason } }),
  // RN-03: audited server-side BEFORE the code is returned.
  revealUnlockCode: (id: string) => request<UnlockCodeResponse>({ url: `/work-orders/${id}/unlock-code/reveal`, method: 'POST' }),
  regenerateTrackingCode: (id: string) => request<TrackingCodeResponse>({ url: `/work-orders/${id}/tracking-code/regenerate`, method: 'POST' }),
  audit: (id: string) => request<WorkOrderAuditEntry[]>({ url: `/work-orders/${id}/audit` }),
  technicians: () => request<UserResponse[]>({ url: '/users', params: { role: 'TECHNICIAN' } }),
  deviceModels: () => request<DeviceModel[]>({ url: '/device-models' }),
  deviceHistory: (imei: string) => request<DeviceHistory>({ url: `/devices/by-imei/${imei}` }),
};
