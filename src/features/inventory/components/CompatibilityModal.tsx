import { useState } from 'react';

import { toApiError } from '../../../shared/api/httpClient';
import type { SparePart } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { useSparePartMutations } from '../hooks/use-spare-parts';
import { DeviceModelPicker } from './DeviceModelPicker';

interface CompatibilityModalProps {
  part: SparePart | null;
  canEdit: boolean;
  onClose: () => void;
}

// RN-10: which phone models a part fits. Editable by ADMIN, read-only for
// reception.
export function CompatibilityModal({ part, canEdit, onClose }: CompatibilityModalProps) {
  const { update } = useSparePartMutations();
  const [selected, setSelected] = useState<string[]>(part?.compatibleDeviceModelIds ?? []);

  return (
    <Modal isOpen={part !== null} onClose={onClose} title="Compatibilidad por modelo" subtitle={part?.name} maxWidth="xl">
      <div className="grid gap-4">
        <DeviceModelPicker value={selected} onChange={setSelected} readOnly={!canEdit} />
        {update.error && (
          <p role="alert" className="text-sm text-red-300">
            {toApiError(update.error)?.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost-light" onClick={onClose}>
            Cerrar
          </Button>
          {canEdit && part && (
            <Button
              isLoading={update.isPending}
              onClick={() => update.mutate({ id: part.id, payload: { compatibleDeviceModelIds: selected } }, { onSuccess: onClose })}
            >
              Guardar compatibilidad
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
