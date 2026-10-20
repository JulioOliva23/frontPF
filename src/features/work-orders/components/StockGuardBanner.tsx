import { useQueries } from '@tanstack/react-query';
import { PackageX } from 'lucide-react';

import { queryKeys } from '../../../shared/api/query-keys';
import { sparePartsApi } from '../../inventory/api/spare-parts-api';

// FE-04 / RN-09: the Stock Guard blocked IN_REPAIR. Shows which parts are
// missing (names resolved through GET /spare-parts/:id, allowed for staff).
export function StockGuardBanner({ sparePartIds }: { sparePartIds: string[] }) {
  const parts = useQueries({
    queries: sparePartIds.map((id) => ({ queryKey: queryKeys.spareParts.detail(id), queryFn: () => sparePartsApi.get(id) })),
  });

  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p className="flex items-center gap-2 font-bold">
        <PackageX className="h-5 w-5" aria-hidden="true" /> No hay stock suficiente para iniciar la reparación
      </p>
      <ul className="mt-2 list-disc pl-6">
        {sparePartIds.map((id, index) => {
          const part = parts[index]?.data;
          return <li key={id}>{part ? `${part.name} (${part.sku}) · disponible: ${part.availableStock}` : 'Repuesto del presupuesto'}</li>;
        })}
      </ul>
      <p className="mt-2 text-xs">La orden sigue en "Aprobado". Registre el ingreso del repuesto y vuelva a intentarlo.</p>
    </div>
  );
}
