// FE-09: single source of truth for React Query keys. Mutations invalidate
// only through this module.
export const queryKeys = {
  workOrders: {
    root: ['work-orders'] as const,
    list: (filters: object) => ['work-orders', 'list', filters] as const,
    detail: (id: string) => ['work-orders', 'detail', id] as const,
    audit: (id: string) => ['work-orders', 'audit', id] as const,
    mine: ['work-orders', 'mine'] as const,
    // Under the root key, so every work order mutation refreshes the dashboard.
    summary: ['work-orders', 'summary'] as const,
  },
  devices: {
    history: (imei: string) => ['devices', 'history', imei] as const,
    // Prefix of `catalog`: invalidating it refreshes intake pickers and the
    // admin catalog together.
    models: ['device-models'] as const,
    catalog: ['device-models', 'catalog'] as const,
  },
  users: {
    root: ['users'] as const,
    technicians: ['users', 'technicians'] as const,
    admin: ['users', 'admin'] as const,
  },
  budgets: {
    root: ['budgets'] as const,
    byWorkOrder: (workOrderId: string) => ['budgets', 'work-order', workOrderId] as const,
  },
  spareParts: {
    root: ['spare-parts'] as const,
    list: (filters: object) => ['spare-parts', 'list', filters] as const,
    detail: (id: string) => ['spare-parts', 'detail', id] as const,
    lowStock: ['spare-parts', 'low-stock'] as const,
  },
  agentActions: {
    root: ['agent-actions'] as const,
    list: (status: string) => ['agent-actions', 'list', status] as const,
  },
} as const;
