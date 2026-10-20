import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../../test/msw-server';
import { api, renderWithProviders } from '../../../test/render';
import { pageOf, workOrderFixture } from '../../../test/fixtures';
import { BudgetsPage } from './BudgetsPage';

describe('BudgetsPage', () => {
  it('splits orders into "to budget" and "waiting for the customer" queues', async () => {
    server.use(
      http.get(api('/work-orders'), ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get('status') === 'IN_DIAGNOSIS'
            ? pageOf([workOrderFixture({ id: 'o1', number: 7, status: 'IN_DIAGNOSIS' })])
            : pageOf([]),
        ),
      ),
    );
    renderWithProviders(<BudgetsPage />);

    const toBudget = screen.getByRole('region', { name: /Por presupuestar/ });
    expect(await within(toBudget).findByRole('link', { name: /OT-000007/ })).toHaveAttribute('href', '/presupuestos/o1');
    expect(within(toBudget).getByText('Apple iPhone 13 · María Quispe')).toBeInTheDocument();
    expect(await within(screen.getByRole('region', { name: /Esperando respuesta del cliente/ })).findByText('Nada pendiente')).toBeInTheDocument();
  });
});
