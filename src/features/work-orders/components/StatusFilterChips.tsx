import type { WorkOrderStatus } from '../../../shared/api/types';
import { ALL_WORK_ORDER_STATUSES, WORK_ORDER_STATUS_LABELS } from '../../../shared/lib/work-order-status';

interface StatusFilterChipsProps {
  value: WorkOrderStatus | undefined;
  onChange: (status: WorkOrderStatus | undefined) => void;
}

export function StatusFilterChips({ value, onChange }: StatusFilterChipsProps) {
  const options: Array<{ key: string; label: string; status: WorkOrderStatus | undefined }> = [
    { key: 'ALL', label: 'Todos', status: undefined },
    ...ALL_WORK_ORDER_STATUSES.map((status) => ({ key: status, label: WORK_ORDER_STATUS_LABELS[status], status })),
  ];
  return (
    <div role="radiogroup" aria-label="Filtrar por estado" className="flex gap-2 overflow-x-auto pb-2 lg:flex-wrap">
      {options.map((option) => {
        const selected = option.status === value;
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.status)}
            className={`min-h-[44px] shrink-0 rounded-full border px-4 text-xs font-bold transition-all ${
              selected ? 'border-lavender bg-lavender text-canvas' : 'border-line bg-surface/40 text-muted hover:border-lavender/50'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
