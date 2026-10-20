import { request } from '../../../shared/api/httpClient';
import type { Budget, CreateBudgetPayload, DecisionChannel } from '../../../shared/api/types';

export const budgetsApi = {
  listForWorkOrder: (workOrderId: string) => request<Budget[]>({ url: `/work-orders/${workOrderId}/budgets` }),
  create: (workOrderId: string, payload: CreateBudgetPayload) =>
    request<Budget>({ url: `/work-orders/${workOrderId}/budgets`, method: 'POST', data: payload }),
  send: (id: string) => request<Budget>({ url: `/budgets/${id}/send`, method: 'POST' }),
  approve: (id: string, channel: DecisionChannel) => request<Budget>({ url: `/budgets/${id}/approve`, method: 'POST', data: { channel } }),
  reject: (id: string, channel: DecisionChannel, reason: string) =>
    request<Budget>({ url: `/budgets/${id}/reject`, method: 'POST', data: { channel, reason } }),
};
