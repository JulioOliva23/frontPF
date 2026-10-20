import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '../../../shared/api/httpClient';
import { queryKeys } from '../../../shared/api/query-keys';
import type { CreateWorkOrderPayload, WorkOrderStatus } from '../../../shared/api/types';
import { isValidImei } from '../../../shared/lib/imei';
import { workOrdersApi, type WorkOrderFilters } from '../api/work-orders-api';

export function useWorkOrders(filters: WorkOrderFilters) {
  return useQuery({ queryKey: queryKeys.workOrders.list(filters), queryFn: () => workOrdersApi.list(filters) });
}

export function useWorkOrder(id: string) {
  return useQuery({ queryKey: queryKeys.workOrders.detail(id), queryFn: () => workOrdersApi.get(id) });
}

export function useWorkOrderAudit(id: string) {
  return useQuery({ queryKey: queryKeys.workOrders.audit(id), queryFn: () => workOrdersApi.audit(id) });
}

export function useDeviceModels() {
  return useQuery({ queryKey: queryKeys.devices.models, queryFn: workOrdersApi.deviceModels, staleTime: 5 * 60_000 });
}

export function useTechnicians(enabled: boolean) {
  return useQuery({ queryKey: queryKeys.users.technicians, queryFn: workOrdersApi.technicians, enabled });
}

// RN-13 / FE-12: only queried once the IMEI is Luhn-valid. 404 = no history.
export function useDeviceHistory(imei: string) {
  return useQuery({
    queryKey: queryKeys.devices.history(imei),
    queryFn: async () => {
      try {
        return await workOrdersApi.deviceHistory(imei);
      } catch (error) {
        if (error instanceof ApiError && error.isNotFound) return null;
        throw error;
      }
    },
    enabled: isValidImei(imei),
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkOrderPayload) => workOrdersApi.create(payload),
    onSuccess: (_order, payload) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.root });
      void queryClient.invalidateQueries({ queryKey: queryKeys.devices.history(payload.device.imei) });
    },
  });
}

function useInvalidateOrder(id: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.root });
    void queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.audit(id) });
  };
}

export function useTransitionWorkOrder(id: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateOrder(id);
  return useMutation({
    mutationFn: ({ to, reason }: { to: WorkOrderStatus; reason?: string }) => workOrdersApi.transition(id, to, reason),
    // FE-09: stock moves when entering IN_REPAIR / QUALITY_CONTROL (RN-09).
    onSuccess: (_result, { to }) => {
      invalidate();
      if (to === 'IN_REPAIR' || to === 'QUALITY_CONTROL') void queryClient.invalidateQueries({ queryKey: queryKeys.spareParts.root });
    },
    // RN-04: on a concurrent change, refetch to show the real state.
    onError: (error) => {
      if (error instanceof ApiError && error.statusCode === 409) invalidate();
    },
  });
}

export function useAssignTechnician(id: string) {
  const invalidate = useInvalidateOrder(id);
  return useMutation({ mutationFn: (technicianId: string) => workOrdersApi.assignTechnician(id, technicianId), onSuccess: invalidate });
}

export function useUpdateDiagnosis(id: string) {
  const invalidate = useInvalidateOrder(id);
  return useMutation({ mutationFn: (text: string) => workOrdersApi.updateDiagnosis(id, text), onSuccess: invalidate });
}

export function useRegenerateTrackingCode(id: string) {
  return useMutation({ mutationFn: () => workOrdersApi.regenerateTrackingCode(id) });
}
