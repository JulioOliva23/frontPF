import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { DeviceModel } from '../../../shared/api/types';
import { server } from '../../../test/msw-server';
import { api, renderRoutes } from '../../../test/render';
import { DeviceModelsPage } from './DeviceModelsPage';

const model = (id: string, brand: string, name: string, isActive = true): DeviceModel => ({ id, brand, model: name, isActive });

const CATALOG: DeviceModel[] = [
  model('m1', 'Apple', 'iPhone 13'),
  model('m2', 'Samsung', 'Galaxy S23'),
  model('m3', 'Apple', 'iPhone 11'),
  model('m4', 'Samsung', 'Galaxy A10', false),
  model('m5', 'Xiaomi', 'Redmi Note 12'),
];

function mockCatalog(initial: DeviceModel[] = CATALOG, { conflictOnCreate = false } = {}) {
  let catalog = [...initial];
  const created: unknown[] = [];
  const patched: Array<{ id: string; body: unknown }> = [];
  const listCalls: string[] = [];
  server.use(
    http.get(api('/device-models'), ({ request }) => {
      listCalls.push(new URL(request.url).search);
      return HttpResponse.json(catalog);
    }),
    http.post(api('/device-models'), async ({ request }) => {
      const body = (await request.json()) as { brand: string; model: string };
      created.push(body);
      if (conflictOnCreate) return HttpResponse.json({ statusCode: 409, message: 'Device model already registered for this brand' }, { status: 409 });
      const entry = model(`new-${created.length}`, body.brand, body.model);
      catalog = [...catalog, entry];
      return HttpResponse.json(entry, { status: 201 });
    }),
    http.patch(api('/device-models/:id'), async ({ request, params }) => {
      const body = (await request.json()) as Partial<DeviceModel>;
      patched.push({ id: String(params.id), body });
      catalog = catalog.map((entry) => (entry.id === params.id ? { ...entry, ...body } : entry));
      return HttpResponse.json(catalog.find((entry) => entry.id === params.id));
    }),
  );
  return { created, patched, listCalls };
}

function renderCatalog() {
  return renderRoutes([{ path: '/administracion/modelos', element: <DeviceModelsPage /> }], { role: 'ADMIN', at: '/administracion/modelos' });
}

const brandSection = (brand: string) => within(screen.getByRole('region', { name: brand }));
const modelsIn = (brand: string) => brandSection(brand).getAllByRole('listitem').map((item) => item.firstChild?.textContent);

