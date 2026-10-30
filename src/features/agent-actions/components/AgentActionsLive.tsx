import type { ReactNode } from 'react';

import { useToast } from '../../../shared/components/toast-context';
import { WORK_ORDER_STATUS_LABELS } from '../../../shared/lib/work-order-status';
import { useAuth } from '../../auth/hooks/useAuth';
import { STAFF_ROLES } from '../../auth/config/role-routes';
import { useAgentActionStream } from '../hooks/use-agent-action-stream';
import { canReject, formatOrderNumber } from '../lib/agent-action-rules';
import { AgentStreamStatusContext } from './agent-stream-status';

// One stream per session, opened by the app shell for staff only. Toasts are
// rendered conditionally: only people who can decide a new proposal hear about it.
export function AgentActionsLive({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const status = useAgentActionStream({
    enabled: !!user && STAFF_ROLES.includes(user.role),
    onEvent: ({ type, action }) => {
      if (!user || type !== 'created' || !canReject(action, user)) return;
      toast.info(
        `El agente propone mover la ${formatOrderNumber(action.workOrderNumber)}`,
        `${WORK_ORDER_STATUS_LABELS[action.from]} → ${WORK_ORDER_STATUS_LABELS[action.to]}. Revísala en Aprobaciones.`,
      );
    },
  });
  return <AgentStreamStatusContext.Provider value={status}>{children}</AgentStreamStatusContext.Provider>;
}
