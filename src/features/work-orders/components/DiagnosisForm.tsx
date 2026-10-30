import { useState } from 'react';

import { toApiError } from '../../../shared/api/httpClient';
import type { WorkOrder } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { TextAreaField } from '../../../shared/components/ui/form-field';
import { useToast } from '../../../shared/components/toast-context';
import { useUpdateDiagnosis } from '../hooks/use-work-orders';

export function DiagnosisForm({ order }: { order: WorkOrder }) {
  const [text, setText] = useState(order.preliminaryDiagnosis ?? '');
  const update = useUpdateDiagnosis(order.id);
  const toast = useToast();
  const tooShort = text.trim().length < 5;

  return (
    <section aria-label="Diagnóstico" className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
      <TextAreaField
        id="diagnosis"
        label="Diagnóstico preliminar"
        value={text}
        maxLength={2000}
        hint="Visible para recepción al armar el presupuesto"
        error={toApiError(update.error)?.message}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="flex justify-end">
        <Button disabled={tooShort} isLoading={update.isPending} onClick={() => update.mutate(text.trim(), { onSuccess: () => toast.success('Diagnóstico guardado') })}>
          Guardar diagnóstico
        </Button>
      </div>
    </section>
  );
}
