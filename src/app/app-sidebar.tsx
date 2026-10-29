import { LogOut } from 'lucide-react';
import { NavLink, useLocation } from 'react-router';

import { NavBadge } from './nav-badge';
import { NAV_SECTIONS, isItemActive, type NavItem } from './navigation';

interface AppSidebarProps {
  items: readonly NavItem[];
  onNavigate?: () => void;
  onLogout: () => void;
}

export function AppSidebar({ items, onNavigate, onLogout }: AppSidebarProps) {
  const { pathname } = useLocation();
  const groups = NAV_SECTIONS.map((section) => ({ section, items: items.filter((item) => item.section === section.id) })).filter(
    (group) => group.items.length > 0,
  );

  return (
    <nav aria-label="Menú principal" className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {groups.map(({ section, items: sectionItems }) => (
          <div key={section.id}>
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{section.label}</p>
            <ul className="space-y-1">
              {sectionItems.map((item) => {
                const active = isItemActive(item, pathname, items);
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-[44px] items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all ${
                        active ? 'bg-lime-400 text-lime-950 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      {item.badge && <NavBadge kind={item.badge} />}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-500 transition-all hover:border-red-300 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
