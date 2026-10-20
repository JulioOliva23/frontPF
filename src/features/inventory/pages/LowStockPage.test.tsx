import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../../test/msw-server';
import { api, renderWithProviders } from '../../../test/render';
import { sparePartFixture } from '../../../test/fixtures';
import { LowStockPage } from './LowStockPage';

describe('LowStockPage (US-F13 / RN-11)', () => {
  it('lists parts at or below their minimum', async () => {
    server.use(
      http.get(api('/spare-parts/alerts/low-stock'), () =>
        HttpResponse.json([sparePartFixture(), sparePartFixture({ id: 'p2', sku: 'BAT-S23', name: 'Batería Galaxy S23', category: 'BATTERY', availableStock: 1, reservedStock: 2 })]),
      ),
    );
    renderWithProviders(<LowStockPage />);

    expect(await screen.findByText('Batería Galaxy S23')).toBeInTheDocument();
    expect(screen.getByText('BAT-S23 · Batería')).toBeInTheDocument();
    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(screen.getByText('Stock bajo', { selector: 'span *, span' })).toBeInTheDocument();
  });

  it('says when everything is above the minimum', async () => {
    server.use(http.get(api('/spare-parts/alerts/low-stock'), () => HttpResponse.json([])));
    renderWithProviders(<LowStockPage />);
    expect(await screen.findByText('Todo en orden')).toBeInTheDocument();
  });

  it('shows an error state', async () => {
    server.use(http.get(api('/spare-parts/alerts/low-stock'), () => HttpResponse.json({ statusCode: 500, message: 'boom' }, { status: 500 })));
    renderWithProviders(<LowStockPage />);
    expect(await screen.findByText('No se pudieron cargar las alertas.')).toBeInTheDocument();
  });
});
