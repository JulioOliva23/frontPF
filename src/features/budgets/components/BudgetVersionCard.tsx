import type { Budget } from '../../../shared/api/types';
import { Button } from '../../../shared/components/Button';
import { formatBoB } from '../../../shared/lib/money';
import { effectiveBudgetStatus } from '../lib/budget-status';
import { BudgetStatusBadge } from './BudgetStatusBadge';

interface BudgetVersionCardProps {
  budget: Budget;
  onSend?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isSending?: boolean;
}

const dateFormat = new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' });

export function BudgetVersionCard({ budget, onSend, onApprove, onReject, isSending }: BudgetVersionCardProps) {
  const status = effectiveBudgetStatus(budget);
  const muted = status === 'SUPERSEDED' || status === 'EXPIRED' || status === 'REJECTED';

  return (
    <article aria-label={`Presupuesto versión ${budget.version}`} className={`rounded-2xl border bg-surface p-4 ${muted ? 'border-line opacity-75' : 'border-line'}`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold">Versión {budget.version}</h3>
        <BudgetStatusBadge budget={budget} />
      </header>

      <table className="mt-3 w-full text-sm">
        <tbody className="divide-y divide-line">
          {budget.items.map((item) => (
            <tr key={item.id}>
              <td className="py-1.5 pr-2">
                <span className="mr-2 text-[11px] font-bold uppercase text-muted">{item.itemType === 'LABOR' ? 'MO' : 'REP'}</span>
                {item.description}
              </td>
              <td className="py-1.5 pr-2 text-right text-muted">×{item.quantity}</td>
              <td className="py-1.5 text-right">{formatBoB(item.subtotal, budget.currency)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="text-xs text-muted">
          <tr>
            <td colSpan={2} className="pt-2">Mano de obra</td>
            <td className="pt-2 text-right">{formatBoB(budget.laborSubtotal, budget.currency)}</td>
          </tr>
          <tr>
            <td colSpan={2}>Repuestos</td>
            <td className="text-right">{formatBoB(budget.partsSubtotal, budget.currency)}</td>
          </tr>
          <tr className="text-sm font-extrabold text-ink">
            <td colSpan={2} className="pt-1">Total</td>
            <td className="pt-1 text-right">{formatBoB(budget.total, budget.currency)}</td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-3 text-[11px] text-muted">
        {budget.sentAt ? `Enviado ${dateFormat.format(new Date(budget.sentAt))} · vence ${dateFormat.format(new Date(budget.expiresAt))}` : 'Aún no enviado al cliente'}
        {budget.decidedAt && ` · decidido ${dateFormat.format(new Date(budget.decidedAt))}`}
      </p>
      {budget.rejectionReason && <p className="mt-1 text-xs text-red-300">Motivo: {budget.rejectionReason}</p>}
      {status === 'EXPIRED' && (
        <p role="note" className="mt-2 rounded-lg bg-orange-400/10 p-2 text-xs font-semibold text-orange-300">
          Presupuesto vencido: emita una nueva versión para que el cliente la apruebe.
        </p>
      )}

      {(onSend || onApprove || onReject) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {status === 'DRAFT' && onSend && (
            <Button size="sm" onClick={onSend} isLoading={isSending}>
              Enviar al cliente
            </Button>
          )}
          {status === 'SENT' && onApprove && (
            <Button size="sm" onClick={onApprove}>
              Cliente aprobó
            </Button>
          )}
          {status === 'SENT' && onReject && (
            <Button size="sm" variant="danger" onClick={onReject}>
              Cliente rechazó
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
