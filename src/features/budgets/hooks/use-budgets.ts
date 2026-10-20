import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../../../shared/api/query-keys';
import type { CreateBudgetPayload, DecisionChannel } from '../../../shared/api/types';
import { sparePartsApi } from '../../inventory/api/spare-parts-api';
import { budgetsApi } from '../api/budgets-api';

export function useBudgets(workOrderId: string) {
  return useQuery({ queryKey: queryKeys.budgets.byWorkOrder(workOrderId), queryFn: () => budgetsApi.listForWorkOrder(workOrderId) });
}

// RN-10: only parts compatible with the device model.
export function useCompatibleParts(deviceModelId: string | undefined) {
  const filters = { deviceModelId, pageSize: 100 };
  return useQuery({
    queryKey: queryKeys.spareParts.list(filters),
    queryFn: () => sparePartsApi.list(filters),
    enabled: Boolean(deviceModelId),
  });
}

function useInvalidate(workOrderId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.budgets.byWorkOrder(workOrderId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.root });
  };
}

export function useCreateBudget(workOrderId: string) {
  const invalidate = useInvalidate(workOrderId);
  return useMutation({ mutationFn: (payload: CreateBudgetPayload) => budgetsApi.create(workOrderId, payload), onSuccess: invalidate });
}

export function useBudgetDecision(workOrderId: string) {
  const invalidate = useInvalidate(workOrderId);
  return {
    send: useMutation({ mutationFn: (id: string) => budgetsApi.send(id), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: ({ id, channel }: { id: string; channel: DecisionChannel }) => budgetsApi.approve(id, channel), onSuccess: invalidate }),
    reject: useMutation({
      mutationFn: ({ id, channel, reason }: { id: string; channel: DecisionChannel; reason: string }) => budgetsApi.reject(id, channel, reason),
      onSuccess: invalidate,
    }),
  };
}
