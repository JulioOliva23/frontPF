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
    <Link to={to} aria-label={label} className="block rounded-2xl transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600">
      {children}
    </Link>
  );
}

function QuickLink({ to, icon, title, description }: { to: string; icon: ReactNode; title: string; description: string }) {
  return (
    <Link
      to={to}
      className="group flex min-h-[64px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-cyan-400"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-cyan-100 group-hover:text-cyan-800">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-900">{title}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-700" aria-hidden="true" />
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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 first-letter:uppercase">{formatToday()}</p>
          <h1 className="text-2xl font-extrabold">Hola{user ? `, ${user.fullName.split(' ')[0]}` : ''}</h1>
          <p className="text-sm text-slate-500">Resumen del servicio técnico</p>
        </div>
        <Link
          to="/ordenes/nueva"
          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-bold text-cyan-950 shadow-sm hover:bg-cyan-300"
        >
          <ClipboardPlus className="h-4 w-4" aria-hidden="true" /> Nuevo ingreso
        </Link>
      </header>

      {summary.isError && (
        <ErrorState message="No se pudo cargar el resumen de órdenes." onRetry={() => void summary.refetch()} />
      )}

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <h2 id="quick-links-title" className="text-sm font-extrabold text-slate-700">
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
          <section aria-labelledby="by-status-title" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 id="by-status-title" className="mb-3 text-sm font-extrabold text-slate-700">
              Órdenes por estado
            </h2>
            <ul className="grid gap-1 sm:grid-cols-2">
              {data.byStatus.map((entry) => (
                <li key={entry.status}>
                  <Link
                    to={ordersWithStatus(entry.status)}
                    className="flex min-h-[40px] items-center justify-between rounded-xl px-3 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <span>{WORK_ORDER_STATUS_LABELS[entry.status]}</span>
                    <span className="font-mono font-bold text-slate-900">{entry.count}</span>
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
