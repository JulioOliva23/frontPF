import { createContext, useContext } from 'react';

import type { StreamStatus } from '../hooks/use-agent-action-stream';

export const AgentStreamStatusContext = createContext<StreamStatus>('offline');

export function useAgentStreamStatus(): StreamStatus {
  return useContext(AgentStreamStatusContext);
}
