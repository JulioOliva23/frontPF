import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { SparePart } from '../../../shared/api/types';
import { server } from '../../../test/msw-server';
import { api, renderWithProviders } from '../../../test/render';
import { pageOf, sparePartFixture } from '../../../test/fixtures';
import { InventoryPage } from './InventoryPage';

const MODELS = [
  { id: 'm1', brand: 'Apple', model: 'iPhone 13' },
  { id: 'm2', brand: 'Apple', model: 'iPhone 14' },
  { id: 'm3', brand: 'Samsung', model: 'Galaxy S23' },
];

const OLED = sparePartFixture({ unitCost: '650.00', physicalStock: 5, availableStock: 4, reservedStock: 1, lowStock: false });
const BATTERY = sparePartFixture({ id: 'p2', sku: 'BAT-S23', name: 'Batería Galaxy S23', category: 'BATTERY', unitCost: '120.00', workshopPrice: '250.00', compatibleDeviceModelIds: ['m3'] });

function mockCatalog(parts: SparePart[] = [OLED, BATTERY], onList?: (url: URL) => void) {
  server.use(
    http.get(api('/device-models'), () => HttpResponse.json(MODELS)),
    http.get(api('/spare-parts'), ({ request }) => {
      const url = new URL(request.url);
      onList?.(url);
      return HttpResponse.json(pageOf(parts, Number(url.searchParams.get('page') ?? 1), 20, parts.length));
    }),
  );
}

