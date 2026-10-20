import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Smartphone } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <span className="flex items-center gap-2 font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-400 text-lime-950">
              <Smartphone className="h-5 w-5" aria-hidden="true" />
            </span>
            Estado de su reparación
          </span>
          {isCustomer ? (
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/portal-cliente', { replace: true });
              }}
              className="min-h-[44px] rounded-xl px-3 text-xs font-bold text-slate-500 hover:text-red-600"
            >
              Cerrar sesión
            </button>
          ) : (
            !user && (
              <Link to={LOGIN_ROUTE} className="min-h-[44px] rounded-xl px-3 py-3 text-xs font-bold text-slate-500 hover:text-slate-900">
                Ingresar con mi cuenta
              </Link>
            )
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
        {isCustomer ? (
          <>
            <h1 className="text-xl font-extrabold">Hola, {user.fullName}</h1>
            <MyOrders />
          </>
        ) : found ? (
          <>
            <CustomerOrderStatus order={found} />
            <button type="button" onClick={() => setFound(null)} className="min-h-[44px] justify-self-start text-sm font-bold text-lime-800 hover:underline">
              Consultar otra orden
            </button>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-xl font-extrabold">Consulte el estado de su equipo</h1>
              <p className="text-sm text-slate-500">Use el número de orden y el código de seguimiento de su ticket de ingreso.</p>
            </div>
            <TrackingForm onFound={setFound} />
          </>
        )}
      </main>
    </div>
  );
}
