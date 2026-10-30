import { useTechnicians } from '../hooks/use-work-orders';

interface TechnicianFilterProps {
  value: string | undefined;
  onChange: (technicianId: string | undefined) => void;
}

// Front desk only: technicians never pick another queue (RN-06), so the page
// does not render this for them and the list of technicians is not fetched.
export function TechnicianFilter({ value, onChange }: TechnicianFilterProps) {
  const technicians = useTechnicians(true);
  const options = technicians.data ?? [];
  // A filter from a shared link may name a technician no longer active.
  const unknown = value !== undefined && technicians.isSuccess && !options.some((technician) => technician.id === value);

  return (
    <div className="w-full sm:w-60">
      <label htmlFor="technician-filter" className="sr-only">
        Filtrar por técnico
      </label>
      <select
        id="technician-filter"
        value={value ?? ''}
        disabled={technicians.isLoading}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-[3px] focus:ring-cyan-600/15 disabled:text-slate-400"
      >
        <option value="">{technicians.isLoading ? 'Cargando técnicos…' : 'Todos los técnicos'}</option>
        {technicians.isError && (
          <option value="" disabled>
            No se pudo cargar la lista
          </option>
        )}
        {options.map((technician) => (
          <option key={technician.id} value={technician.id}>
            {technician.fullName}
          </option>
        ))}
        {unknown && <option value={value}>Técnico no disponible</option>}
      </select>
    </div>
  );
}
