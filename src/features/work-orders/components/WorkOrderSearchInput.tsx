import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

import { useDebouncedCallback } from '../../../shared/lib/use-debounced-callback';

export const SEARCH_DEBOUNCE_MS = 300;

interface WorkOrderSearchInputProps {
  // Committed search (the URL value).
  value: string;
  onChange: (search: string) => void;
}

// Free-text search of the work order list. Keystrokes stay local and are
// committed after SEARCH_DEBOUNCE_MS of silence; Enter and the clear button
// commit at once.
export function WorkOrderSearchInput({ value, onChange }: WorkOrderSearchInputProps) {
  const [text, setText] = useState(value);
  const committed = useRef(value);

  const commit = (next: string) => {
    committed.current = next.trim();
    onChange(committed.current);
  };
  const debounced = useDebouncedCallback(commit, SEARCH_DEBOUNCE_MS);

  // The URL changed from outside (reset button, back navigation): show it and
  // drop any pending keystrokes so they cannot overwrite it.
  useEffect(() => {
    if (value === committed.current) return;
    debounced.cancel();
    committed.current = value;
    setText(value);
  }, [value, debounced]);

  const clear = () => {
    debounced.cancel();
    setText('');
    commit('');
  };

  return (
    <div className="relative min-w-[240px] flex-1">
      <label htmlFor="work-order-search" className="sr-only">
        Buscar órdenes
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        id="work-order-search"
        type="search"
        value={text}
        maxLength={100}
        autoComplete="off"
        placeholder="Buscar por N.º de OT, IMEI, cliente o teléfono"
        onChange={(event) => {
          setText(event.target.value);
          debounced.run(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          debounced.cancel();
          commit(text);
        }}
        className="min-h-[44px] w-full rounded-xl border border-line bg-surface pl-10 pr-10 text-sm text-ink outline-none placeholder:text-muted focus:border-mint focus:ring-[3px] focus:ring-lavender/15 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={clear}
          aria-label="Limpiar búsqueda"
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-surface-raised hover:text-ink-soft"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
