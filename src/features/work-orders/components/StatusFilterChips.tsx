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
    <div role="radiogroup" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.status === value;
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.status)}
            className={`min-h-[40px] rounded-full border px-3 text-xs font-bold transition-all ${
              selected ? 'border-cyan-500 bg-cyan-400 text-cyan-950' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
