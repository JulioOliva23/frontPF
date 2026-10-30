import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../../test/msw-server';
import { sparePartFixture, workOrderFixture } from '../../../test/fixtures';
import { api, renderWithProviders } from '../../../test/render';
import { visibleTransitions } from '../lib/visible-transitions';
import { TransitionActions } from './TransitionActions';

describe('TransitionActions (FE-08)', () => {
  it('renders only the backend-allowed transitions, leaving budget steps to the budget flow [004/RF-2.1] [004/RF-2.2]', () => {
    expect(visibleTransitions(workOrderFixture({ status: 'BUDGETED', allowedTransitions: ['APPROVED', 'CANCELLED'] }))).toEqual([]);
    expect(visibleTransitions(workOrderFixture({ status: 'IN_DIAGNOSIS', allowedTransitions: ['BUDGETED', 'CANCELLED'] }))).toEqual(['CANCELLED']);
    expect(visibleTransitions(workOrderFixture({ status: 'QUALITY_CONTROL', allowedTransitions: ['READY_FOR_DELIVERY', 'IN_REPAIR'] }))).toEqual([
      'READY_FOR_DELIVERY',
      'IN_REPAIR',
    ]);
  });

  it('shows the missing parts when the Stock Guard blocks IN_REPAIR (RN-09) [004/RF-3.1]', async () => {
    const order = workOrderFixture();
    server.use(
      http.post(api(`/work-orders/${order.id}/transitions`), () =>
        HttpResponse.json({ statusCode: 422, message: 'RN-09: insufficient stock to start the repair', code: 'INSUFFICIENT_STOCK', sparePartIds: ['p1'] }, { status: 422 }),
      ),
      http.get(api('/spare-parts/p1'), () => HttpResponse.json(sparePartFixture())),
    );
    const user = userEvent.setup();
    renderWithProviders(<TransitionActions order={order} />, { role: 'TECHNICIAN', userId: 'tech-1' });

    await user.click(screen.getByRole('button', { name: 'Iniciar reparación' }));

    expect(await screen.findByText('No hay stock suficiente para iniciar la reparación')).toBeInTheDocument();
    expect(await screen.findByText(/Pantalla OLED iPhone 13 \(OLED-IP13\) · disponible: 0/)).toBeInTheDocument();
  });

  it('renders nothing when the viewer has no transitions [004/RF-2.7]', () => {
    renderWithProviders(<TransitionActions order={workOrderFixture({ allowedTransitions: [] })} />);
    expect(screen.queryByRole('region', { name: 'Acciones de estado' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
