import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { UserRole, WorkOrder } from '../../../shared/api/types';
import { server } from '../../../test/msw-server';
import { api, renderWithProviders } from '../../../test/render';
import { workOrderFixture } from '../../../test/fixtures';
import { WorkOrderDetailPage } from './WorkOrderDetailPage';

const ID = '11111111-1111-4111-8111-111111111111';

function mockOrder(order: WorkOrder, audit: unknown[] = []) {
  server.use(
    http.get(api(`/work-orders/${ID}`), () => HttpResponse.json(order)),
    http.get(api(`/work-orders/${ID}/audit`), () => HttpResponse.json(audit)),
    http.get(api('/users'), () =>
      HttpResponse.json([
        { id: 'tech-1', username: 'tecnico01', fullName: 'Técnico Uno', role: 'TECHNICIAN', customerId: null, isActive: true },
        { id: 'tech-2', username: 'tecnico02', fullName: 'Técnico Dos', role: 'TECHNICIAN', customerId: null, isActive: true },
      ]),
    ),
  );
}

function renderPage(role: UserRole = 'RECEPTIONIST', userId?: string) {
  return renderWithProviders(<WorkOrderDetailPage />, { role, userId, route: `/ordenes/${ID}`, path: '/ordenes/:id' });
}

describe('WorkOrderDetailPage', () => {
  it.each([
    [403, 'Esta orden no está asignada a ti.'],
    [404, 'La orden no existe.'],
    [500, 'No se pudo cargar la orden.'],
  ])('explains a %i when loading the order [004/RF-1.5]', async (status, message) => {
    server.use(http.get(api(`/work-orders/${ID}`), () => HttpResponse.json({ statusCode: status, message: 'x' }, { status })));
    renderPage();
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('shows the order data, progress and audit history to the front desk [004/RF-1.1] [004/RF-1.3] [004/RF-10.1] [004/RF-1.2]', async () => {
    mockOrder(
      workOrderFixture({
        status: 'IN_DIAGNOSIS',
        allowedTransitions: ['BUDGETED', 'CANCELLED'],
        batteryLevel: null,
        promisedAt: '2026-10-25T15:00:00.000Z',
        preliminaryDiagnosis: 'Flex de pantalla cortado',
        cosmeticCheckIn: { screen: 'CRACKED', backCover: 'OK', frame: 'OK', cameraLens: 'OK', buttons: 'OK', notes: 'Rayón en la esquina' },
        device: { ...workOrderFixture().device, color: 'Azul' },
      }),
      [
        { previousStatus: 'RECEIVED', newStatus: 'IN_DIAGNOSIS', reason: 'Inicio de revisión', userId: 'u1', userName: 'Técnico Uno', createdAt: '2026-10-19T13:00:00.000Z' },
      ],
    );
    renderPage('RECEPTIONIST');

    expect(await screen.findByRole('heading', { name: 'OT-000123' })).toBeInTheDocument();
    const info = screen.getByRole('region', { name: 'Datos de la orden' });
    expect(within(info).getByText('Apple iPhone 13 · Azul')).toBeInTheDocument();
    expect(within(info).getByText('No enciende / sin dato')).toBeInTheDocument();
    expect(within(info).getByText('Compromiso')).toBeInTheDocument();
    expect(within(info).getByText('Rayón en la esquina')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Armar presupuesto/ })).toHaveAttribute('href', `/presupuestos/${ID}`);
    expect(screen.getByText('Flex de pantalla cortado')).toBeInTheDocument();
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('En Diagnóstico (actual)');
    expect(await screen.findByText('Ingresado → En Diagnóstico')).toBeInTheDocument();
    expect(screen.getByText('Inicio de revisión')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar orden' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Marcar presupuestado' })).not.toBeInTheDocument();
  });

  it('shows a cancelled order as interrupted and with no actions [004/RF-1.4]', async () => {
    mockOrder(workOrderFixture({ status: 'CANCELLED', allowedTransitions: [], hasUnlockCode: false, technician: null }));
    renderPage('ADMIN');
    expect(await screen.findByText('Orden cancelada')).toBeInTheDocument();
    expect(screen.getByText('Sin asignar')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Acciones de estado' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Asignación de técnico' })).not.toBeInTheDocument();
    expect(await screen.findByText('Sin cambios de estado todavía.')).toBeInTheDocument();
  });

  it('lets the assigned technician save the diagnosis [004/RF-7.1]', async () => {
    mockOrder(workOrderFixture({ status: 'IN_DIAGNOSIS', allowedTransitions: [] }));
    let body: Record<string, unknown> = {};
    server.use(
      http.patch(api(`/work-orders/${ID}/diagnosis`), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(workOrderFixture());
      }),
    );
    const user = userEvent.setup();
    renderPage('TECHNICIAN', 'tech-1');

    const field = await screen.findByLabelText('Diagnóstico preliminar');
    const save = screen.getByRole('button', { name: 'Guardar diagnóstico' });
    await user.type(field, 'Pan');
    expect(save).toBeDisabled();
    await user.type(field, 'talla con flex roto  ');
    await user.click(save);

    expect(await screen.findByText('Diagnóstico guardado')).toBeInTheDocument();
    expect(body).toEqual({ preliminaryDiagnosis: 'Pantalla con flex roto' });
    expect(screen.queryByRole('region', { name: 'Asignación de técnico' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Código de seguimiento' })).not.toBeInTheDocument();
  });

  it('shows diagnosis errors from the backend [004/RF-7.2]', async () => {
    mockOrder(workOrderFixture({ status: 'IN_DIAGNOSIS', allowedTransitions: [], preliminaryDiagnosis: 'Batería inflada' }));
    server.use(http.patch(api(`/work-orders/${ID}/diagnosis`), () => HttpResponse.json({ statusCode: 409, message: 'La orden ya no está en diagnóstico' }, { status: 409 })));
    const user = userEvent.setup();
    renderPage('ADMIN');

    await user.click(await screen.findByRole('button', { name: 'Guardar diagnóstico' }));
    expect(await screen.findByText('La orden ya no está en diagnóstico')).toBeInTheDocument();
  });

  it('reassigns the technician and reports failures (RN-06) [004/RF-6.1] [004/RF-6.2]', async () => {
    mockOrder(workOrderFixture({ status: 'BUDGETED', allowedTransitions: ['APPROVED', 'CANCELLED'] }));
    let calls = 0;
    let body: Record<string, unknown> = {};
    server.use(
      http.post(api(`/work-orders/${ID}/assign-technician`), async ({ request }) => {
        calls += 1;
        body = (await request.json()) as Record<string, unknown>;
        return calls === 1 ? HttpResponse.json({ statusCode: 422, message: 'Técnico inactivo' }, { status: 422 }) : HttpResponse.json(workOrderFixture());
      }),
    );
    const user = userEvent.setup();
    renderPage('RECEPTIONIST');

    expect(await screen.findByRole('link', { name: /Registrar respuesta del cliente/ })).toBeInTheDocument();
    // A budgeted order is cancelled by rejecting its budget (RN-05).
    expect(screen.queryByRole('region', { name: 'Acciones de estado' })).not.toBeInTheDocument();
    const select = screen.getByLabelText('Reasignar técnico');
    await screen.findByRole('option', { name: 'Técnico Dos' });
    const save = within(screen.getByRole('region', { name: 'Asignación de técnico' })).getByRole('button', { name: 'Guardar' });
    expect(save).toBeDisabled();
    await user.selectOptions(select, 'tech-2');
    await user.click(save);
    expect(await screen.findByText('Técnico inactivo')).toBeInTheDocument();

    await user.click(save);
    expect(await screen.findByText('Técnico asignado')).toBeInTheDocument();
    expect(body).toEqual({ technicianId: 'tech-2' });
  });

  it('regenerates the tracking code after confirming (SUP-05) [004/RF-9.1]', async () => {
    mockOrder(workOrderFixture({ status: 'IN_REPAIR', allowedTransitions: ['QUALITY_CONTROL'] }));
    server.use(http.post(api(`/work-orders/${ID}/tracking-code/regenerate`), () => HttpResponse.json({ trackingCode: 'Z9XW-4QPL' })));
    const user = userEvent.setup();
    renderPage('ADMIN');

    await user.click(await screen.findByRole('button', { name: 'Generar nuevo código' }));
    let dialog = await screen.findByRole('dialog', { name: 'Generar nuevo código' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Generar nuevo código' }));
    dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Generar' }));
    expect(await screen.findByText('Z9XW-4QPL')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('runs a transition and reports the new status [004/RF-2.5] [004/RF-2.4]', async () => {
    mockOrder(workOrderFixture({ status: 'QUALITY_CONTROL', allowedTransitions: ['READY_FOR_DELIVERY', 'IN_REPAIR'] }));
    let body: Record<string, unknown> = {};
    server.use(
      http.post(api(`/work-orders/${ID}/transitions`), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: ID, status: 'READY_FOR_DELIVERY' });
      }),
    );
    const user = userEvent.setup();
    renderPage('TECHNICIAN', 'tech-1');

    expect(await screen.findByRole('button', { name: 'Devolver a reparación (no pasó control)' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Marcar listo para entrega' }));
    expect(await screen.findByText('Orden en "Listo para Entrega"')).toBeInTheDocument();
    expect(body).toEqual({ to: 'READY_FOR_DELIVERY' });
  });

  it('warns about concurrent changes instead of showing a raw error (RN-04) [004/RF-4.1]', async () => {
    mockOrder(workOrderFixture({ status: 'IN_REPAIR', allowedTransitions: ['QUALITY_CONTROL'] }));
    server.use(http.post(api(`/work-orders/${ID}/transitions`), () => HttpResponse.json({ statusCode: 409, message: 'Conflict' }, { status: 409 })));
    const user = userEvent.setup();
    renderPage('ADMIN');

    await user.click(await screen.findByRole('button', { name: 'Enviar a control de calidad' }));
    expect(await screen.findByText('La orden cambió mientras tanto')).toBeInTheDocument();
    expect(screen.queryByText('Conflict')).not.toBeInTheDocument();
  });

  it('names the parts that block the repair (Stock Guard, RN-09) [004/RF-3.1]', async () => {
    mockOrder(workOrderFixture({ status: 'APPROVED', allowedTransitions: ['IN_REPAIR'] }));
    server.use(
      http.post(api(`/work-orders/${ID}/transitions`), () =>
        HttpResponse.json({ statusCode: 422, code: 'INSUFFICIENT_STOCK', message: 'Insufficient stock', sparePartIds: ['p1', 'p9'] }, { status: 422 }),
      ),
      http.get(api('/spare-parts/p1'), () =>
        HttpResponse.json({ id: 'p1', sku: 'OLED-IP13', name: 'Pantalla OLED iPhone 13', category: 'DISPLAY_OLED', physicalStock: 0, reservedStock: 0, availableStock: 0, minStock: 2, lowStock: true, compatibleDeviceModelIds: [] }),
      ),
      http.get(api('/spare-parts/p9'), () => HttpResponse.json({ statusCode: 404, message: 'Not found' }, { status: 404 })),
    );
    const user = userEvent.setup();
    renderPage('ADMIN');

    await user.click(await screen.findByRole('button', { name: 'Iniciar reparación' }));
    expect(await screen.findByText('No hay stock suficiente para iniciar la reparación')).toBeInTheDocument();
    expect(await screen.findByText('Pantalla OLED iPhone 13 (OLED-IP13) · disponible: 0')).toBeInTheDocument();
    expect(screen.getByText('Repuesto del presupuesto')).toBeInTheDocument();
  });

  it('cancels an order with a reason and shows other errors inline [004/RF-5.1]', async () => {
    mockOrder(workOrderFixture({ status: 'RECEIVED', allowedTransitions: ['IN_DIAGNOSIS', 'CANCELLED'] }));
    let calls = 0;
    let body: Record<string, unknown> = {};
    server.use(
      http.post(api(`/work-orders/${ID}/transitions`), async ({ request }) => {
        calls += 1;
        body = (await request.json()) as Record<string, unknown>;
        return calls === 1 ? HttpResponse.json({ statusCode: 403, message: 'No autorizado' }, { status: 403 }) : HttpResponse.json({ id: ID, status: 'CANCELLED' });
      }),
    );
    const user = userEvent.setup();
    renderPage('RECEPTIONIST');

    await user.click(await screen.findByRole('button', { name: 'Iniciar diagnóstico' }));
    expect(await screen.findByText('No autorizado')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar orden' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancelar orden' });
    const confirm = within(dialog).getByRole('button', { name: 'Confirmar cancelación' });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText('Motivo'), ' Cliente desistió ');
    await user.click(confirm);

    expect(await screen.findByText('Orden en "Cancelado"')).toBeInTheDocument();
    expect(body).toEqual({ to: 'CANCELLED', reason: 'Cliente desistió' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes the cancel dialog without changing the order [004/RF-5.2]', async () => {
    mockOrder(workOrderFixture({ status: 'RECEIVED', allowedTransitions: ['CANCELLED'] }));
    const user = userEvent.setup();
    renderPage('ADMIN');

    await user.click(await screen.findByRole('button', { name: 'Cancelar orden' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Volver' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('reports when the audit history cannot be loaded [004/RF-10.2]', async () => {
    server.use(
      http.get(api(`/work-orders/${ID}`), () => HttpResponse.json(workOrderFixture({ allowedTransitions: [] }))),
      http.get(api(`/work-orders/${ID}/audit`), () => HttpResponse.json({ statusCode: 500, message: 'boom' }, { status: 500 })),
    );
    renderPage('TECHNICIAN', 'tech-2');
    expect(await screen.findByText('No se pudo cargar el historial.')).toBeInTheDocument();
  });
});

describe('WorkOrderDetailPage details of the spec', () => {
  it('does not offer to cancel a budgeted order: it is cancelled by rejecting the budget [004/RF-2.3]', async () => {
    mockOrder(workOrderFixture({ status: 'BUDGETED', allowedTransitions: ['APPROVED', 'CANCELLED'] }));
    renderPage('RECEPTIONIST');

    expect(await screen.findByRole('link', { name: /Registrar respuesta del cliente/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar orden' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Marcar aprobado' })).not.toBeInTheDocument();
  });

  it('blocks the other buttons while a transition is running [004/RF-2.6]', async () => {
    mockOrder(workOrderFixture({ status: 'QUALITY_CONTROL', allowedTransitions: ['READY_FOR_DELIVERY', 'IN_REPAIR'] }));
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(api(`/work-orders/${ID}/transitions`), async () => {
        await gate;
        return HttpResponse.json({ id: ID, status: 'READY_FOR_DELIVERY' });
      }),
    );
    const user = userEvent.setup();
    renderPage('TECHNICIAN', 'tech-1');

    await user.click(await screen.findByRole('button', { name: 'Marcar listo para entrega' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Devolver a reparación (no pasó control)' })).toBeDisabled());
    release();
  });

  it('shows the reason when the server refuses an action for another cause [004/RF-3.2]', async () => {
    mockOrder(workOrderFixture({ status: 'APPROVED', allowedTransitions: ['IN_REPAIR'] }));
    server.use(
      http.post(api(`/work-orders/${ID}/transitions`), () =>
        HttpResponse.json({ statusCode: 403, message: 'RN-06: la orden no está asignada a este técnico' }, { status: 403 }),
      ),
    );
    const user = userEvent.setup();
    renderPage('TECHNICIAN', 'tech-1');

    await user.click(await screen.findByRole('button', { name: 'Iniciar reparación' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('la orden no está asignada a este técnico');
  });

  it('shows the saved diagnosis read-only to someone who cannot diagnose [004/RF-7.3]', async () => {
    mockOrder(workOrderFixture({ status: 'IN_DIAGNOSIS', preliminaryDiagnosis: 'Flex de carga oxidado', allowedTransitions: [] }));
    renderPage('RECEPTIONIST');

    expect(await screen.findByText('Flex de carga oxidado')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('offers the front desk the budget screen that fits the state, and the technician none [004/RF-11.1]', async () => {
    mockOrder(workOrderFixture({ status: 'IN_DIAGNOSIS', allowedTransitions: [] }));
    const first = renderPage('RECEPTIONIST');
    expect(await screen.findByRole('link', { name: /Armar presupuesto/ })).toHaveAttribute('href', `/presupuestos/${ID}`);
    first.unmount();

    mockOrder(workOrderFixture({ status: 'BUDGETED', allowedTransitions: [] }));
    const second = renderPage('ADMIN');
    expect(await screen.findByRole('link', { name: /Registrar respuesta del cliente/ })).toHaveAttribute('href', `/presupuestos/${ID}`);
    second.unmount();

    mockOrder(workOrderFixture({ status: 'IN_DIAGNOSIS', allowedTransitions: [] }));
    renderPage('TECHNICIAN', 'tech-1');
    await screen.findByRole('heading', { name: 'OT-000123' });
    expect(screen.queryByRole('link', { name: /presupuesto|respuesta del cliente/i })).not.toBeInTheDocument();
  });
});
