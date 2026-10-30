import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { agentActionFixture } from '../../../test/fixtures';
import { server } from '../../../test/msw-server';
import { api, renderWithProviders } from '../../../test/render';
import { AgentApprovalsPage } from './AgentApprovalsPage';

describe('AgentApprovalsPage (AG-01 human in the loop)', () => {
  it('approves only after the person confirms they reviewed the order', async () => {
    const action = agentActionFixture();
    let body: unknown;
    server.use(
      http.get(api('/agent-actions'), () => HttpResponse.json([action])),
      http.post(api(`/agent-actions/${action.id}/approve`), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...action, status: 'EXECUTED' });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<AgentApprovalsPage />, { role: 'TECHNICIAN', userId: 'tech-1' });

    expect(await screen.findByText('Presupuesto aprobado y repuestos disponibles')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Revisar y aprobar' }));

    const approve = screen.getByRole('button', { name: /Aprobar y ejecutar/ });
    expect(approve).toBeDisabled();
    expect(screen.getByText(/Stock Guard/)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox'));
    await user.type(screen.getByLabelText('Nota (opcional)'), 'Revisado en mesa');
    await user.click(approve);

    await waitFor(() => expect(body).toEqual({ note: 'Revisado en mesa' }));
    expect(await screen.findByText('OT-000123 pasó a En Reparación')).toBeInTheDocument();
  });

  it('requires typing the order number to approve an irreversible change', async () => {
    const action = agentActionFixture({ from: 'READY_FOR_DELIVERY', to: 'DELIVERED', approverRoles: ['RECEPTIONIST', 'ADMIN'] });
    server.use(http.get(api('/agent-actions'), () => HttpResponse.json([action])));
    const user = userEvent.setup();
    renderWithProviders(<AgentApprovalsPage />, { role: 'RECEPTIONIST', userId: 'rec-1' });

    await user.click(await screen.findByRole('button', { name: 'Revisar y aprobar' }));
    await user.click(screen.getByRole('checkbox'));
    const approve = screen.getByRole('button', { name: /Aprobar y ejecutar/ });
    expect(approve).toBeDisabled();

    await user.type(screen.getByLabelText('Número de orden para confirmar'), 'ot-000123');
    expect(approve).toBeEnabled();
  });

  it('shows why the execution failed and keeps the proposal open (RN-09)', async () => {
    const action = agentActionFixture();
    server.use(
      http.get(api('/agent-actions'), () => HttpResponse.json([action])),
      http.post(api(`/agent-actions/${action.id}/approve`), () =>
        HttpResponse.json({ statusCode: 422, message: 'Stock insuficiente para Pantalla OLED', code: 'INSUFFICIENT_STOCK' }, { status: 422 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<AgentApprovalsPage />, { role: 'ADMIN', userId: 'admin-1' });

    await user.click(await screen.findByRole('button', { name: 'Revisar y aprobar' }));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /Aprobar y ejecutar/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Stock insuficiente para Pantalla OLED');
  });

  it('renders decisions conditionally by role: reception can reject a repair start but not approve it', async () => {
    server.use(http.get(api('/agent-actions'), () => HttpResponse.json([agentActionFixture()])));
    renderWithProviders(<AgentApprovalsPage />, { role: 'RECEPTIONIST', userId: 'rec-1' });

    expect(await screen.findByRole('button', { name: 'Rechazar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Revisar y aprobar' })).not.toBeInTheDocument();
    expect(screen.getByText('La aprueba: TECHNICIAN o ADMIN')).toBeInTheDocument();
  });

  it('says when nothing is waiting', async () => {
    renderWithProviders(<AgentApprovalsPage />);
    expect(await screen.findByText('Sin propuestas pendientes')).toBeInTheDocument();
  });
});
