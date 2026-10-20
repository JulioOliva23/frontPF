import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../../../shared/api/query-keys';
import type { CreateSparePartPayload, StockAdjustmentPayload, StockEntryPayload, UpdateSparePartPayload } from '../../../shared/api/types';
import { sparePartsApi, type SparePartFilters } from '../api/spare-parts-api';

export function useSpareParts(filters: SparePartFilters) {
  return useQuery({ queryKey: queryKeys.spareParts.list(filters), queryFn: () => sparePartsApi.list(filters) });
}

export function useLowStock() {
  return useQuery({ queryKey: queryKeys.spareParts.lowStock, queryFn: sparePartsApi.lowStock });
}

// FE-09: any catalog or stock change refreshes lists and alerts.
function useInvalidateParts() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: queryKeys.spareParts.root });
}

export function useSparePartMutations() {
  const invalidate = useInvalidateParts();
  return {
    create: useMutation({ mutationFn: (payload: CreateSparePartPayload) => sparePartsApi.create(payload), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: UpdateSparePartPayload }) => sparePartsApi.update(id, payload), onSuccess: invalidate }),
    deactivate: useMutation({ mutationFn: (id: string) => sparePartsApi.deactivate(id), onSuccess: invalidate }),
    entry: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: StockEntryPayload }) => sparePartsApi.registerEntry(id, payload), onSuccess: invalidate }),
    adjust: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: StockAdjustmentPayload }) => sparePartsApi.adjust(id, payload), onSuccess: invalidate }),
  };
}
