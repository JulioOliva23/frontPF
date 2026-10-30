import { request } from '../../../shared/api/httpClient';
import type { AgentAction, AgentActionStatus, DecideAgentActionPayload } from '../../../shared/api/types';

export const AGENT_ACTIONS_STREAM_PATH = '/agent-actions/stream';

export const agentActionsApi = {
  list: (status?: AgentActionStatus) => request<AgentAction[]>({ url: '/agent-actions', params: status ? { status } : undefined }),
  approve: (id: string, payload: DecideAgentActionPayload) => request<AgentAction>({ url: `/agent-actions/${id}/approve`, method: 'POST', data: payload }),
  reject: (id: string, payload: DecideAgentActionPayload) => request<AgentAction>({ url: `/agent-actions/${id}/reject`, method: 'POST', data: payload }),
};