describe('DeviceModelsPage catalog', () => {
  it('groups active models by brand, sorted by brand and model', async () => {
    const api = mockCatalog();
    renderCatalog();

    expect(await screen.findByRole('region', { name: 'Apple' })).toBeInTheDocument();
    expect(api.listCalls[0]).toBe('?includeInactive=true');
    expect(screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'))).toEqual(['Apple', 'Samsung', 'Xiaomi']);
    expect(modelsIn('Apple')).toEqual(['iPhone 11', 'iPhone 13']);
    // Inactive models are hidden by default.
    expect(modelsIn('Samsung')).toEqual(['Galaxy S23']);
    expect(screen.getByText('4 activos · 1 desactivados')).toBeInTheDocument();
  });

  it('shows deactivated models on demand', async () => {
    mockCatalog();
    renderCatalog();
    await screen.findByRole('region', { name: 'Samsung' });
    await userEvent.setup().click(screen.getByRole('checkbox', { name: 'Mostrar desactivados' }));
    expect(modelsIn('Samsung')).toEqual(['Galaxy A10', 'Galaxy S23']);
    expect(brandSection('Samsung').getByText('Desactivado')).toBeInTheDocument();
  });

  it('filters the catalog in the browser by brand or model', async () => {
    const api = mockCatalog();
    renderCatalog();
    await screen.findByRole('region', { name: 'Apple' });
    const user = userEvent.setup();
    const search = screen.getByRole('searchbox', { name: 'Buscar modelos' });

    await user.type(search, 'note');
    expect(screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'))).toEqual(['Xiaomi']);

    await user.clear(search);
    await user.type(search, 'samsung');
    expect(modelsIn('Samsung')).toEqual(['Galaxy S23']);

    await user.clear(search);
    await user.type(search, 'nokia');
    expect(screen.getByRole('heading', { name: 'Sin resultados' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    expect(screen.getAllByRole('region')).toHaveLength(3);
    expect(api.listCalls).toHaveLength(1);
  });

  it('deactivates a model and shows the feedback', async () => {
    const api = mockCatalog();
    renderCatalog();
    await screen.findByRole('region', { name: 'Apple' });

    await userEvent.setup().click(screen.getByRole('button', { name: 'Desactivar Apple iPhone 13' }));
    await waitFor(() => expect(api.patched).toEqual([{ id: 'm1', body: { isActive: false } }]));
    expect(await screen.findByText('Modelo desactivado')).toBeInTheDocument();
    await waitFor(() => expect(modelsIn('Apple')).toEqual(['iPhone 11']));
  });
});

describe('DeviceModelsPage quick add', () => {
  const form = () => within(screen.getByRole('form', { name: 'Agregar modelo' }));

  it('requires brand and model', async () => {
    const api = mockCatalog();
    renderCatalog();
    await screen.findByRole('region', { name: 'Apple' });
    await userEvent.setup().click(form().getByRole('button', { name: 'Agregar' }));

    expect(await form().findByText('Mínimo 2 caracteres')).toBeInTheDocument();
    expect(form().getByText('Ingrese el modelo')).toBeInTheDocument();
    expect(api.created).toHaveLength(0);
  });

  it('rejects a duplicate of the same brand before sending, ignoring case and spaces', async () => {
    const api = mockCatalog();
    renderCatalog();
    await screen.findByRole('region', { name: 'Apple' });
    const user = userEvent.setup();

    await user.type(form().getByLabelText('Marca'), ' apple ');
    await user.type(form().getByLabelText('Modelo'), 'IPHONE 13');
    await user.click(form().getByRole('button', { name: 'Agregar' }));

    expect(await form().findByText('Este modelo ya está registrado para esa marca')).toBeInTheDocument();
    expect(api.created).toHaveLength(0);
  });

  it('accepts the same model name under another brand', async () => {
    const api = mockCatalog();
    renderCatalog();
    await screen.findByRole('region', { name: 'Apple' });
    const user = userEvent.setup();

    await user.type(form().getByLabelText('Marca'), 'Motorola');
    await user.type(form().getByLabelText('Modelo'), 'iPhone 13');
    await user.click(form().getByRole('button', { name: 'Agregar' }));
    await waitFor(() => expect(api.created).toEqual([{ brand: 'Motorola', model: 'iPhone 13' }]));
  });

  it('adds a model to its brand, keeps the brand for the next one and refreshes the list', async () => {
    const api = mockCatalog();
    renderCatalog();
    await screen.findByRole('region', { name: 'Apple' });
    const user = userEvent.setup();

    await user.type(form().getByLabelText('Marca'), 'Apple');
    await user.type(form().getByLabelText('Modelo'), '  iPhone 15 ');
    await user.click(form().getByRole('button', { name: 'Agregar' }));

    await waitFor(() => expect(api.created).toEqual([{ brand: 'Apple', model: 'iPhone 15' }]));
    expect(await screen.findByText('Modelo agregado')).toBeInTheDocument();
    await waitFor(() => expect(modelsIn('Apple')).toEqual(['iPhone 11', 'iPhone 13', 'iPhone 15']));
    expect(form().getByLabelText('Marca')).toHaveValue('Apple');
    expect(form().getByLabelText('Modelo')).toHaveValue('');
  });

  it('reuses the existing spelling of a known brand', async () => {
    const api = mockCatalog();
    renderCatalog();
    await screen.findByRole('region', { name: 'Apple' });
    const user = userEvent.setup();

    await user.type(form().getByLabelText('Marca'), 'APPLE');
    await user.type(form().getByLabelText('Modelo'), 'iPhone 15');
    await user.click(form().getByRole('button', { name: 'Agregar' }));
    await waitFor(() => expect(api.created).toEqual([{ brand: 'Apple', model: 'iPhone 15' }]));
    await waitFor(() => expect(form().getByLabelText('Marca')).toHaveValue('Apple'));
  });

  it('shows the server duplicate (409) on the model field', async () => {
    mockCatalog(CATALOG, { conflictOnCreate: true });
    renderCatalog();
    await screen.findByRole('region', { name: 'Apple' });
    const user = userEvent.setup();

    await user.type(form().getByLabelText('Marca'), 'Huawei');
    await user.type(form().getByLabelText('Modelo'), 'P30');
    await user.click(form().getByRole('button', { name: 'Agregar' }));
    expect(await form().findByText('Este modelo ya está registrado para esa marca')).toBeInTheDocument();
  });
});
