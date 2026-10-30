import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { Budget, WorkOrder } from '../../../shared/api/types';
import { server } from '../../../test/msw-server';
import { api, renderWithProviders } from '../../../test/render';
import { budgetFixture, pageOf, sparePartFixture, workOrderFixture } from '../../../test/fixtures';
import { BudgetEditorPage } from './BudgetEditorPage';

const ORDER_ID = '11111111-1111-4111-8111-111111111111';

function mockOrder(order: WorkOrder, budgets: Budget[]) {
  server.use(
    http.get(api(`/work-orders/${ORDER_ID}`), () => HttpResponse.json(order)),
    http.get(api(`/work-orders/${ORDER_ID}/budgets`), () => HttpResponse.json(budgets)),
  );
}

function renderPage() {
  return renderWithProviders(<BudgetEditorPage />, { route: `/presupuestos/${ORDER_ID}`, path: '/presupuestos/:workOrderId' });
}

describe('BudgetEditorPage (US-F05 / US-F06)', () => {
  it('shows an error state when the order cannot be loaded [005/RF-6.2]', async () => {
    server.use(
      http.get(api(`/work-orders/${ORDER_ID}`), () => HttpResponse.json({ statusCode: 500, message: 'boom' }, { status: 500 })),
      http.get(api(`/work-orders/${ORDER_ID}/budgets`), () => HttpResponse.json([])),
    );
    renderPage();
    expect(await screen.findByText('No se pudo cargar la orden.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('tells the user when the order no longer accepts budgets and has none [005/RF-2.1]', async () => {
    mockOrder(workOrderFixture({ status: 'IN_REPAIR' }), []);
    renderPage();
    expect(await screen.findByText('La orden ya no admite nuevos presupuestos.')).toBeInTheDocument();
    expect(screen.getByText('Todavía no hay presupuestos para esta orden.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Nueva versión de presupuesto' })).not.toBeInTheDocument();
  });

  it('builds a draft with labor and a compatible part, and posts it without part prices (RN-10) [005/RF-2.2] [005/RF-2.3] [005/RF-2.4]', async () => {
    mockOrder(workOrderFixture({ status: 'IN_DIAGNOSIS', preliminaryDiagnosis: 'Módulo de pantalla dañado' }), []);
    let body: { items?: Array<Record<string, unknown>> } = {};
    server.use(
      http.get(api('/spare-parts'), () => HttpResponse.json(pageOf([sparePartFixture({ availableStock: 3 })], 1, 100))),
      http.post(api(`/work-orders/${ORDER_ID}/budgets`), async ({ request }) => {
        body = (await request.json()) as typeof body;
        return HttpResponse.json(budgetFixture(), { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Módulo de pantalla dañado')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '+ Nueva versión de presupuesto' }));

    const partSelect = await screen.findByLabelText('Repuestos compatibles con Apple iPhone 13');
    await screen.findByRole('option', { name: /Pantalla OLED iPhone 13/ });
    await user.selectOptions(partSelect, 'p1');
    await user.click(screen.getByRole('button', { name: 'Agregar repuesto' }));
    await user.click(screen.getByRole('button', { name: '+ Cambio de batería' }));
    await user.type(screen.getByLabelText('Precio del ítem 2'), '150.50');

    expect(screen.getByTestId('budget-preview-total')).toHaveTextContent('1.130,50 BOB');

    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));

    expect(await screen.findByText('Borrador guardado')).toBeInTheDocument();
    expect(body.items).toEqual([
      { itemType: 'PART', description: 'Pantalla OLED iPhone 13', quantity: 1, sparePartId: 'p1' },
      { itemType: 'LABOR', description: 'Cambio de batería', quantity: 1, unitPrice: '150.50' },
    ]);
  });

  it('flags invalid labor lines, lets the user remove them and shows backend errors [005/RF-2.5] [005/RF-2.7]', async () => {
    mockOrder(workOrderFixture({ status: 'IN_DIAGNOSIS' }), []);
    server.use(
      http.get(api('/spare-parts'), () => HttpResponse.json(pageOf([], 1, 100))),
      http.post(api(`/work-orders/${ORDER_ID}/budgets`), () => HttpResponse.json({ statusCode: 422, message: 'La orden cambió de estado' }, { status: 422 })),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: '+ Nueva versión de presupuesto' }));
    expect(await screen.findByRole('option', { name: 'No hay repuestos compatibles' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '+ Micro-soldadura' }));
    await user.click(screen.getByRole('button', { name: '+ Diagnóstico de placa' }));
    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    expect(await screen.findByText('Revise los campos marcados en rojo.')).toBeInTheDocument();
    expect(screen.getByLabelText('Precio del ítem 1')).toHaveAttribute('aria-invalid', 'true');

    await user.click(screen.getByRole('button', { name: 'Quitar ítem 2' }));
    expect(screen.queryByLabelText('Precio del ítem 2')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Precio del ítem 1'), '200');
    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));

    expect(await screen.findByText('La orden cambió de estado')).toBeInTheDocument();
  });

  it('sends a draft to the customer [005/RF-3.1]', async () => {
    mockOrder(workOrderFixture({ status: 'IN_DIAGNOSIS' }), [budgetFixture()]);
    let sent = false;
    server.use(http.post(api('/budgets/b1/send'), () => ((sent = true), HttpResponse.json(budgetFixture({ status: 'SENT' })))));
    const user = userEvent.setup();
    renderPage();

    const card = await screen.findByRole('article', { name: 'Presupuesto versión 1' });
    expect(within(card).getByText('Aún no enviado al cliente')).toBeInTheDocument();
    expect(within(card).getByText('Borrador')).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: 'Enviar al cliente' }));

    expect(await screen.findByText('Presupuesto enviado')).toBeInTheDocument();
    expect(sent).toBe(true);
  });

  it('shows why sending failed [005/RF-3.2]', async () => {
    mockOrder(workOrderFixture({ status: 'IN_DIAGNOSIS' }), [budgetFixture()]);
    server.use(http.post(api('/budgets/b1/send'), () => HttpResponse.json({ statusCode: 409, message: 'El presupuesto ya fue enviado' }, { status: 409 })));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Enviar al cliente' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El presupuesto ya fue enviado');
  });

  it('records the customer approval with the channel used (RN-05) [005/RF-4.1] [005/RF-4.2]', async () => {
    const sent = budgetFixture({ status: 'SENT', sentAt: '2026-10-19T12:00:00.000Z' });
    mockOrder(workOrderFixture({ status: 'BUDGETED' }), [sent, budgetFixture({ id: 'b0', version: 0, status: 'SUPERSEDED' })]);
    let body: Record<string, unknown> = {};
    server.use(
      http.post(api('/budgets/b1/approve'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...sent, status: 'APPROVED' });
      }),
    );
    const user = userEvent.setup();
    renderPage();

    const card = await screen.findByRole('article', { name: 'Presupuesto versión 1' });
    expect(within(card).getByText(/^Enviado .* · vence /)).toBeInTheDocument();
    expect(screen.getByText('Reemplazado')).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: 'Cliente aprobó' }));

    const dialog = await screen.findByRole('dialog', { name: 'Registrar aprobación del cliente' });
    const confirm = within(dialog).getByRole('button', { name: 'Confirmar' });
    expect(confirm).toBeDisabled();
    await user.selectOptions(within(dialog).getByLabelText('¿Por qué medio respondió el cliente?'), 'WHATSAPP');
    await user.click(confirm);

    expect(await screen.findByText('Aprobación registrada')).toBeInTheDocument();
    expect(body).toEqual({ channel: 'WHATSAPP' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('records a rejection with its reason and shows backend errors in the modal [005/RF-4.4]', async () => {
    mockOrder(workOrderFixture({ status: 'BUDGETED' }), [budgetFixture({ status: 'SENT', sentAt: '2026-10-19T12:00:00.000Z' })]);
    let attempts = 0;
    let body: Record<string, unknown> = {};
    server.use(
      http.post(api('/budgets/b1/reject'), async ({ request }) => {
        attempts += 1;
        body = (await request.json()) as Record<string, unknown>;
        return attempts === 1
          ? HttpResponse.json({ statusCode: 422, message: 'El presupuesto expiró' }, { status: 422 })
          : HttpResponse.json(budgetFixture({ status: 'REJECTED' }));
      }),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Cliente rechazó' }));
    const dialog = await screen.findByRole('dialog', { name: 'Registrar rechazo del cliente' });
    await user.selectOptions(within(dialog).getByLabelText('¿Por qué medio respondió el cliente?'), 'PHONE');
    await user.type(within(dialog).getByLabelText('Motivo del rechazo'), '  Muy caro  ');
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('El presupuesto expiró');

    await user.click(within(dialog).getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByText('Rechazo registrado')).toBeInTheDocument();
    expect(body).toEqual({ channel: 'PHONE', reason: 'Muy caro' });
  });

  it('closes the decision modal without calling the API [005/RF-4.5]', async () => {
    mockOrder(workOrderFixture({ status: 'BUDGETED' }), [budgetFixture({ status: 'SENT', sentAt: '2026-10-19T12:00:00.000Z' })]);
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Cliente aprobó' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Volver' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('marks expired and rejected versions (SUP-04) [005/RF-5.1] [005/RF-5.4]', async () => {
    mockOrder(workOrderFixture({ status: 'BUDGETED' }), [
      budgetFixture({ id: 'b2', version: 2, status: 'SENT', sentAt: '2026-01-01T00:00:00.000Z', expiresAt: '2026-01-08T00:00:00.000Z' }),
      budgetFixture({ id: 'b1', version: 1, status: 'REJECTED', sentAt: '2025-12-01T00:00:00.000Z', decidedAt: '2025-12-02T00:00:00.000Z', rejectionReason: 'Muy caro' }),
    ]);
    renderPage();

    expect(await screen.findByRole('note')).toHaveTextContent('Presupuesto vencido');
    expect(screen.getByText('Motivo: Muy caro')).toBeInTheDocument();
    expect(screen.getByText(/decidido/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cliente aprobó' })).not.toBeInTheDocument();
  });
});

describe('BudgetEditorPage details of the spec', () => {
  it('asks for a reason of at least three characters before a rejection can be confirmed [005/RF-4.3]', async () => {
    mockOrder(workOrderFixture({ status: 'BUDGETED' }), [budgetFixture({ status: 'SENT', sentAt: '2026-10-19T12:00:00.000Z' })]);
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Cliente rechazó' }));
    const dialog = await screen.findByRole('dialog', { name: 'Registrar rechazo del cliente' });
    await user.selectOptions(within(dialog).getByLabelText('¿Por qué medio respondió el cliente?'), 'PHONE');
    await user.type(within(dialog).getByLabelText('Motivo del rechazo'), 'ab');
    expect(within(dialog).getByRole('button', { name: 'Confirmar' })).toBeDisabled();

    await user.type(within(dialog).getByLabelText('Motivo del rechazo'), 'c');
    expect(within(dialog).getByRole('button', { name: 'Confirmar' })).toBeEnabled();
  });

  it('tells how many days a sent budget has left before it expires [005/RF-5.3]', async () => {
    const inThreeDays = new Date(Date.now() + 2.5 * 86_400_000).toISOString();
    mockOrder(workOrderFixture({ status: 'BUDGETED' }), [budgetFixture({ status: 'SENT', sentAt: '2026-10-19T12:00:00.000Z', expiresAt: inThreeDays })]);
    renderPage();

    expect(await screen.findByText(/Vence en 3 día\(s\)/)).toBeInTheDocument();
  });

  it('shows the technician diagnosis and a way back to the order [005/RF-6.1]', async () => {
    mockOrder(workOrderFixture({ status: 'IN_DIAGNOSIS', preliminaryDiagnosis: 'Flex de carga oxidado' }), []);
    renderPage();

    expect(await screen.findByText('Flex de carga oxidado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver orden' })).toHaveAttribute('href', `/ordenes/${ORDER_ID}`);
  });
});
