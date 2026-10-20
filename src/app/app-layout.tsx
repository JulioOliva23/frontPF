import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { Menu, Smartphone, X } from 'lucide-react';

import { LOGIN_ROUTE, ROLE_DEFAULT_ROUTE, ROLE_LABELS } from '../features/auth/config/role-routes';
import { useAuth } from '../features/auth/hooks/useAuth';
import { AppSidebar } from './app-sidebar';
import { navItemsForRole } from './navigation';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const items = user ? navItemsForRole(user.role) : [];

  const handleLogout = async () => {
    await logout();
    navigate(LOGIN_ROUTE, { replace: true });
  };

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md print:hidden">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={drawerOpen}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <NavLink to={user ? ROLE_DEFAULT_ROUTE[user.role] : '/'} className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-lime-950 shadow-sm">
                <Smartphone className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-base font-extrabold tracking-wide">Servicio Técnico</span>
                <span className="block text-[11px] font-medium text-slate-500">Reparación de celulares</span>
              </span>
            </NavLink>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-100 text-xs font-bold text-lime-800" aria-hidden="true">
                {user.fullName.charAt(0)}
              </span>
              <span className="hidden text-right sm:block">
                <span className="block text-xs font-bold text-slate-700">{user.fullName}</span>
                <span className="block text-[11px] text-slate-400">{ROLE_LABELS[user.role]}</span>
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="lg:flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-white lg:block print:hidden">
          <AppSidebar items={items} onLogout={handleLogout} />
        </aside>

        <div className={`fixed inset-0 z-50 lg:hidden ${drawerOpen ? '' : 'pointer-events-none'}`} aria-hidden={!drawerOpen}>
          <div className={`absolute inset-0 bg-slate-900/50 transition-opacity ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setDrawerOpen(false)} />
          <aside className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-slate-200 bg-white shadow-xl transition-transform ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <span className="text-sm font-extrabold">Servicio Técnico</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Cerrar menú"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 text-slate-500"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <AppSidebar items={items} onNavigate={() => setDrawerOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>

        <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
