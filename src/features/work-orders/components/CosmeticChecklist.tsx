import type { CosmeticCondition } from '../../../shared/api/types';
import { COSMETIC_CONDITIONS, COSMETIC_ZONES, type CosmeticZone } from '../schemas/check-in-schema';

interface CosmeticChecklistProps {
  value: Record<CosmeticZone, CosmeticCondition>;
  onChange: (zone: CosmeticZone, condition: CosmeticCondition) => void;
}

// RN-01: physical check-in snapshot, one condition per zone.
export function CosmeticChecklist({ value, onChange }: CosmeticChecklistProps) {
  return (
    <div className="grid gap-3">
      {COSMETIC_ZONES.map((zone) => (
        <fieldset key={zone.key} className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center">
          <legend className="text-xs font-bold text-ink-soft sm:float-left sm:pt-2">{zone.label}</legend>
          <div className="flex flex-wrap gap-1.5">
            {COSMETIC_CONDITIONS.map((condition) => {
              const selected = value[zone.key] === condition.value;
              const damaged = condition.value !== 'OK';
              return (
                <label
                  key={condition.value}
                  className={`flex min-h-[40px] cursor-pointer items-center rounded-lg border px-3 text-xs font-semibold transition-all ${
                    selected
                      ? damaged
                        ? 'border-orange-400 bg-orange-400/10 text-orange-300'
                        : 'border-emerald-400 bg-emerald-400/10 text-emerald-300'
                      : 'border-line bg-surface text-muted hover:border-line'
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name={`cosmetic-${zone.key}`}
                    value={condition.value}
                    checked={selected}
                    onChange={() => onChange(zone.key, condition.value)}
                    aria-label={`${zone.label}: ${condition.label}`}
                  />
                  {condition.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
