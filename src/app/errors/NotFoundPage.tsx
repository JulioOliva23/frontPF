import { ArrowLeft, Home, SearchX } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

import { LOGIN_ROUTE, ROLE_DEFAULT_ROUTE } from '../../features/auth/config/role-routes';
import { useAuth } from '../../features/auth/hooks/useAuth';

// 404 for any path the router does not know, instead of a silent redirect.
// The main link points to the landing page of the current role.
export function NotFoundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const home = user ? ROLE_DEFAULT_ROUTE[user.role] : LOGIN_ROUTE;
  const homeLabel = user ? 'Ir a mi inicio' : 'Iniciar sesión';

  return (
    <section aria-labelledby="not-found-title" className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm">
          <SearchX className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-widest text-slate-400">Error 404</p>
        <h1 id="not-found-title" className="mt-1 text-2xl font-extrabold text-slate-900">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm text-slate-500">La dirección que abriste no existe o fue movida. Revisa el enlace o vuelve a una sección conocida.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            to={home}
            replace
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-lime-400 px-4 text-sm font-bold text-lime-950 shadow-sm hover:bg-lime-300"
          >
            <Home className="h-4 w-4" aria-hidden="true" /> {homeLabel}
          </Link>
          <button
            type="button"
            onClick={() => void navigate(-1)}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver
          </button>
          <Link to="/portal-cliente" className="flex min-h-[44px] items-center px-3 text-sm font-semibold text-slate-500 underline-offset-4 hover:underline">
            Consultar una reparación
          </Link>
        </div>
      </div>
    </section>
  );
}
