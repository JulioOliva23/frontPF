import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../../../test/msw-server';
import { api, renderWithProviders } from '../../../test/render';
import { TRACKING_MESSAGES } from '../lib/tracking-messages';
import { TrackingForm } from './TrackingForm';

async function submit(number: string, code: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Número de orden'), number);
  await user.type(screen.getByLabelText(/Código de seguimiento/), code);
  await user.click(screen.getByRole('button', { name: 'Consultar estado' }));
}

describe('TrackingForm (SUP-05 / FE-17)', () => {
  it('sends the normalized number and code and returns the status [007/RF-1.1] [007/RF-1.2]', async () => {
    let body: unknown;
    server.use(
      http.post(api('/public/tracking'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: 'wo', number: 123, status: 'IN_REPAIR', statusLabel: 'En Reparación', device: 'Apple iPhone 13', promisedAt: null, budgetTotal: '1130.00', updatedAt: '2026-10-19T12:00:00Z' });
      }),
    );
    const onFound = vi.fn();
    renderWithProviders(<TrackingForm onFound={onFound} />, { role: null });
    await submit('OT-000123', 'k7qm-3xpa');
    await vi.waitFor(() => expect(onFound).toHaveBeenCalled());
    expect(body).toEqual({ number: 123, trackingCode: 'K7QM3XPA' });
  });

  it('shows a single message for an unknown order or a wrong code (404) [007/RF-3.1]', async () => {
    server.use(http.post(api('/public/tracking'), () => HttpResponse.json({ statusCode: 404, message: 'Work order not found or tracking code is invalid' }, { status: 404 })));
    renderWithProviders(<TrackingForm onFound={vi.fn()} />, { role: null });
    await submit('123', 'ZZZZZZZZ');
    expect(await screen.findByRole('alert')).toHaveTextContent(TRACKING_MESSAGES.notFound);
  });

  it('explains the rate limit and disables the button (429) [007/RF-3.2]', async () => {
    server.use(http.post(api('/public/tracking'), () => HttpResponse.json({ statusCode: 429, message: 'Too Many Requests' }, { status: 429 })));
    renderWithProviders(<TrackingForm onFound={vi.fn()} />, { role: null });
    await submit('123', 'K7QM3XPA');
    expect(await screen.findByRole('alert')).toHaveTextContent(TRACKING_MESSAGES.rateLimited);
    expect(screen.getByRole('button', { name: /Espere \d+s/ })).toBeDisabled();
  });

  it('rejects a 4-digit PIN-like code before calling the API [007/RF-2.2]', async () => {
    renderWithProviders(<TrackingForm onFound={vi.fn()} />, { role: null });
    await submit('123', '4821');
    expect(await screen.findByText(/El código tiene 8 caracteres/)).toBeInTheDocument();
  });
});

describe('TrackingForm other cases of the spec', () => {
  it('asks for the order number without contacting the server [007/RF-2.1]', async () => {
    let called = false;
    server.use(
      http.post(api('/public/tracking'), () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    renderWithProviders(<TrackingForm onFound={vi.fn()} />, { role: null });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Código de seguimiento/), 'K7QM3XPA');
    await user.click(screen.getByRole('button', { name: 'Consultar estado' }));

    expect(await screen.findByText('Ingrese el número de orden')).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('asks to try again later when the server cannot be reached [007/RF-3.3]', async () => {
    server.use(http.post(api('/public/tracking'), () => HttpResponse.error()));
    renderWithProviders(<TrackingForm onFound={vi.fn()} />, { role: null });

    await submit('123', 'K7QM3XPA');

    expect(await screen.findByText(TRACKING_MESSAGES.network)).toBeInTheDocument();
  });
});
