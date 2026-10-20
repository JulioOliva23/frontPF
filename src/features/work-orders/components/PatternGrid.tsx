interface PatternGridProps {
  value: string;
  onChange: (value: string) => void;
  revealed: boolean;
}

const NODES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

// FE-13: Android 3x3 pattern captured as "1-5-9-6" (each node once).
export function PatternGrid({ value, onChange, revealed }: PatternGridProps) {
  const sequence = value ? value.split('-').map(Number) : [];

  const toggle = (node: number) => {
    if (sequence.includes(node)) return;
    onChange([...sequence, node].join('-'));
  };

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="grid w-44 grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" role="group" aria-label="Patrón de desbloqueo">
        {NODES.map((node) => {
          const position = sequence.indexOf(node);
          const selected = position >= 0;
          return (
            <button
              key={node}
              type="button"
              onClick={() => toggle(node)}
              aria-label={`Punto ${node}`}
              aria-pressed={selected}
              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 text-xs font-bold ${
                selected ? 'border-lime-600 bg-lime-400 text-lime-950' : 'border-slate-300 bg-white text-slate-400'
              }`}
            >
              {selected ? (revealed ? position + 1 : '•') : ''}
            </button>
          );
        })}
      </div>
      <div className="grid gap-2 text-xs text-slate-600">
        <span>{sequence.length === 0 ? 'Toque los puntos en orden' : `${sequence.length} puntos seleccionados`}</span>
        <button
          type="button"
          onClick={() => onChange('')}
          className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 font-bold text-slate-700 hover:bg-slate-100"
        >
          Borrar patrón
        </button>
      </div>
    </div>
  );
}
