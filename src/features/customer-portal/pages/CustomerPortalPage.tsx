import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Mascot } from '../../../shared/components/Mascot';
import { Link, useNavigate } from 'react-router';

import { queryKeys } from '../../../shared/api/query-keys';
import type { CustomerWorkOrderStatus } from '../../../shared/api/types';
import { EmptyState } from '../../../shared/components/EmptyState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { LOGIN_ROUTE } from '../../auth/config/role-routes';
import { useAuth } from '../../auth/hooks/useAuth';
import { customerPortalApi } from '../api/customer-portal-api';
import { CustomerOrderStatus } from '../components/CustomerOrderStatus';
import { TrackingForm } from '../components/TrackingForm';

function MyOrders() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.workOrders.mine, queryFn: customerPortalApi.mine });
  if (isLoading) return <LoadingSkeleton rows={2} />;
  if (!data || data.length === 0) return <EmptyState title="Sin equipos en el servicio" description="No tiene órdenes registradas a su nombre." />;
  return (
    <div className="grid gap-4">
      {data.map((order) => (
        <CustomerOrderStatus key={order.id} order={order} />
      ))}
    </div>
  );
}

// US-F10 / SUP-05: public page. A CUSTOMER session lists all their orders;
// otherwise the number + tracking code form looks up a single order.
export function CustomerPortalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [found, setFound] = useState<CustomerWorkOrderStatus | null>(null);
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <div className="app-background min-h-dvh text-ink">
      <header className="app-header">
        <div className="mx-auto flex min-h-20 max-w-4xl items-center justify-between gap-3 px-5">
          <span className="flex items-center gap-3 text-xs font-extrabold sm:text-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-lavender/25 bg-lavender/10"><Mascot className="h-10 w-10" /></span>
            Estado de su reparación
          </span>
          {isCustomer ? (
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/portal-cliente', { replace: true });
              }}
              className="min-h-[44px] rounded-xl px-3 text-xs font-bold text-muted hover:text-red-300"
            >
              Cerrar sesión
            </button>
          ) : (
            !user && (
              <Link to={LOGIN_ROUTE} className="min-h-[44px] rounded-xl px-3 py-3 text-xs font-bold text-muted hover:text-ink">
                Ingresar con mi cuenta
              </Link>
            )
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-3xl gap-6 px-5 py-8 sm:py-12">
        {isCustomer ? (
          <>
            <h1 className="text-xl font-extrabold">Hola, {user.fullName}</h1>
            <MyOrders />
          </>
        ) : found ? (
          <>
            <p className="eyebrow">Tu equipo, paso a paso</p><CustomerOrderStatus order={found} />
            <button type="button" onClick={() => setFound(null)} className="min-h-[44px] justify-self-start text-sm font-bold text-mint hover:underline">
              <ArrowLeft className="mr-2 inline h-4 w-4" aria-hidden="true" />Consultar otra orden
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto max-w-lg text-center">
              <div className="mascot-halo mx-auto mb-5 w-36"><Mascot className="w-full" /></div>
              <p className="eyebrow mb-3">Cerca de ti, en cada paso</p>
              <h1 className="text-3xl font-extrabold leading-tight">Consulte el estado de su equipo</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">Use el número de orden y el código de seguimiento de su ticket de ingreso.</p>
            </div>
            <div className="mx-auto w-full max-w-lg"><TrackingForm onFound={setFound} /></div><p className="flex items-center justify-center gap-2 text-center text-xs text-muted"><ShieldCheck className="h-4 w-4 text-mint" aria-hidden="true" />Mantén tu código de seguimiento en un lugar seguro.</p>
          </>
        )}
      </main>
    </div>
  );
}
