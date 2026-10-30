import { Mascot } from '../../../shared/components/Mascot';
import type { ReactNode } from 'react';
import { AlarmClock, ArrowRight, BellRing, ClipboardList, ClipboardPlus, FileClock, FileText, Package } from 'lucide-react';
import { Link } from 'react-router';

import type { WorkOrderStatus, WorkOrderSummary } from '../../../shared/api/types';
import { ErrorState } from '../../../shared/components/ErrorState';
import { MetricCard } from '../../../shared/components/MetricCard';
import { WORK_ORDER_STATUS_LABELS } from '../../../shared/lib/work-order-status';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLowStockCount } from '../../inventory/hooks/use-spare-parts';
import { useWorkOrderSummary } from '../../work-orders/hooks/use-work-orders';

// Orders waiting for the customer's answer on a sent budget (RN-05).
const AWAITING_APPROVAL: WorkOrderStatus = 'BUDGETED';

const ordersWithStatus = (status: WorkOrderStatus) => `/ordenes?status=${status}`;

function countOf(summary: WorkOrderSummary, status: WorkOrderStatus): number {
  return summary.byStatus.find((entry) => entry.status === status)?.count ?? 0;
}

function MetricLink({ to, label, children }: { to?: string; label: string; children: ReactNode }) {
  if (!to) return <div>{children}</div>;
  return (
    <Link to={to} aria-label={label} className="block rounded-2xl transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavender">
      {children}
    </Link>
  );
}

function QuickLink({ to, icon, title, description }: { to: string; icon: ReactNode; title: string; description: string }) {
  return (
    <Link
      to={to}
      className="glass-card group flex min-h-[76px] items-center gap-4 px-5 py-4 transition-colors hover:border-lavender/40"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-muted group-hover:bg-mint/10 group-hover:text-mint">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">{title}</span>
        <span className="block text-xs text-muted">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted group-hover:text-mint" aria-hidden="true" />
    </Link>
  );
}

function formatToday(): string {
  return new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' });
}

// Front desk landing page (ADMIN, RECEPTIONIST): the day's workload at a
// glance and shortcuts to the queues that need action.
export function DashboardPage() {
  const { user } = useAuth();
  const summary = useWorkOrderSummary();
  const lowStock = useLowStockCount();

  const value = (count: number | undefined, isLoading: boolean, isError: boolean) => (isLoading ? '…' : isError ? '—' : (count ?? 0));
  const data = summary.data;
  const overdue = data?.overdue ?? 0;
  const awaiting = data ? countOf(data, AWAITING_APPROVAL) : 0;
  const lowStockCount = lowStock.data ?? 0;

  return (
    <div className="grid gap-6">
      <header className="glass-card relative flex flex-wrap items-center justify-between gap-5 overflow-hidden p-6 sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted first-letter:uppercase">{formatToday()}</p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Hola{user ? `, ${user.fullName.split(' ')[0]}` : ''}</h1>
          <p className="text-sm text-muted">Resumen del servicio técnico</p><p className="mt-4 max-w-xs text-xs leading-relaxed text-muted">Cada equipo tiene una historia.<br />Vamos a cuidar la siguiente.</p>
        </div>
        <div className="flex items-center gap-6"><div className="mascot-halo hidden w-36 sm:block"><Mascot className="w-full" /></div><Link to="/ordenes/nueva" className="primary-action">
          <ClipboardPlus className="h-4 w-4" aria-hidden="true" /> Nuevo ingreso
        </Link></div>
      </header>

      {summary.isError && (
        <ErrorState message="No se pudo cargar el resumen de órdenes." onRetry={() => void summary.refetch()} />
      )}

      <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MetricLink to="/ordenes" label="Ver órdenes activas">
          <MetricCard
            theme="light"
            title="OTs activas"
            value={value(data?.active, summary.isLoading, summary.isError)}
            subtitle="Equipos que siguen en el local"
            icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />}
          />
        </MetricLink>
        <MetricLink label="OTs retrasadas">
          <MetricCard
            theme="light"
            title="OTs retrasadas"
            variant={overdue > 0 ? 'danger' : 'default'}
            value={value(data?.overdue, summary.isLoading, summary.isError)}
            subtitle="Fecha compromiso vencida"
            icon={<AlarmClock className="h-5 w-5" aria-hidden="true" />}
          />
        </MetricLink>
        <MetricLink to={ordersWithStatus(AWAITING_APPROVAL)} label="Ver presupuestos por aprobar">
          <MetricCard
            theme="light"
            title="Presupuestos por aprobar"
            variant={awaiting > 0 ? 'warning' : 'default'}
            value={value(data ? awaiting : undefined, summary.isLoading, summary.isError)}
            subtitle="Enviados, esperando al cliente"
            icon={<FileClock className="h-5 w-5" aria-hidden="true" />}
          />
        </MetricLink>
        <MetricLink to="/inventario/alertas" label="Ver repuestos con stock bajo">
          <MetricCard
            theme="light"
            title="Stock bajo"
            variant={lowStockCount > 0 ? 'warning' : 'default'}
            value={value(lowStock.data, lowStock.isLoading, lowStock.isError)}
            subtitle="Repuestos en el mínimo o por debajo"
            icon={<BellRing className="h-5 w-5" aria-hidden="true" />}
          />
        </MetricLink>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <section aria-labelledby="quick-links-title" className="grid content-start gap-3">
          <h2 id="quick-links-title" className="text-sm font-extrabold text-ink-soft">
            Accesos rápidos
          </h2>
          <QuickLink
            to={ordersWithStatus(AWAITING_APPROVAL)}
            icon={<FileText className="h-5 w-5" aria-hidden="true" />}
            title="Presupuestos pendientes"
            description="Órdenes esperando la respuesta del cliente"
          />
          <QuickLink to="/inventario" icon={<Package className="h-5 w-5" aria-hidden="true" />} title="Inventario" description="Catálogo, ingresos y ajustes de stock" />
          <QuickLink
            to="/ordenes/nueva"
            icon={<ClipboardPlus className="h-5 w-5" aria-hidden="true" />}
            title="Recepción de equipo"
            description="Registrar un ingreso y abrir la OT"
          />
        </section>

        {data && (
          <section aria-labelledby="by-status-title" className="glass-card p-5 sm:p-6">
            <h2 id="by-status-title" className="mb-3 text-sm font-extrabold text-ink-soft">
              Órdenes por estado
            </h2>
            <ul className="grid gap-1 sm:grid-cols-2">
              {data.byStatus.map((entry) => (
                <li key={entry.status}>
                  <Link
                    to={ordersWithStatus(entry.status)}
                    className="flex min-h-[40px] items-center justify-between rounded-xl px-3 text-sm text-muted hover:bg-surface-raised hover:text-ink"
                  >
                    <span>{WORK_ORDER_STATUS_LABELS[entry.status]}</span>
                    <span className="font-mono font-bold text-ink">{entry.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
