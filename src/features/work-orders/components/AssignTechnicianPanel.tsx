import { useState } from 'react';

import { toApiError } from '../../../shared/api/httpClient';
import type { WorkOrder } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { Select } from '../../../shared/components/Select';
import { useToast } from '../../../shared/components/toast-context';
import { useAssignTechnician, useTechnicians } from '../hooks/use-work-orders';

const ASSIGNABLE: ReadonlyArray<WorkOrder['status']> = ['RECEIVED', 'IN_DIAGNOSIS', 'BUDGETED', 'APPROVED'];

// RN-06: front desk assigns until the repair starts.
export function AssignTechnicianPanel({ order }: { order: WorkOrder }) {
  const technicians = useTechnicians(true);
  const assign = useAssignTechnician(order.id);
  const toast = useToast();
  const [technicianId, setTechnicianId] = useState(order.technician?.id ?? '');

  if (!ASSIGNABLE.includes(order.status)) return null;

  return (
    <section aria-label="Asignación de técnico" className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Select
            id="assign-technician"
            label={order.technician ? 'Reasignar técnico' : 'Asignar técnico'}
            placeholder={technicians.isLoading ? 'Cargando…' : 'Seleccione'}
            value={technicianId}
            onChange={(event) => setTechnicianId(event.target.value)}
            options={(technicians.data ?? []).map((technician) => ({ value: technician.id, label: technician.fullName }))}
          />
        </div>
        <Button
          disabled={!technicianId || technicianId === order.technician?.id}
          isLoading={assign.isPending}
          onClick={() => assign.mutate(technicianId, { onSuccess: () => toast.success('Técnico asignado') })}
        >
          Guardar
        </Button>
      </div>
      {assign.error && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {toApiError(assign.error)?.message}
        </p>
      )}
    </section>
  );
}
