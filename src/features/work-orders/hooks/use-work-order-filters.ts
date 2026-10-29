import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import type { WorkOrderStatus } from '../../../shared/api/types';
import { ALL_WORK_ORDER_STATUSES } from '../../../shared/lib/work-order-status';

// Query params of /ordenes, so a filtered list can be shared, bookmarked or
// linked from the dashboard (e.g. /ordenes?status=BUDGETED).
export const WORK_ORDER_FILTER_PARAMS = {
  status: 'status',
  technicianId: 'technicianId',
  search: 'search',
} as const;

type FilterKey = keyof typeof WORK_ORDER_FILTER_PARAMS;

export interface WorkOrderListFilters {
  status?: WorkOrderStatus;
  technicianId?: string;
  search?: string;
}

function parseStatus(raw: string | null): WorkOrderStatus | undefined {
  return ALL_WORK_ORDER_STATUSES.find((status) => status === raw);
}

function readFilters(params: URLSearchParams): WorkOrderListFilters {
  const technicianId = params.get(WORK_ORDER_FILTER_PARAMS.technicianId)?.trim();
  const search = params.get(WORK_ORDER_FILTER_PARAMS.search)?.trim();
  return {
    status: parseStatus(params.get(WORK_ORDER_FILTER_PARAMS.status)),
    ...(technicianId ? { technicianId } : {}),
    ...(search ? { search } : {}),
  };
}

export function useWorkOrderFilters() {
  const [params, setParams] = useSearchParams();
  const raw = params.toString();
  // Stable object per URL, usable as part of a query key.
  const filters = useMemo(() => readFilters(new URLSearchParams(raw)), [raw]);

  const update = useCallback(
    (patch: Partial<Record<FilterKey, string | undefined>>) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          for (const [key, value] of Object.entries(patch) as Array<[FilterKey, string | undefined]>) {
            const name = WORK_ORDER_FILTER_PARAMS[key];
            if (value) next.set(name, value);
            else next.delete(name);
          }
          return next;
        },
        // Typing in the search box must not flood the history.
        { replace: true },
      );
    },
    [setParams],
  );

  const reset = useCallback(() => update({ status: undefined, technicianId: undefined, search: undefined }), [update]);

  return {
    filters,
    hasActiveFilters: Boolean(filters.status || filters.technicianId || filters.search),
    setStatus: useCallback((status: WorkOrderStatus | undefined) => update({ status }), [update]),
    setTechnicianId: useCallback((technicianId: string | undefined) => update({ technicianId }), [update]),
    setSearch: useCallback((search: string | undefined) => update({ search: search?.trim() || undefined }), [update]),
    reset,
  };
}
