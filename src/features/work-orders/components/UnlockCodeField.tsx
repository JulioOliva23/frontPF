import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import type { LockType } from '../../../shared/api/types';
import { PatternGrid } from './PatternGrid';

interface UnlockCodeFieldProps {
  lockType: LockType;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

// FE-13: input for the code the customer dictates at the front desk. "Ver"
// only toggles what is being typed (nothing is stored yet). The audited reveal
// of a saved code lives in UnlockCodeReveal (FE-14).
export function UnlockCodeField({ lockType, value, onChange, error }: UnlockCodeFieldProps) {
  const [visible, setVisible] = useState(false);
  if (lockType === 'NONE') return null;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor="unlock-code" className="text-xs font-bold text-slate-700">
          {lockType === 'PATTERN' ? 'Patrón de desbloqueo' : lockType === 'PIN' ? 'PIN de desbloqueo' : 'Contraseña de desbloqueo'}
        </label>
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          className="flex min-h-[36px] items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          {visible ? 'Ocultar' : 'Ver'}
        </button>
      </div>
      {lockType === 'PATTERN' ? (
        <PatternGrid value={value} onChange={onChange} revealed={visible} />
      ) : (
        <input
          id="unlock-code"
          type={visible ? 'text' : 'password'}
          inputMode={lockType === 'PIN' ? 'numeric' : 'text'}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(lockType === 'PIN' ? event.target.value.replace(/\D/g, '') : event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'unlock-code-error' : 'unlock-code-hint'}
          maxLength={lockType === 'PIN' ? 16 : 64}
          className="min-h-[44px] w-full rounded-[11px] border border-slate-200 bg-white px-[13px] text-sm outline-none focus:border-cyan-600 focus:ring-[3px] focus:ring-cyan-600/15 aria-[invalid=true]:border-red-500"
        />
      )}
      <span id="unlock-code-hint" className="text-[0.7rem] text-slate-500">
        Se guarda cifrado. Solo el técnico asignado podrá revelarlo y cada acceso queda registrado.
      </span>
      {error && (
        <span id="unlock-code-error" role="alert" className="text-[0.7rem] text-red-700">
          {error}
        </span>
      )}
    </div>
  );
}
