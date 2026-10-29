import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { UserRole } from '../../../shared/api/types';
import { paginatedWorkOrders, technicianFixture, workOrderFixture } from '../../../test/fixtures';
import { server } from '../../../test/msw-server';
import { api, renderRoutes } from '../../../test/render';
import { SEARCH_DEBOUNCE_MS } from '../components/WorkOrderSearchInput';
import { WorkOrdersPage } from './WorkOrdersPage';

const TECHNICIANS = [technicianFixture(), technicianFixture({ id: 'tech-2', username: 'tecnico2', fullName: 'Técnica Dos' })];

// Records the query params of every list request and every technician list
// request. With `empty`, any filtered request answers with no orders.
function mockList({ empty = false }: { empty?: boolean } = {}) {
  const calls: URLSearchParams[] = [];
  const technicianCalls: string[] = [];
  server.use(
    http.get(api('/work-orders'), ({ request }) => {
      const params = new URL(request.url).searchParams;
      calls.push(params);
      const filtered = params.has('search') || params.has('technicianId') || params.has('status');
      return HttpResponse.json(paginatedWorkOrders(empty && filtered ? [] : [workOrderFixture()]));
    }),
    http.get(api('/users'), ({ request }) => {
      technicianCalls.push(new URL(request.url).searchParams.get('role') ?? '');
      return HttpResponse.json(TECHNICIANS);
    }),
  );
  return { calls, technicianCalls, last: () => calls[calls.length - 1] };
}

function renderPage({ role = 'RECEPTIONIST', at = '/ordenes' }: { role?: UserRole; at?: string } = {}) {
  return renderRoutes([{ path: '/ordenes', element: <WorkOrdersPage /> }], { role, at });
}

const searchBox = () => screen.getByRole('searchbox', { name: 'Buscar órdenes' });
const technicianSelect = () => screen.getByRole('combobox', { name: 'Filtrar por técnico' });

describe('WorkOrdersPage search (debounced, synced with ?search=)', () => {
  it('sends a single request with the full text once typing stops', async () => {
    const list = mockList();
    const router = renderPage();
    await screen.findByText('María Quispe');
    const user = userEvent.setup();

    await user.type(searchBox(), 'Quispe');
    // Right after the keystrokes nothing was sent yet: the debounce holds them.
    expect(list.calls.some((params) => params.has('search'))).toBe(false);

    await waitFor(() => expect(list.last().get('search')).toBe('Quispe'), { timeout: SEARCH_DEBOUNCE_MS + 1000 });
    expect(list.calls.filter((params) => params.has('search'))).toHaveLength(1);
    expect(new URLSearchParams(router.state.location.search).get('search')).toBe('Quispe');
  });

  it('commits at once on Enter', async () => {
    const list = mockList();
    renderPage();
    await screen.findByText('María Quispe');
    const user = userEvent.setup();

    await user.type(searchBox(), 'OT-000123{Enter}');
    await waitFor(() => expect(list.last().get('search')).toBe('OT-000123'));
  });

  it('restores the filters from the URL', async () => {
    const list = mockList();
    renderPage({ at: '/ordenes?search=352099&technicianId=tech-2&status=BUDGETED' });

    await waitFor(() => expect(list.calls.length).toBeGreaterThan(0));
    expect(Object.fromEntries(list.calls[0])).toMatchObject({ search: '352099', technicianId: 'tech-2', status: 'BUDGETED' });
    expect(searchBox()).toHaveValue('352099');
    await waitFor(() => expect(technicianSelect()).toHaveValue('tech-2'));
    expect(screen.getByRole('radio', { name: 'Presupuestado' })).toBeChecked();
  });

  it('ignores an unknown status in the URL', async () => {
    const list = mockList();
    renderPage({ at: '/ordenes?status=PENDING' });
    await waitFor(() => expect(list.calls.length).toBeGreaterThan(0));
    expect(list.calls[0].has('status')).toBe(false);
    expect(screen.getByRole('radio', { name: 'Todos' })).toBeChecked();
  });
});

describe('WorkOrdersPage technician filter', () => {
  it('lists the active technicians and filters by the chosen one', async () => {
    const list = mockList();
    const router = renderPage();
    await screen.findByText('María Quispe');
    expect(list.technicianCalls).toEqual(['TECHNICIAN']);

    const select = technicianSelect();
    await waitFor(() => expect(within(select).getByRole('option', { name: 'Técnica Dos' })).toBeInTheDocument());
    await userEvent.setup().selectOptions(select, 'tech-2');

    await waitFor(() => expect(list.last().get('technicianId')).toBe('tech-2'));
    expect(new URLSearchParams(router.state.location.search).get('technicianId')).toBe('tech-2');
  });

  it('combines the technician with the status chips', async () => {
    const list = mockList();
    renderPage({ at: '/ordenes?technicianId=tech-1' });
    await screen.findByText('María Quispe');

    await userEvent.setup().click(screen.getByRole('radio', { name: 'En Reparación' }));
    await waitFor(() => expect(Object.fromEntries(list.last())).toMatchObject({ technicianId: 'tech-1', status: 'IN_REPAIR' }));
  });

  it('is not offered to technicians, who only see their queue (RN-06)', async () => {
    const list = mockList();
    renderPage({ role: 'TECHNICIAN', at: '/ordenes?technicianId=tech-2' });
    await screen.findByText('María Quispe');

    expect(screen.queryByRole('combobox', { name: 'Filtrar por técnico' })).not.toBeInTheDocument();
    expect(list.technicianCalls).toEqual([]);
    expect(list.calls[0].has('technicianId')).toBe(false);
  });
});

describe('WorkOrdersPage empty results', () => {
  it('explains the empty search and resets every filter', async () => {
    const list = mockList({ empty: true });
    const router = renderPage({ at: '/ordenes?search=zzz&technicianId=tech-1&status=IN_REPAIR' });

    expect(await screen.findByRole('heading', { name: 'Sin resultados' })).toBeInTheDocument();
    expect(screen.getByText(/ninguna orden coincide con “zzz”/i)).toBeInTheDocument();

    const resetButtons = screen.getAllByRole('button', { name: 'Limpiar filtros' });
    await userEvent.setup().click(resetButtons[resetButtons.length - 1]);

    await screen.findByText('María Quispe');
    expect(router.state.location.search).toBe('');
    expect([...list.last().keys()].filter((key) => key !== 'page' && key !== 'pageSize')).toEqual([]);
    expect(searchBox()).toHaveValue('');
    expect(technicianSelect()).toHaveValue('');
  });

  it('keeps the plain empty state when there are no orders at all', async () => {
    server.use(http.get(api('/work-orders'), () => HttpResponse.json(paginatedWorkOrders([]))), http.get(api('/users'), () => HttpResponse.json([])));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Sin órdenes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument();
  });
});
