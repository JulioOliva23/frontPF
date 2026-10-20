import { ArrowLeft, FileText } from 'lucide-react';
import { Link, useParams } from 'react-router';

import type { WorkOrder } from '../../../shared/api/types';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { StatusTimeline } from '../../../shared/components/StatusTimeline';
import { formatWorkOrderNumber } from '../../../shared/lib/tracking-code';
import { WORK_ORDER_FLOW, WORK_ORDER_STATUS_LABELS } from '../../../shared/lib/work-order-status';
import { toApiError } from '../../../shared/api/httpClient';
import { FRONT_DESK_ROLES } from '../../auth/config/role-routes';
import { useAuth } from '../../auth/hooks/useAuth';
import { AssignTechnicianPanel } from '../components/AssignTechnicianPanel';
import { AuditTimeline } from '../components/AuditTimeline';
import { DiagnosisForm } from '../components/DiagnosisForm';
import { TrackingCodePanel } from '../components/TrackingCodePanel';
import { TransitionActions } from '../components/TransitionActions';
import { UnlockCodeReveal } from '../components/UnlockCodeReveal';
import { WorkOrderStatusBadge } from '../components/WorkOrderStatusBadge';
import { COSMETIC_CONDITIONS, COSMETIC_ZONES } from '../schemas/check-in-schema';
import { useWorkOrder } from '../hooks/use-work-orders';

const STEPS = WORK_ORDER_FLOW.map((status) => ({ key: status, label: WORK_ORDER_STATUS_LABELS[status] }));
const CONDITION_LABEL = Object.fromEntries(COSMETIC_CONDITIONS.map((condition) => [condition.value, condition.label]));
const BUDGET_STAGE: ReadonlyArray<WorkOrder['status']> = ['IN_DIAGNOSIS', 'BUDGETED'];

function InfoCard({ order }: { order: WorkOrder }) {
  return (
    <section aria-label="Datos de la orden" className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-slate-500">Cliente</dt>
        <dd className="font-semibold">{order.customer.name}</dd>
        <dt className="text-slate-500">Equipo</dt>
        <dd className="font-semibold">
          {order.device.brand} {order.device.model}
          {order.device.color ? ` · ${order.device.color}` : ''}
        </dd>
        <dt className="text-slate-500">IMEI</dt>
        <dd className="font-mono">{order.device.imei}</dd>
        <dt className="text-slate-500">Batería</dt>
        <dd>{order.batteryLevel === null ? 'No enciende / sin dato' : `${order.batteryLevel}%`}</dd>
        <dt className="text-slate-500">Técnico</dt>
        <dd>{order.technician?.name ?? 'Sin asignar'}</dd>
        {order.promisedAt && (
          <>
            <dt className="text-slate-500">Compromiso</dt>
            <dd>{new Date(order.promisedAt).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })}</dd>
          </>
        )}
      </dl>
      <div className="grid gap-2 text-sm">
        <p className="text-slate-500">Problema reportado</p>
        <p>{order.reportedProblem}</p>
        <p className="mt-2 text-slate-500">Estado cosmético al ingreso</p>
        <ul className="flex flex-wrap gap-1.5">
          {COSMETIC_ZONES.map((zone) => {
            const condition = order.cosmeticCheckIn[zone.key];
            return (
              <li key={zone.key} className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${condition === 'OK' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-800'}`}>
                {zone.label}: {CONDITION_LABEL[condition]}
              </li>
            );
          })}
        </ul>
        {order.cosmeticCheckIn.notes && <p className="text-xs text-slate-600">{order.cosmeticCheckIn.notes}</p>}
      </div>
    </section>
  );
}

export function WorkOrderDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const { data: order, isLoading, isError, error, refetch } = useWorkOrder(id);

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !order) {
    const apiError = toApiError(error);
    return (
      <ErrorState
        message={apiError?.statusCode === 403 ? 'Esta orden no está asignada a ti.' : apiError?.isNotFound ? 'La orden no existe.' : 'No se pudo cargar la orden.'}
        onRetry={() => void refetch()}
      />
    );
  }

  const isFrontDesk = user ? FRONT_DESK_ROLES.includes(user.role) : false;
  const isAssignedTechnician = user?.role === 'TECHNICIAN' && order.technician?.id === user.id;
  const canDiagnose = order.status === 'IN_DIAGNOSIS' && (isAssignedTechnician || user?.role === 'ADMIN');

  return (
    <div className="grid gap-6">
      <Link to="/ordenes" className="flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a órdenes
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold">{formatWorkOrderNumber(order.number)}</h1>
          <WorkOrderStatusBadge status={order.status} />
        </div>
        {isFrontDesk && BUDGET_STAGE.includes(order.status) && (
          <Link
            to={`/presupuestos/${order.id}`}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            <FileText className="h-4 w-4" aria-hidden="true" /> {order.status === 'BUDGETED' ? 'Registrar respuesta del cliente' : 'Armar presupuesto'}
          </Link>
        )}
      </header>

      <StatusTimeline steps={STEPS} currentKey={order.status} interruptedLabel={order.status === 'CANCELLED' ? 'Orden cancelada' : undefined} />

      <TransitionActions order={order} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="grid content-start gap-6">
          <InfoCard order={order} />
          {canDiagnose ? (
            <DiagnosisForm order={order} />
          ) : (
            order.preliminaryDiagnosis && (
              <section aria-label="Diagnóstico" className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Diagnóstico preliminar</h2>
                <p className="mt-2">{order.preliminaryDiagnosis}</p>
              </section>
            )
          )}
          {isFrontDesk && <AssignTechnicianPanel order={order} />}
        </div>
        <div className="grid content-start gap-6">
          {order.hasUnlockCode && (
            <UnlockCodeReveal workOrderId={order.id} lockType={order.lockType} canReveal={isAssignedTechnician || user?.role === 'ADMIN'} />
          )}
          {isFrontDesk && <TrackingCodePanel workOrderId={order.id} />}
          <AuditTimeline workOrderId={order.id} />
        </div>
      </div>
    </div>
  );
}
