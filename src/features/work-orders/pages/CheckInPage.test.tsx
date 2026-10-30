import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../../../test/msw-server';
import { api, renderWithProviders } from '../../../test/render';
import { workOrderFixture } from '../../../test/fixtures';
import { CheckInPage } from './CheckInPage';

function mockCatalog() {
  server.use(
    http.get(api('/device-models'), () => HttpResponse.json([{ id: 'm1', brand: 'Apple', model: 'iPhone 13' }])),
    http.get(api('/devices/by-imei/:imei'), () => HttpResponse.json({ statusCode: 404, message: 'Device not registered' }, { status: 404 })),
  );
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>, imei: string) {
  await user.type(screen.getByLabelText('Documento de identidad'), '8456123 LP');
  await user.type(screen.getByLabelText('Nombre completo'), 'María Quispe');
  await user.selectOptions(screen.getByLabelText('Marca'), 'Apple');
  await user.selectOptions(screen.getByLabelText('Modelo'), 'm1');
  await user.type(screen.getByLabelText('IMEI'), imei);
  await user.type(screen.getByLabelText('Problema reportado por el cliente'), 'Pantalla rota tras caída');
}

describe('CheckInPage (US-F03)', () => {
  it('flags an invalid IMEI in real time and never calls the API (RN-02) [002/RF-1.1] [002/RF-1.2]', async () => {
    mockCatalog();
    let posted = false;
    server.use(http.post(api('/work-orders'), () => ((posted = true), HttpResponse.json({}))));
    const user = userEvent.setup();
    renderWithProviders(<CheckInPage />);
    await screen.findByRole('option', { name: 'Apple' });

    await fillRequired(user, '352099001761482');
    expect(screen.getByText('Dígito verificador incorrecto')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Registrar orden' }));

    expect(await screen.findByText(/el dígito verificador no coincide/)).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it('formats the IMEI while typing [002/RF-1.1]', async () => {
    mockCatalog();
    const user = userEvent.setup();
    renderWithProviders(<CheckInPage />);
    await user.type(screen.getByLabelText('IMEI'), '352099001761481');
    expect(screen.getByLabelText('IMEI')).toHaveValue('35 209900 176148 1');
    expect(screen.getByText('IMEI válido')).toBeInTheDocument();
  });

  it('masks the PIN by default and shows the ticket with the tracking code after creating the order (SUP-05) [002/RF-4.1] [002/RF-5.1]', async () => {
    mockCatalog();
    let body: Record<string, unknown> = {};
    server.use(
      http.post(api('/work-orders'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...workOrderFixture({ status: 'RECEIVED' }), trackingCode: 'K7QM-3XPA' }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<CheckInPage />);
    await screen.findByRole('option', { name: 'Apple' });

    await fillRequired(user, '352099001761481');
    await user.selectOptions(screen.getByLabelText('Tipo de bloqueo'), 'PIN');
    const pin = screen.getByLabelText('PIN de desbloqueo');
    expect(pin).toHaveAttribute('type', 'password');
    await user.type(pin, '4821');
    await user.click(screen.getByRole('button', { name: 'Ver' }));
    expect(pin).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Registrar orden' }));

    expect(await screen.findByTestId('tracking-code')).toHaveTextContent('K7QM-3XPA');
    expect(screen.getByRole('heading', { name: 'OT-000123' })).toBeInTheDocument();
    await waitFor(() => expect(body).toMatchObject({ lockType: 'PIN', unlockCode: '4821', device: { imei: '352099001761481', deviceModelId: 'm1' } }));
  });
});

describe('CheckInPage intake details', () => {
  it('shows the earlier repairs of a known IMEI [002/RF-2.1]', async () => {
    server.use(
      http.get(api('/device-models'), () => HttpResponse.json([{ id: 'm1', brand: 'Apple', model: 'iPhone 13' }])),
      http.get(api('/devices/by-imei/:imei'), () =>
        HttpResponse.json({
          id: 'd1',
          imei: '352099001761481',
          color: null,
          deviceModel: { id: 'm1', brand: 'Apple', model: 'iPhone 13' },
          customerName: 'María Quispe',
          repairs: [
            { workOrderId: 'wo-9', number: 9, status: 'DELIVERED', reportedProblem: 'Batería hinchada', preliminaryDiagnosis: null, technicianName: null, createdAt: '2026-09-01T10:00:00.000Z', deliveredAt: null },
          ],
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<CheckInPage />);
    await user.type(screen.getByLabelText('IMEI'), '352099001761481');

    const history = await screen.findByRole('region', { name: 'Historial del equipo' });
    expect(history).toHaveTextContent('1 reparación(es) previa(s)');
    expect(history).toHaveTextContent('Batería hinchada');
  });

  it('treats an unregistered IMEI as a new device, not as an error [002/RF-2.2]', async () => {
    mockCatalog();
    const user = userEvent.setup();
    renderWithProviders(<CheckInPage />);
    await user.type(screen.getByLabelText('IMEI'), '352099001761481');

    expect(await screen.findByText('Este IMEI no registra reparaciones previas.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('asks for the customer, the model, the problem, the five zones and the lock type [002/RF-3.1]', async () => {
    mockCatalog();
    renderWithProviders(<CheckInPage />);
    await screen.findByRole('option', { name: 'Apple' });

    for (const label of ['Documento de identidad', 'Nombre completo', 'Marca', 'Modelo', 'IMEI', 'Problema reportado por el cliente', 'Tipo de bloqueo']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    for (const zone of ['Pantalla', 'Tapa trasera', 'Marco / bordes', 'Lente de cámara', 'Botones']) {
      expect(screen.getAllByText(zone).length).toBeGreaterThan(0);
    }
  });

  it('does not keep the unlock code in the browser nor print it to the console [002/RF-4.4]', async () => {
    mockCatalog();
    server.use(http.post(api('/work-orders'), () => HttpResponse.json({ ...workOrderFixture({ status: 'RECEIVED' }), trackingCode: 'K7QM-3XPA' }, { status: 201 })));
    const consoleSpies = (['log', 'info', 'debug', 'warn', 'error'] as const).map((method) => vi.spyOn(console, method).mockImplementation(() => undefined));
    const user = userEvent.setup();
    renderWithProviders(<CheckInPage />);
    await screen.findByRole('option', { name: 'Apple' });
    await fillRequired(user, '352099001761481');
    await user.selectOptions(screen.getByLabelText('Tipo de bloqueo'), 'PIN');
    await user.type(screen.getByLabelText('PIN de desbloqueo'), '4821');
    await user.click(screen.getByRole('button', { name: 'Registrar orden' }));
    await screen.findByTestId('tracking-code');

    expect(JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } })).not.toContain('4821');
    expect(JSON.stringify(consoleSpies.flatMap((spy) => spy.mock.calls))).not.toContain('4821');
    consoleSpies.forEach((spy) => spy.mockRestore());
  });

  it('cannot show the tracking code again once the ticket is closed [002/RF-5.2]', async () => {
    mockCatalog();
    server.use(http.post(api('/work-orders'), () => HttpResponse.json({ ...workOrderFixture({ status: 'RECEIVED' }), trackingCode: 'K7QM-3XPA' }, { status: 201 })));
    const user = userEvent.setup();
    renderWithProviders(<CheckInPage />);
    await screen.findByRole('option', { name: 'Apple' });
    await fillRequired(user, '352099001761481');
    await user.click(screen.getByRole('button', { name: 'Registrar orden' }));
    expect(await screen.findByTestId('tracking-code')).toHaveTextContent('K7QM-3XPA');

    await user.click(screen.getByRole('button', { name: 'Nuevo ingreso' }));

    expect(screen.queryByTestId('tracking-code')).not.toBeInTheDocument();
    expect(screen.queryByText('K7QM-3XPA')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar orden' })).toBeInTheDocument();
  });

  it('shows the reason and keeps what was typed when the server rejects the intake [002/RF-6.1]', async () => {
    mockCatalog();
    server.use(
      http.post(api('/work-orders'), () =>
        HttpResponse.json({ statusCode: 409, message: 'RN-02: este IMEI ya está registrado con otro modelo de equipo' }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<CheckInPage />);
    await screen.findByRole('option', { name: 'Apple' });
    await fillRequired(user, '352099001761481');
    await user.click(screen.getByRole('button', { name: 'Registrar orden' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('este IMEI ya está registrado con otro modelo de equipo');
    expect(screen.getByLabelText('IMEI')).toHaveValue('35 209900 176148 1');
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('María Quispe');
    expect(screen.getByLabelText('Problema reportado por el cliente')).toHaveValue('Pantalla rota tras caída');
  });

  it('sends a single request while the first one is still in flight [002/RF-6.2]', async () => {
    mockCatalog();
    let posts = 0;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(api('/work-orders'), async () => {
        posts += 1;
        await gate;
        return HttpResponse.json({ ...workOrderFixture({ status: 'RECEIVED' }), trackingCode: 'K7QM-3XPA' }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<CheckInPage />);
    await screen.findByRole('option', { name: 'Apple' });
    await fillRequired(user, '352099001761481');
    await user.click(screen.getByRole('button', { name: 'Registrar orden' }));

    const busy = await screen.findByRole('button', { name: /Cargando/ });
    expect(busy).toBeDisabled();
    await user.click(busy);
    release();
    await screen.findByTestId('tracking-code');
    expect(posts).toBe(1);
  });
});
