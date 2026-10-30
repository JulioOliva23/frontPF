import { useLowStockCount } from '../features/inventory/hooks/use-spare-parts';
import type { NavBadge as NavBadgeKind } from './navigation';

// Counts above this read "99+" so the pill keeps its size.
const MAX_SHOWN = 99;

function CountPill({ count, label }: { count: number; label: string }) {
  return (
    <span
      aria-label={label}
      title={label}
      className="ml-auto inline-flex min-w-[22px] items-center justify-center rounded-full border border-amber-300/25 bg-amber-300/15 px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-amber-200"
    >
      {count > MAX_SHOWN ? `${MAX_SHOWN}+` : count}
    </span>
  );
}

// US-F13 / RN-11. Only rendered for items the role can see (front desk), so
// the low-stock endpoint is never called for technicians. Hidden while
// loading, on error and when nothing is low: the badge only ever signals.
function LowStockBadge() {
  const { data: count } = useLowStockCount();
  if (!count) return null;
  return <CountPill count={count} label={count === 1 ? '1 repuesto con stock bajo' : `${count} repuestos con stock bajo`} />;
}

export function NavBadge({ kind }: { kind: NavBadgeKind }) {
  switch (kind) {
    case 'low-stock':
      return <LowStockBadge />;
  }
}
