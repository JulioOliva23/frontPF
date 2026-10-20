import type { WorkOrder, WorkOrderStatus } from '../../../shared/api/types';

// BUDGETED / APPROVED are driven by the budget workflow (send / approve), and
// a budgeted order is cancelled by rejecting its budget (RN-05).
export function visibleTransitions(order: WorkOrder): WorkOrderStatus[] {
  return order.allowedTransitions.filter(
    (to) => to !== 'BUDGETED' && to !== 'APPROVED' && !(to === 'CANCELLED' && order.status === 'BUDGETED'),
  );
}
