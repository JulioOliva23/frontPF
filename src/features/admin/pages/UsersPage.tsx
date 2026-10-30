import { useMemo, useState } from 'react';
import { KeyRound, Pencil, Power, Search, UserPlus, UsersRound } from 'lucide-react';

import type { UserResponse, UserRole } from '../../../shared/api/types';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { Pagination } from '../../../shared/components/Pagination';
import { ROLE_LABELS } from '../../auth/config/role-routes';
import { useAuth } from '../../auth/hooks/useAuth';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { UserStatusModal } from '../components/UserStatusModal';
import { useAdminUsers } from '../hooks/use-admin';

const PAGE_SIZE = 10;
type StatusFilter = 'all' | 'active' | 'inactive';

const ROLE_FILTERS: ReadonlyArray<{ value: UserRole | ''; label: string }> = [
  { value: '', label: 'Todos los roles' },
  { value: 'ADMIN', label: ROLE_LABELS.ADMIN },
  { value: 'RECEPTIONIST', label: ROLE_LABELS.RECEPTIONIST },
  { value: 'TECHNICIAN', label: ROLE_LABELS.TECHNICIAN },
  { value: 'CUSTOMER', label: ROLE_LABELS.CUSTOMER },
];

const ROLE_BADGE: Readonly<Record<UserRole, 'purple' | 'info' | 'amber' | 'slate'>> = {
  ADMIN: 'purple',
  RECEPTIONIST: 'info',
  TECHNICIAN: 'amber',
  CUSTOMER: 'slate',
};

function matches(user: UserResponse, search: string, role: UserRole | '', status: StatusFilter): boolean {
  const needle = search.trim().toLocaleLowerCase('es');
  if (needle && !`${user.fullName} ${user.username}`.toLocaleLowerCase('es').includes(needle)) return false;
  if (role && user.role !== role) return false;
  if (status === 'active') return user.isActive;
  if (status === 'inactive') return !user.isActive;
  return true;
}

function IconAction({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

// US-F14: staff accounts (ADMIN only, behind RoleGuard). The list is small,
// so it is fetched once and filtered/paginated in the browser.
export function UsersPage() {
  const { user: me } = useAuth();
  const users = useAdminUsers();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UserResponse | null>(null);
  const [resetting, setResetting] = useState<UserResponse | null>(null);
  const [toggling, setToggling] = useState<UserResponse | null>(null);

  const filtered = useMemo(() => (users.data ?? []).filter((entry) => matches(entry, search, role, status)), [users.data, search, role, status]);
  const lastPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, lastPage);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = Boolean(search.trim() || role || status !== 'all');

  const updateFilter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };
  const resetFilters = () => {
    setSearch('');
    setRole('');
    setStatus('all');
    setPage(1);
  };

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Usuarios</h1>
          <p className="text-sm text-slate-500">Cuentas del personal y sus permisos</p>
        </div>
        <Button onClick={() => setCreating(true)} leftIcon={<UserPlus className="h-4 w-4" aria-hidden="true" />}>
          Nuevo usuario
        </Button>
      </header>

      <div role="search" aria-label="Filtros de usuarios" className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <label htmlFor="users-search" className="sr-only">
            Buscar usuarios
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="users-search"
            type="search"
            value={search}
            placeholder="Buscar por nombre o usuario"
            onChange={(event) => updateFilter(setSearch)(event.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-cyan-600 focus:ring-[3px] focus:ring-cyan-600/15"
          />
        </div>
        <label htmlFor="users-role" className="sr-only">
          Filtrar por rol
        </label>
        <select
          id="users-role"
          value={role}
          onChange={(event) => updateFilter(setRole)(event.target.value as UserRole | '')}
          className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-600"
        >
          {ROLE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label htmlFor="users-status" className="sr-only">
          Filtrar por estado
        </label>
        <select
          id="users-status"
          value={status}
          onChange={(event) => updateFilter(setStatus)(event.target.value as StatusFilter)}
          className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-600"
        >
          <option value="all">Activos y desactivados</option>
          <option value="active">Solo activos</option>
          <option value="inactive">Solo desactivados</option>
        </select>
      </div>

      {users.isLoading && <LoadingSkeleton />}
      {users.isError && <ErrorState message="No se pudieron cargar los usuarios." onRetry={() => void users.refetch()} />}
      {users.data && filtered.length === 0 && (
        <EmptyState
          icon={<UsersRound className="h-7 w-7" aria-hidden="true" />}
          title={hasFilters ? 'Sin resultados' : 'Sin usuarios'}
          description={hasFilters ? 'Ningún usuario coincide con los filtros elegidos.' : 'Crea la primera cuenta del personal.'}
          actionLabel={hasFilters ? 'Limpiar filtros' : undefined}
          onAction={hasFilters ? resetFilters : undefined}
        />
      )}

      {visible.length > 0 && (
        <div className="grid gap-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Nombre</th>
                  <th scope="col" className="px-4 py-3">Usuario</th>
                  <th scope="col" className="px-4 py-3">Rol</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((entry) => {
                  const isSelf = entry.id === me?.id;
                  return (
                    <tr key={entry.id} className={entry.isActive ? '' : 'bg-slate-50/60 text-slate-500'}>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {entry.fullName}
                        {isSelf && <span className="ml-2 rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800">Tú</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">@{entry.username}</td>
                      <td className="px-4 py-3">
                        <Badge variant={ROLE_BADGE[entry.role]} size="sm">
                          {ROLE_LABELS[entry.role]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={entry.isActive ? 'success' : 'slate'} size="sm" dot>
                          {entry.isActive ? 'Activo' : 'Desactivado'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1">
                          <IconAction label={`Editar ${entry.fullName}`} onClick={() => setEditing(entry)}>
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </IconAction>
                          <IconAction label={`Restablecer contraseña de ${entry.fullName}`} onClick={() => setResetting(entry)}>
                            <KeyRound className="h-4 w-4" aria-hidden="true" />
                          </IconAction>
                          <IconAction
                            label={isSelf ? 'No puedes desactivar tu propia cuenta' : `${entry.isActive ? 'Desactivar' : 'Reactivar'} ${entry.fullName}`}
                            onClick={() => setToggling(entry)}
                            disabled={isSelf}
                          >
                            <Power className={`h-4 w-4 ${entry.isActive ? '' : 'text-emerald-600'}`} aria-hidden="true" />
                          </IconAction>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </div>
      )}

      <CreateUserModal isOpen={creating} onClose={() => setCreating(false)} />
      <EditUserModal user={editing} isSelf={editing?.id === me?.id} onClose={() => setEditing(null)} />
      <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />
      <UserStatusModal user={toggling} onClose={() => setToggling(null)} />
    </div>
  );
}
