import { useCallback, useEffect, useMemo, useRef } from 'react';

export interface DebouncedCallback<A extends unknown[]> {
  // Schedules the call, replacing any pending one.
  run: (...args: A) => void;
  // Drops the pending call, if any.
  cancel: () => void;
}

// Calls `callback` once `delayMs` passed without a new `run`. The latest
// callback is always used, and a pending call never fires after unmount.
export function useDebouncedCallback<A extends unknown[]>(callback: (...args: A) => void, delayMs: number): DebouncedCallback<A> {
  const callbackRef = useRef(callback);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    callbackRef.current = callback;
  });

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  const run = useCallback(
    (...args: A) => {
      cancel();
      timer.current = setTimeout(() => {
        timer.current = undefined;
        callbackRef.current(...args);
      }, delayMs);
    },
    [cancel, delayMs],
  );

  useEffect(() => cancel, [cancel]);

  return useMemo(() => ({ run, cancel }), [run, cancel]);
}