describe('InventoryPage (US-F11 / US-F12)', () => {
  it('lists the catalog for reception without costs nor admin actions (RN-07) [006/RF-2.1]', async () => {
    mockCatalog();
    renderWithProviders(<InventoryPage />, { role: 'RECEPTIONIST' });

    const row = (await screen.findByText('Pantalla OLED iPhone 13')).closest('tr')!;
    expect(within(row).getByText('980,00 BOB')).toBeInTheDocument();
    expect(within(row).getByText('4 / 1 / 2')).toBeInTheDocument();
    expect(within(row).getByText('Disponible')).toBeInTheDocument();
    expect(within(screen.getByText('Batería Galaxy S23').closest('tr')!).getByText('Agotado')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Costo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nuevo repuesto' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ajuste' })).not.toBeInTheDocument();
  });

  it('sends search, category and model filters to the API [006/RF-1.2]', async () => {
    const seen: URL[] = [];
    mockCatalog([OLED], (url) => seen.push(url));
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />, { role: 'ADMIN' });
    await screen.findByText('Pantalla OLED iPhone 13');
    await screen.findByRole('option', { name: 'Samsung Galaxy S23' });

    await user.type(screen.getByLabelText('Buscar'), 'oled');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'DISPLAY_OLED');
    await user.selectOptions(screen.getByLabelText('Compatible con'), 'm1');

    await waitFor(() => {
      const last = seen.at(-1)!.searchParams;
      expect(last.get('search')).toBe('oled');
      expect(last.get('category')).toBe('DISPLAY_OLED');
      expect(last.get('deviceModelId')).toBe('m1');
      expect(last.get('page')).toBe('1');
    });
  });

  it('shows the empty and error states [006/RF-1.3]', async () => {
    mockCatalog([]);
    const { unmount } = renderWithProviders(<InventoryPage />);
    expect(await screen.findByText('Sin repuestos')).toBeInTheDocument();
    unmount();

    server.use(http.get(api('/spare-parts'), () => HttpResponse.json({ statusCode: 500, message: 'boom' }, { status: 500 })));
    renderWithProviders(<InventoryPage />);
    expect(await screen.findByText('No se pudo cargar el inventario.')).toBeInTheDocument();
  });

  it('creates a part as admin, normalizing the SKU (FE-11) [006/RF-3.1] [006/RF-2.2]', async () => {
    mockCatalog([OLED]);
    let body: Record<string, unknown> = {};
    server.use(
      http.post(api('/spare-parts'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(BATTERY, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />, { role: 'ADMIN' });
    expect(await screen.findByRole('columnheader', { name: 'Costo' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Nuevo repuesto' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo repuesto' });
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    expect(await within(dialog).findByText('SKU: 3 a 50 letras, números o guiones')).toBeInTheDocument();
    expect(within(dialog).getByText('Mínimo 3 caracteres')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('SKU'), 'bat-s23');
    await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'BATTERY');
    await user.type(within(dialog).getByLabelText('Nombre'), 'Batería Galaxy S23');
    await user.type(within(dialog).getByLabelText('Costo unitario (BOB)'), '120.00');
    await user.type(within(dialog).getByLabelText('Precio al cliente (BOB)'), '250.00');
    await user.clear(within(dialog).getByLabelText('Stock mínimo'));
    await user.type(within(dialog).getByLabelText('Stock mínimo'), '3');
    await user.click(await within(dialog).findByLabelText('Galaxy S23'));
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(body).toEqual({
      sku: 'BAT-S23',
      name: 'Batería Galaxy S23',
      category: 'BATTERY',
      unitCost: '120.00',
      workshopPrice: '250.00',
      minStock: 3,
      compatibleDeviceModelIds: ['m3'],
    });
  });

  it('explains a duplicated SKU [006/RF-3.2]', async () => {
    mockCatalog([OLED]);
    server.use(http.post(api('/spare-parts'), () => HttpResponse.json({ statusCode: 409, message: 'Conflict' }, { status: 409 })));
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />, { role: 'ADMIN' });

    await user.click(await screen.findByRole('button', { name: 'Nuevo repuesto' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('SKU'), 'OLED-IP13');
    await user.type(within(dialog).getByLabelText('Nombre'), 'Otra pantalla');
    await user.type(within(dialog).getByLabelText('Costo unitario (BOB)'), '1');
    await user.type(within(dialog).getByLabelText('Precio al cliente (BOB)'), '2');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Ya existe un repuesto con ese SKU.');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('edits a part without sending the SKU [006/RF-3.3]', async () => {
    mockCatalog([OLED]);
    let body: Record<string, unknown> = {};
    server.use(
      http.patch(api('/spare-parts/p1'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(OLED);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />, { role: 'ADMIN' });

    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Editar repuesto' });
    expect(within(dialog).getByLabelText('SKU')).toBeDisabled();
    await user.clear(within(dialog).getByLabelText('Nombre'));
    await user.type(within(dialog).getByLabelText('Nombre'), 'Pantalla OLED iPhone 13 Pro');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(body.name).toBe('Pantalla OLED iPhone 13 Pro'));
    expect(body).not.toHaveProperty('sku');
  });

  it('edits compatibility as admin and shows it read-only to reception (RN-10) [006/RF-3.4]', async () => {
    mockCatalog([OLED]);
    let body: Record<string, unknown> = {};
    server.use(
      http.patch(api('/spare-parts/p1'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(OLED);
      }),
    );
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<InventoryPage />, { role: 'ADMIN' });

    await user.click(await screen.findByRole('button', { name: 'Modelos (1)' }));
    let dialog = await screen.findByRole('dialog', { name: 'Compatibilidad por modelo' });
    expect(await within(dialog).findByLabelText('iPhone 13')).toBeChecked();
    await user.click(within(dialog).getByLabelText('iPhone 13'));
    await user.click(within(dialog).getByLabelText('iPhone 14'));
    await user.click(within(dialog).getByRole('button', { name: 'Guardar compatibilidad' }));
    await waitFor(() => expect(body).toEqual({ compatibleDeviceModelIds: ['m2'] }));
    unmount();

    renderWithProviders(<InventoryPage />, { role: 'RECEPTIONIST' });
    await user.click(await screen.findByRole('button', { name: 'Modelos (1)' }));
    dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByLabelText('iPhone 13')).toBeDisabled();
    expect(within(dialog).queryByRole('button', { name: 'Guardar compatibilidad' })).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar' }));
  });

  it('registers a stock entry and shows backend errors [006/RF-4.1]', async () => {
    mockCatalog([OLED]);
    let calls = 0;
    let body: Record<string, unknown> = {};
    server.use(
      http.post(api('/spare-parts/p1/stock-entries'), async ({ request }) => {
        calls += 1;
        body = (await request.json()) as Record<string, unknown>;
        return calls === 1 ? HttpResponse.json({ statusCode: 400, message: ['quantity must not be greater than 10000'] }, { status: 400 }) : HttpResponse.json(OLED);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />, { role: 'RECEPTIONIST' });

    await user.click(await screen.findByRole('button', { name: 'Entrada' }));
    const dialog = await screen.findByRole('dialog', { name: 'Entrada de stock' });
    expect(within(dialog).getByText('Pantalla OLED iPhone 13 · disponible 4')).toBeInTheDocument();
    await user.clear(within(dialog).getByLabelText('Unidades recibidas'));
    await user.type(within(dialog).getByLabelText('Unidades recibidas'), '10');
    await user.click(within(dialog).getByRole('button', { name: 'Registrar entrada' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('quantity must not be greater than 10000');
    expect(body).toEqual({ quantity: 10 });

    await user.type(within(dialog).getByLabelText('Referencia (factura / proveedor)'), 'Factura 991');
    await user.click(within(dialog).getByRole('button', { name: 'Registrar entrada' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(body).toEqual({ quantity: 10, reason: 'Factura 991' });
  });

  it('registers a negative adjustment and explains reserved units (RN-09) [006/RF-4.2]', async () => {
    mockCatalog([OLED]);
    let calls = 0;
    let body: Record<string, unknown> = {};
    server.use(
      http.post(api('/spare-parts/p1/adjustments'), async ({ request }) => {
        calls += 1;
        body = (await request.json()) as Record<string, unknown>;
        return calls === 1 ? HttpResponse.json({ statusCode: 422, message: 'Insufficient stock' }, { status: 422 }) : HttpResponse.json(OLED);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />, { role: 'ADMIN' });

    await user.click(await screen.findByRole('button', { name: 'Ajuste' }));
    const dialog = await screen.findByRole('dialog', { name: 'Ajuste de stock' });
    await user.click(within(dialog).getByRole('button', { name: 'Registrar ajuste' }));
    expect(await within(dialog).findByText('Explique el motivo (mínimo 5 caracteres)')).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText('Unidades'));
    await user.type(within(dialog).getByLabelText('Unidades'), '9');
    await user.type(within(dialog).getByLabelText('Motivo'), 'Pantallas rotas en bodega');
    await user.click(within(dialog).getByRole('button', { name: 'Registrar ajuste' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Solo hay 4 unidad(es) disponibles sin reservar.');
    expect(body).toEqual({ delta: -9, reason: 'Pantallas rotas en bodega' });

    await user.click(within(dialog).getByLabelText('Corrección positiva'));
    await user.click(within(dialog).getByRole('button', { name: 'Registrar ajuste' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(body).toEqual({ delta: 9, reason: 'Pantallas rotas en bodega' });
  });
});

describe('InventoryPage details of the spec', () => {
  it('shows SKU, name, category, available / reserved / minimum and the stock signal [006/RF-1.1]', async () => {
    mockCatalog([sparePartFixture({ sku: 'OLED-IP13', name: 'Pantalla OLED iPhone 13', category: 'DISPLAY_OLED', physicalStock: 3, reservedStock: 1, availableStock: 2, minStock: 2, lowStock: true })]);
    renderWithProviders(<InventoryPage />, { role: 'RECEPTIONIST' });

    const row = (await screen.findByText('Pantalla OLED iPhone 13')).closest('tr')!;
    expect(within(row).getByText('OLED-IP13')).toBeInTheDocument();
    expect(within(row).getByText('2 / 1 / 2')).toBeInTheDocument();
    expect(within(row).getByText('Stock bajo')).toBeInTheDocument();
  });
});

describe('InventoryPage compatibility errors', () => {
  it('shows the server reason when the compatible models cannot be saved [006/RF-3.4]', async () => {
    mockCatalog([OLED]);
    server.use(
      http.patch(api('/spare-parts/p1'), () => HttpResponse.json({ statusCode: 422, message: 'Uno o más modelos de equipo no existen' }, { status: 422 })),
    );
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />, { role: 'ADMIN' });

    await user.click(await screen.findByRole('button', { name: 'Modelos (1)' }));
    const dialog = await screen.findByRole('dialog', { name: 'Compatibilidad por modelo' });
    await user.click(await within(dialog).findByLabelText('iPhone 14'));
    await user.click(within(dialog).getByRole('button', { name: 'Guardar compatibilidad' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Uno o más modelos de equipo no existen');
  });
});
