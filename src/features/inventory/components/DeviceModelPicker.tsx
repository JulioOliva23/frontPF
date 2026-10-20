import { useMemo } from 'react';

import { useDeviceModels } from '../../work-orders/hooks/use-work-orders';

interface DeviceModelPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  readOnly?: boolean;
}

// RN-10: multi-model compatibility, grouped by brand.
export function DeviceModelPicker({ value, onChange, readOnly = false }: DeviceModelPickerProps) {
  const models = useDeviceModels();
  const byBrand = useMemo(() => {
    const groups = new Map<string, Array<{ id: string; model: string }>>();
    for (const model of models.data ?? []) groups.set(model.brand, [...(groups.get(model.brand) ?? []), { id: model.id, model: model.model }]);
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [models.data]);

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);

  return (
    <fieldset className="grid gap-3">
      <legend className="text-xs font-bold text-slate-700">Modelos compatibles ({value.length})</legend>
      {models.isLoading && <p className="text-xs text-slate-500">Cargando modelos…</p>}
      {byBrand.map(([brand, list]) => (
        <div key={brand}>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{brand}</p>
          <div className="flex flex-wrap gap-1.5">
            {list.map((model) => {
              const checked = value.includes(model.id);
              return (
                <label
                  key={model.id}
                  className={`flex min-h-[36px] items-center gap-2 rounded-lg border px-2.5 text-xs font-semibold ${
                    checked ? 'border-lime-500 bg-lime-50 text-lime-900' : 'border-slate-200 bg-white text-slate-600'
                  } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <input type="checkbox" checked={checked} disabled={readOnly} onChange={() => toggle(model.id)} className="h-4 w-4 accent-lime-600" />
                  {model.model}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
