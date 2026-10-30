import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

import { LOGIN_ROUTE, ROLE_DEFAULT_ROUTE } from '../../features/auth/config/role-routes';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { isChunkLoadError } from './chunk-load-error';
import { NotFoundPage } from './NotFoundPage';

function describe(error: unknown): { title: string; message: string } {
  if (isChunkLoadError(error)) {
    return {
      title: 'Hay una versión nueva del sistema',
      message: 'No se pudo cargar esta sección. Recarga la página para usar la versión actual.',
    };
  }
  return {
    title: 'Algo salió mal en esta pantalla',
    message: 'Ocurrió un error inesperado al mostrar la página. Puedes reintentar o volver al inicio; tus datos guardados no se perdieron.',
  };
}

// errorElement of the route tree: a render error, a failed lazy import or a
// thrown loader response shows this fallback instead of a blank screen.
export function RouteErrorBoundary() {
  const error = useRouteError();
  const { user } = useAuth();

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  const { title, message } = describe(error);
  const home = user ? ROLE_DEFAULT_ROUTE[user.role] : LOGIN_ROUTE;
  const detail = error instanceof Error ? error.message : isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : null;

  return (
    <section role="alert" aria-labelledby="route-error-title" className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-red-400/25 bg-red-400/10">
          <AlertTriangle className="h-6 w-6 text-red-300" aria-hidden="true" />
        </span>
        <h1 id="route-error-title" className="mt-4 text-lg font-extrabold text-ink">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted">{message}</p>
        {import.meta.env.DEV && detail && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-surface-soft p-3 text-left text-xs text-muted">{detail}</pre>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-surface-soft px-4 text-sm font-bold text-white hover:bg-surface-raised"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reintentar
          </button>
          {/* reloadDocument: a full load also clears a broken in-memory state. */}
          <Link
            to={home}
            reloadDocument
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-bold text-ink-soft hover:bg-surface-raised"
          >
            <Home className="h-4 w-4" aria-hidden="true" /> Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
