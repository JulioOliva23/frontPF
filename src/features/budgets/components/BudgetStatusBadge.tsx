import type { Budget } from '../../../shared/api/types';
import { Badge } from '../../../shared/components/Badge';
import { BUDGET_STATUS_LABELS, BUDGET_STATUS_VARIANT, daysUntilExpiry, effectiveBudgetStatus } from '../lib/budget-status';

export function BudgetStatusBadge({ budget }: { budget: Budget }) {
  const status = effectiveBudgetStatus(budget);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge variant={BUDGET_STATUS_VARIANT[status]} dot>
        {BUDGET_STATUS_LABELS[status]}
      </Badge>
      {status === 'SENT' && (
        <Badge variant={daysUntilExpiry(budget) <= 2 ? 'warning' : 'slate'} size="sm">
          Vence en {daysUntilExpiry(budget)} día(s)
        </Badge>
      )}
    </span>
  );
}
