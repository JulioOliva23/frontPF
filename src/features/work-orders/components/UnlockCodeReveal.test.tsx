import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../../test/msw-server';
import { api, renderWithProviders } from '../../../test/render';
import { REVEAL_DURATION_SECONDS, UnlockCodeReveal } from './UnlockCodeReveal';

afterEach(() => vi.useRealTimers());

describe('UnlockCodeReveal (FE-14 / RN-03)', () => {
  it('masks the code and reveals it only after confirming the audited call', async () => {
    let calls = 0;
    server.use(
      http.post(api('/work-orders/wo-1/unlock-code/reveal'), () => {
        calls += 1;
        return HttpResponse.json({ lockType: 'PIN', unlockCode: '4821' });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<UnlockCodeReveal workOrderId="wo-1" lockType="PIN" canReveal />);

    expect(screen.getByTestId('unlock-code-value')).toHaveTextContent('••••••');
    await user.click(screen.getByRole('button', { name: 'Revelar código' }));
    expect(screen.getByText(/quedará registrado/)).toBeInTheDocument();
    expect(calls).toBe(0);

    await user.click(screen.getByRole('button', { name: 'Revelar y registrar acceso' }));
    expect(await screen.findByText('4821')).toBeInTheDocument();
    expect(calls).toBe(1);
  });

  it(`hides the code again after ${REVEAL_DURATION_SECONDS} seconds`, async () => {
    // Fake timers from the start so the component's interval is controllable.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    server.use(http.post(api('/work-orders/wo-1/unlock-code/reveal'), () => HttpResponse.json({ lockType: 'PIN', unlockCode: '4821' })));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<UnlockCodeReveal workOrderId="wo-1" lockType="PIN" canReveal />);
    await user.click(screen.getByRole('button', { name: 'Revelar código' }));
    await user.click(screen.getByRole('button', { name: 'Revelar y registrar acceso' }));
    await screen.findByText('4821');

    act(() => vi.advanceTimersByTime(REVEAL_DURATION_SECONDS * 1000));
    expect(screen.getByTestId('unlock-code-value')).toHaveTextContent('••••••');
  });

  it('offers no reveal button to users who may not see the code', () => {
    renderWithProviders(<UnlockCodeReveal workOrderId="wo-1" lockType="PATTERN" canReveal={false} />);
    expect(screen.queryByRole('button', { name: 'Revelar código' })).not.toBeInTheDocument();
    expect(screen.getByText(/Solo el técnico asignado/)).toBeInTheDocument();
  });
});
