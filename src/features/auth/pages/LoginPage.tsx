import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, LockKeyhole, Search, ShieldCheck, UserRound } from 'lucide-react';
import { Mascot } from '../../../shared/components/Mascot';
import { Button } from '../../../shared/components/Button';

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
    <div className="app-background flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Link to="/auth/login" className="flex items-center gap-2.5 text-sm font-extrabold"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-lavender/30 bg-lavender/10"><Mascot className="h-9 w-9 translate-y-0.5" /></span>Servicio Técnico<span className="text-mint">.</span></Link>
        <span className="hidden text-xs text-muted sm:block">Reparaciones claras, de principio a fin.</span>
      </header>
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-6 pb-10 sm:px-10 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:py-10">
        <section className="text-center lg:text-left" aria-labelledby="welcome-title">
          <p className="eyebrow mb-4">Un poco de calma para tu día</p>
          <div className="mascot-halo mx-auto mb-5 w-52 sm:w-64 lg:mx-0 lg:w-72"><Mascot className="relative w-full drop-shadow-xl" decorative={false} /></div>
          <h1 id="welcome-title" className="text-[2rem] font-extrabold leading-[1.15] sm:text-5xl">Tu celular,<br /><span className="gradient-text">en buenas manos.</span></h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted lg:mx-0">Reparaciones claras. Todo bajo control.<br />Un espacio para cuidar cada equipo y acompañar a cada cliente.</p>
          <div className="mt-6 hidden items-center gap-2 text-xs text-mint lg:flex"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Información protegida. Atención cercana.</div>
        </section>
        <div className="mx-auto w-full max-w-md">
          <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 sm:p-8" noValidate>
            <p className="eyebrow mb-2">Bienvenido a tu taller</p>
            <h2 className="text-2xl font-extrabold">Iniciar Sesión</h2>
            <p className="mb-7 mt-2 text-xs leading-relaxed text-muted">Ingresa a tu cuenta para continuar con tu día.</p>
            {redirect.reason === 'session-expired' && !serverError && <div role="status" className="mb-4 rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-300">Tu sesión expiró. Vuelve a iniciar sesión para continuar.</div>}
            {serverError && <div role="alert" className="mb-4 rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-300">{serverError}</div>}
            <div className="mb-5">
              <label htmlFor="username" className="mb-2 block text-xs font-semibold text-ink-soft">Usuario</label>
              <div className="relative"><UserRound className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-muted" aria-hidden="true" /><input id="username" type="text" autoComplete="username" {...register('username')} aria-invalid={Boolean(errors.username)} aria-describedby={errors.username ? 'username-error' : undefined} className="h-12 w-full rounded-2xl border border-line bg-surface-soft/70 pl-11 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-muted/65 focus:border-lavender focus:ring-2 focus:ring-lavender/15" placeholder="Ingrese su usuario" /></div>
              {errors.username && <p id="username-error" className="mt-2 text-xs text-red-300">{errors.username.message}</p>}
            </div>
            <div className="mb-7">
              <label htmlFor="password" className="mb-2 block text-xs font-semibold text-ink-soft">Contraseña</label>
              <div className="relative"><LockKeyhole className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-muted" aria-hidden="true" /><input id="password" type="password" autoComplete="current-password" {...register('password')} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} className="h-12 w-full rounded-2xl border border-line bg-surface-soft/70 pl-11 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-muted/65 focus:border-lavender focus:ring-2 focus:ring-lavender/15" placeholder="Ingrese su contraseña" /></div>
              {errors.password && <p id="password-error" className="mt-2 text-xs text-red-300">{errors.password.message}</p>}
            </div>
            <Button type="submit" isLoading={isSubmitting} className="w-full" rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>Ingresar</Button>
          </form>
          <div className="mt-6 text-center"><p className="mb-3 text-xs text-muted">¿Dejaste tu equipo en reparación?</p><Link to="/portal-cliente" className="secondary-action w-full"><Search className="h-4 w-4" aria-hidden="true" />Consulta su estado con tu ticket</Link></div>
        </div>
      </main>
      <footer className="px-6 pb-6 text-center text-[10px] tracking-wide text-muted/75">Cuidamos tu equipo. Simplificamos tu día.</footer>
    </div>
  );
}
