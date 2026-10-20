import type { WorkOrderStatus } from '../../../shared/api/types';
import { Badge } from '../../../shared/components/Badge';
import { WORK_ORDER_STATUS_LABELS, WORK_ORDER_STATUS_TONE } from '../../../shared/lib/work-order-status';

export function WorkOrderStatusBadge({ status, size = 'md' }: { status: WorkOrderStatus; size?: 'sm' | 'md' }) {
  return (
    <Badge variant={WORK_ORDER_STATUS_TONE[status]} size={size} dot>
      {WORK_ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
