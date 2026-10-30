import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../../../shared/api/query-keys';
import type { AgentAction, AgentActionStatus } from '../../../shared/api/types';
import { agentActionsApi } from '../api/agent-actions-api';
import { STOCK_MOVING_TARGETS } from '../lib/agent-action-rules';

const ALL = 'ALL';

export function useAgentActions(status?: AgentActionStatus) {
  return useQuery({ queryKey: queryKeys.agentActions.list(status ?? ALL), queryFn: () => agentActionsApi.list(status) });
}

// Sidebar badge: pending proposals visible to this user. The live stream
// keeps this cache entry fresh, so no polling is needed.
export function usePendingAgentActionsCount(enabled = true) {
  return useQuery({
    queryKey: queryKeys.agentActions.list('PENDING'),
    queryFn: () => agentActionsApi.list('PENDING'),
    select: (actions) => actions.length,
    enabled,
  });
}

// FE-09: an executed proposal moved a work order (and maybe stock).
export function useInvalidateAfterDecision() {
  const queryClient = useQueryClient();
  return (action: AgentAction) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.agentActions.root });
    if (action.status !== 'EXECUTED') return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.root });
    if (STOCK_MOVING_TARGETS.includes(action.to)) void queryClient.invalidateQueries({ queryKey: queryKeys.spareParts.root });
  };
}

export function useAgentActionDecision() {
  const invalidate = useInvalidateAfterDecision();
  const queryClient = useQueryClient();
  return {
    approve: useMutation({
      mutationFn: ({ id, note }: { id: string; note?: string }) => agentActionsApi.approve(id, { note }),
      onSuccess: invalidate,
      // A failed execution stays pending with lastError: show it.
      onError: () => void queryClient.invalidateQueries({ queryKey: queryKeys.agentActions.root }),
    }),
    reject: useMutation({
      mutationFn: ({ id, note }: { id: string; note?: string }) => agentActionsApi.reject(id, { note }),
      onSuccess: invalidate,
    }),
  };
}
