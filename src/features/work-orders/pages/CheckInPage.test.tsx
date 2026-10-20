import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

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
  it('flags an invalid IMEI in real time and never calls the API (RN-02)', async () => {
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

  it('formats the IMEI while typing', async () => {
    mockCatalog();
    const user = userEvent.setup();
    renderWithProviders(<CheckInPage />);
    await user.type(screen.getByLabelText('IMEI'), '352099001761481');
    expect(screen.getByLabelText('IMEI')).toHaveValue('35 209900 176148 1');
    expect(screen.getByText('IMEI válido')).toBeInTheDocument();
  });

  it('masks the PIN by default and shows the ticket with the tracking code after creating the order (SUP-05)', async () => {
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
