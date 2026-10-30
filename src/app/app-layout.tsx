import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { Menu, MoreHorizontal, X } from 'lucide-react';

import { LOGIN_ROUTE, ROLE_DEFAULT_ROUTE, ROLE_LABELS } from '../features/auth/config/role-routes';
import { AgentActionsLive } from '../features/agent-actions/components/AgentActionsLive';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Mascot } from '../shared/components/Mascot';
import { AppSidebar } from './app-sidebar';
import { isItemActive, navItemsForRole } from './navigation';

const MOBILE_ROUTES = ['/', '/ordenes', '/inventario'];
const MOBILE_LABELS: Record<string, string> = { '/': 'Inicio', '/ordenes': 'Órdenes', '/inventario': 'Inventario' };

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const items = user ? navItemsForRole(user.role) : [];
  const mobileItems = items.filter((item) => MOBILE_ROUTES.includes(item.to));

  const handleLogout = async () => {
    await logout();
    navigate(LOGIN_ROUTE, { replace: true });
  };

  useEffect(() => {
    if (!drawerOpen) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
      if (event.key !== 'Tab') return;
      const controls = dialog.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [drawerOpen]);

  return (
    <AgentActionsLive>
    <div className="app-background min-h-dvh text-ink">
      <a href="#main-content" className="sr-only fixed left-4 top-4 z-[70] rounded-xl bg-mint px-4 py-3 font-bold text-mint-deep focus:not-sr-only">Saltar al contenido</a>
      <header inert={drawerOpen} className="app-header sticky top-0 z-40 print:hidden">
        <div className="mx-auto flex h-20 items-center justify-between gap-3 px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button ref={menuButton} type="button" onClick={() => setDrawerOpen(true)} aria-label="Abrir menú" aria-expanded={drawerOpen} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line text-ink-soft lg:hidden">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <NavLink to={user ? ROLE_DEFAULT_ROUTE[user.role] : '/'} className="flex min-w-0 items-center gap-3">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-lavender/30 bg-lavender/10 sm:flex"><Mascot className="h-12 w-12 translate-y-1" /></span>
              <span className="min-w-0"><span className="block text-sm font-extrabold tracking-tight sm:text-base">Servicio Técnico<span className="text-mint">.</span></span><span className="block text-[10px] text-muted sm:text-xs">Tu taller, conectado</span></span>
            </NavLink>
          </div>
          {user && <div className="flex items-center gap-3"><span className="hidden text-right sm:block"><span className="block text-xs font-bold text-ink">{user.fullName}</span><span className="block pt-1 text-[10px] text-muted">{ROLE_LABELS[user.role]}</span></span><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-mint/25 bg-mint/10 text-sm font-bold text-mint" role="img" aria-label={`Sesión de ${user.fullName}`}><Mascot className="h-10 w-10 translate-y-0.5" /></span></div>}
        </div>
      </header>
      <div inert={drawerOpen} className="lg:flex">
        <aside className="app-sidebar sticky top-20 hidden h-[calc(100dvh-5rem)] w-60 shrink-0 overflow-y-auto lg:block xl:w-64 print:hidden"><AppSidebar items={items} onLogout={handleLogout} /></aside>
        <main id="main-content" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-[1400px] flex-1 px-4 pb-32 pt-6 outline-none sm:px-8 sm:pt-8 lg:pb-10 xl:px-10"><Outlet /></main>
      </div>
      <nav inert={drawerOpen} aria-label="Navegación móvil" className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-[22px] border border-lavender/20 bg-surface-soft/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-2xl backdrop-blur-xl lg:hidden print:hidden">
        {mobileItems.map((item) => {
          const active = isItemActive(item, pathname, items);
          return <NavLink key={item.to} to={item.to} end aria-current={active ? 'page' : undefined} className={`flex min-h-[68px] flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl text-[10px] font-bold ${active ? 'text-mint' : 'text-muted'}`}><span className={`rounded-xl px-4 py-1 ${active ? 'bg-mint/10' : ''}`}>{item.icon}</span>{MOBILE_LABELS[item.to]}</NavLink>;
        })}
        <button type="button" onClick={() => setDrawerOpen(true)} aria-expanded={drawerOpen} aria-label="Más opciones" className="flex min-h-[68px] flex-1 flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-muted"><MoreHorizontal className="h-5 w-5" aria-hidden="true" />Más</button>
      </nav>
      {drawerOpen && <div className="fixed inset-0 z-50 print:hidden">
        <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
        <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Menú de navegación" className="absolute inset-y-0 left-0 flex w-80 max-w-[90vw] flex-col border-r border-line bg-surface-soft shadow-2xl outline-none">
          <div className="flex h-20 shrink-0 items-center justify-between border-b border-line px-5"><span className="flex items-center gap-2 text-sm font-bold"><Mascot className="h-10 w-10" />Tu espacio de trabajo</span><button type="button" onClick={() => setDrawerOpen(false)} aria-label="Cerrar menú" className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-surface-raised"><X className="h-5 w-5" aria-hidden="true" /></button></div>
          <div className="min-h-0 flex-1"><AppSidebar items={items} onNavigate={() => setDrawerOpen(false)} onLogout={handleLogout} /></div>
        </div>
      </div>}
    </div>
    </AgentActionsLive>
  );
}
