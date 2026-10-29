import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Smartphone } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { loginSchema, type LoginFormData } from '../schemas/login-schema';
import { readLoginRedirectState, ROLE_DEFAULT_ROUTE } from '../config/role-routes';
import { toApiError } from '../../../shared/api/httpClient';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = readLoginRedirectState(location.state);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const userData = await login(data.username, data.password);
      // A route the role cannot open is bounced again by RoleGuard.
      navigate(redirect.from ?? ROLE_DEFAULT_ROUTE[userData.role], { replace: true });
    } catch (error: unknown) {
      const apiError = toApiError(error);
      setServerError(
        apiError?.isRateLimited
          ? 'Demasiados intentos. Espere un minuto antes de volver a intentar.'
          : (apiError?.message ?? 'Error inesperado al iniciar sesión'),
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-lime-400 flex items-center justify-center mb-4 shadow-lg shadow-lime-400/20">
            <Smartphone className="w-7 h-7 text-lime-950" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Servicio Técnico</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de reparación de celulares</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-6">Iniciar Sesión</h2>

          {redirect.reason === 'session-expired' && !serverError && (
            <div role="status" className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              Tu sesión expiró. Vuelve a iniciar sesión para continuar.
            </div>
          )}

          {serverError && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm"
            >
              {serverError}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              {...register('username')}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all"
              placeholder="Ingrese su usuario"
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all"
              placeholder="Ingrese su contraseña"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-lime-400 text-lime-950 font-bold text-sm hover:bg-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 focus:ring-offset-white transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-lime-950 border-t-transparent rounded-full animate-spin" />
                Ingresando...
              </span>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          ¿Dejaste tu equipo en reparación?{' '}
          <Link to="/portal-cliente" className="font-bold text-lime-700 underline-offset-2 hover:underline">
            Consulta su estado con tu ticket
          </Link>
        </p>
      </div>
    </div>
  );
}
