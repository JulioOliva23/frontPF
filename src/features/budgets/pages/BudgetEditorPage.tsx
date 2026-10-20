import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';

import { toApiError } from '../../../shared/api/httpClient';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { useToast } from '../../../shared/components/toast-context';
import { formatWorkOrderNumber } from '../../../shared/lib/tracking-code';
import { WorkOrderStatusBadge } from '../../work-orders/components/WorkOrderStatusBadge';
import { useWorkOrder } from '../../work-orders/hooks/use-work-orders';
import { BudgetBuilder } from '../components/BudgetBuilder';
import { BudgetDecisionModal } from '../components/BudgetDecisionModal';
import { BudgetVersionCard } from '../components/BudgetVersionCard';
import { useBudgetDecision, useBudgets } from '../hooks/use-budgets';

// US-F05 / US-F06: build, send and record the customer's decision.
export function BudgetEditorPage() {
  const { workOrderId = '' } = useParams();
  const order = useWorkOrder(workOrderId);
  const budgets = useBudgets(workOrderId);
  const { send, approve, reject } = useBudgetDecision(workOrderId);
  const toast = useToast();
  const [deciding, setDeciding] = useState<{ id: string; decision: 'approve' | 'reject' } | null>(null);
  const [building, setBuilding] = useState(false);

  if (order.isLoading || budgets.isLoading) return <LoadingSkeleton />;
  if (order.isError || !order.data) return <ErrorState message="No se pudo cargar la orden." onRetry={() => void order.refetch()} />;

  const workOrder = order.data;
  const canBudget = workOrder.status === 'IN_DIAGNOSIS' || workOrder.status === 'BUDGETED';
  const decisionMutation = deciding?.decision === 'reject' ? reject : approve;
  const actionError = toApiError(send.error);

  const closeDecision = () => {
    setDeciding(null);
    approve.reset();
    reject.reset();
  };

  return (
    <div className="grid gap-6">
      <Link to="/presupuestos" className="flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a presupuestos
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-extrabold">
            Presupuesto · {formatWorkOrderNumber(workOrder.number)} <WorkOrderStatusBadge status={workOrder.status} />
          </h1>
          <p className="text-sm text-slate-500">
            {workOrder.device.brand} {workOrder.device.model} · {workOrder.customer.name}
          </p>
        </div>
        <Link to={`/ordenes/${workOrder.id}`} className="text-xs font-bold text-lime-800 hover:underline">
          Ver orden
        </Link>
      </header>

      {workOrder.preliminaryDiagnosis && (
        <section aria-label="Diagnóstico" className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-sky-800">Diagnóstico del técnico</p>
          <p className="mt-1 text-sky-950">{workOrder.preliminaryDiagnosis}</p>
        </section>
      )}

      {actionError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError.message}
        </p>
      )}

      {canBudget &&
        (building ? (
          <BudgetBuilder
            workOrderId={workOrder.id}
            deviceModelId={workOrder.device.deviceModelId}
            deviceLabel={`${workOrder.device.brand} ${workOrder.device.model}`}
            onCreated={() => {
              setBuilding(false);
              toast.success('Borrador guardado', 'Revíselo y envíelo al cliente.');
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setBuilding(true)}
            className="min-h-[52px] rounded-2xl border-2 border-dashed border-slate-300 text-sm font-bold text-slate-600 hover:border-lime-500 hover:text-lime-800"
          >
            + Nueva versión de presupuesto
          </button>
        ))}
      {!canBudget && <p className="text-xs text-slate-500">La orden ya no admite nuevos presupuestos.</p>}

      <section aria-label="Versiones" className="grid gap-4 lg:grid-cols-2">
        {budgets.data?.length === 0 && <p className="text-sm text-slate-500">Todavía no hay presupuestos para esta orden.</p>}
        {budgets.data?.map((budget) => (
          <BudgetVersionCard
            key={budget.id}
            budget={budget}
            isSending={send.isPending && send.variables === budget.id}
            onSend={canBudget ? () => send.mutate(budget.id, { onSuccess: () => toast.success('Presupuesto enviado') }) : undefined}
            onApprove={workOrder.status === 'BUDGETED' ? () => setDeciding({ id: budget.id, decision: 'approve' }) : undefined}
            onReject={workOrder.status === 'BUDGETED' ? () => setDeciding({ id: budget.id, decision: 'reject' }) : undefined}
          />
        ))}
      </section>

      <BudgetDecisionModal
        key={deciding ? `${deciding.id}-${deciding.decision}` : 'closed'}
        decision={deciding?.decision ?? null}
        isPending={decisionMutation.isPending}
        error={toApiError(decisionMutation.error)?.message}
        onClose={closeDecision}
        onConfirm={(channel, reason) => {
          if (!deciding) return;
          const done = { onSuccess: () => { closeDecision(); toast.success(deciding.decision === 'approve' ? 'Aprobación registrada' : 'Rechazo registrado'); } };
          if (deciding.decision === 'approve') approve.mutate({ id: deciding.id, channel }, done);
          else reject.mutate({ id: deciding.id, channel, reason }, done);
        }}
      />
    </div>
  );
}
