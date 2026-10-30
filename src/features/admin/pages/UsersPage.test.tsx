import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { routes } from '../../../app/router';
import type { UserResponse, UserRole } from '../../../shared/api/types';
import { technicianFixture } from '../../../test/fixtures';
import { server } from '../../../test/msw-server';
import { api, renderRoutes } from '../../../test/render';
import { UsersPage } from './UsersPage';

const ME = 'admin-1';

const USERS: UserResponse[] = [
  technicianFixture({ id: ME, username: 'admin', fullName: 'Ana Admin', role: 'ADMIN' }),
  technicianFixture({ id: 'recep-1', username: 'recep01', fullName: 'Rosa Recepción', role: 'RECEPTIONIST' }),
  technicianFixture({ id: 'tech-1', username: 'tecnico1', fullName: 'Juan Técnico' }),
  technicianFixture({ id: 'tech-2', username: 'tecnico2', fullName: 'Luis Baja', isActive: false }),
];

interface Recorded {
  listCalls: string[];
  bodies: Array<{ method: string; path: string; body: unknown }>;
}

// Fake /users backend that keeps the list in memory, so a mutation followed
// by the invalidation refetch shows the new state.
function mockUsersApi(initial: UserResponse[] = USERS, { conflictOnCreate = false } = {}) {
  let users = [...initial];
  const recorded: Recorded = { listCalls: [], bodies: [] };
  const record = async (request: Request, path: string) => {
    const text = await request.text();
    recorded.bodies.push({ method: request.method, path, body: text ? JSON.parse(text) : undefined });
  };
  server.use(
    http.get(api('/users'), ({ request }) => {
      recorded.listCalls.push(new URL(request.url).search);
      return HttpResponse.json(users);
    }),
    http.post(api('/users'), async ({ request }) => {
      await record(request, '/users');
      if (conflictOnCreate) return HttpResponse.json({ statusCode: 409, message: 'Username already taken', error: 'Conflict' }, { status: 409 });
      const body = recorded.bodies[recorded.bodies.length - 1].body as { username: string; fullName: string; role: UserRole };
      const created = technicianFixture({ id: 'new-1', ...body });
      users = [...users, created];
      return HttpResponse.json(created, { status: 201 });
    }),
    http.delete(api('/users/:id'), async ({ request, params }) => {
      await record(request, `/users/${String(params.id)}`);
      users = users.map((user) => (user.id === params.id ? { ...user, isActive: false } : user));
      return HttpResponse.json(users.find((user) => user.id === params.id));
    }),
    http.post(api('/users/:id/password'), async ({ request, params }) => {
      await record(request, `/users/${String(params.id)}/password`);
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return recorded;
}

function renderUsers(role: UserRole = 'ADMIN') {
  return renderRoutes([{ path: '/administracion/usuarios', element: <UsersPage /> }], { role, userId: ME, at: '/administracion/usuarios' });
}

const rowOf = (name: string) => {
  const row = screen.getByText(name).closest('tr');
  if (!row) throw new Error(`row ${name} not found`);
  return within(row);
};

describe('UsersPage listing', () => {
  it('lists every account with its username, role and status [008/RF-1.1]', async () => {
    const recorded = mockUsersApi();
    renderUsers();

    expect(await screen.findByText('Rosa Recepción')).toBeInTheDocument();
    expect(recorded.listCalls[0]).toBe('?includeInactive=true');
    expect(rowOf('Rosa Recepción').getByText('@recep01')).toBeInTheDocument();
    expect(rowOf('Rosa Recepción').getByText('Recepción')).toBeInTheDocument();
    expect(rowOf('Juan Técnico').getByText('Activo')).toBeInTheDocument();
    expect(rowOf('Luis Baja').getByText('Desactivado')).toBeInTheDocument();
    expect(rowOf('Ana Admin').getByText('Tú')).toBeInTheDocument();
  });

  it('filters by text, role and status in the browser [008/RF-1.2]', async () => {
    mockUsersApi();
    renderUsers();
    await screen.findByText('Rosa Recepción');
    const user = userEvent.setup();

    await user.type(screen.getByRole('searchbox', { name: 'Buscar usuarios' }), 'tecnico');
    expect(screen.getByText('Juan Técnico')).toBeInTheDocument();
    expect(screen.queryByText('Rosa Recepción')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filtrar por estado' }), 'inactive');
    expect(screen.getByText('Luis Baja')).toBeInTheDocument();
    expect(screen.queryByText('Juan Técnico')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filtrar por rol' }), 'ADMIN');
    expect(screen.getByRole('heading', { name: 'Sin resultados' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(screen.getByText('Rosa Recepción')).toBeInTheDocument();
  });

  it('paginates long lists [008/RF-1.3]', async () => {
    const many = Array.from({ length: 13 }, (_, index) =>
      technicianFixture({ id: `t${index}`, username: `tecnico${index}`, fullName: `Técnico ${String(index).padStart(2, '0')}` }),
    );
    mockUsersApi(many);
    renderUsers();
    await screen.findByText('Técnico 00');
    expect(screen.queryByText('Técnico 12')).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByText('Técnico 12')).toBeInTheDocument();
  });
});

describe('UsersPage create modal', () => {
  const openModal = async () => {
    await screen.findByText('Rosa Recepción');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Nuevo usuario' }));
    return { user, dialog: within(screen.getByRole('dialog', { name: 'Nuevo usuario' })) };
  };

  it('validates required fields and the password rules before sending [008/RF-2.1] [008/RF-2.3]', async () => {
    const recorded = mockUsersApi();
    renderUsers();
    const { user, dialog } = await openModal();

    await user.type(dialog.getByLabelText('Contraseña'), 'corta');
    await user.type(dialog.getByLabelText('Repetir contraseña'), 'otra');
    await user.click(dialog.getByRole('button', { name: 'Crear usuario' }));

    expect(await dialog.findByText('Mínimo 3 caracteres')).toBeInTheDocument();
    expect(dialog.getByText(/de 3 a 80 caracteres/i)).toBeInTheDocument();
    expect(dialog.getByText('Mínimo 10 caracteres')).toBeInTheDocument();
    expect(dialog.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(recorded.bodies).toHaveLength(0);
  });

  it('creates the account, shows a toast and refreshes the list [008/RF-2.5]', async () => {
    const recorded = mockUsersApi();
    renderUsers();
    const { user, dialog } = await openModal();

    await user.type(dialog.getByLabelText('Nombre completo'), 'Carla Nueva');
    await user.type(dialog.getByLabelText('Usuario'), 'Carla.N');
    await user.selectOptions(dialog.getByLabelText('Rol'), 'RECEPTIONIST');
    await user.type(dialog.getByLabelText('Contraseña'), 'Segura12345');
    await user.type(dialog.getByLabelText('Repetir contraseña'), 'Segura12345');
    await user.click(dialog.getByRole('button', { name: 'Crear usuario' }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nuevo usuario' })).not.toBeInTheDocument());
    // Username normalized to lowercase; the confirmation never leaves the form.
    expect(recorded.bodies[0]).toEqual({
      method: 'POST',
      path: '/users',
      body: { username: 'carla.n', fullName: 'Carla Nueva', role: 'RECEPTIONIST', password: 'Segura12345' },
    });
    expect(await screen.findByText('Usuario creado')).toBeInTheDocument();
    expect(await screen.findByText('Carla Nueva')).toBeInTheDocument();
    expect(recorded.listCalls.length).toBeGreaterThanOrEqual(2);
  });

  it('marks a taken username on the field (409) [008/RF-2.6]', async () => {
    mockUsersApi(USERS, { conflictOnCreate: true });
    renderUsers();
    const { user, dialog } = await openModal();

    await user.type(dialog.getByLabelText('Nombre completo'), 'Otra Rosa');
    await user.type(dialog.getByLabelText('Usuario'), 'recep01');
    await user.type(dialog.getByLabelText('Contraseña'), 'Segura12345');
    await user.type(dialog.getByLabelText('Repetir contraseña'), 'Segura12345');
    await user.click(dialog.getByRole('button', { name: 'Crear usuario' }));

    expect(await dialog.findByText('Ese nombre de usuario ya está en uso')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Nuevo usuario' })).toBeInTheDocument();
  });
});

describe('UsersPage maintenance', () => {
  it('deactivates another user after confirming [008/RF-4.1]', async () => {
    const recorded = mockUsersApi();
    renderUsers();
    await screen.findByText('Juan Técnico');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Desactivar Juan Técnico' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Desactivar usuario' }));
    await user.click(dialog.getByRole('button', { name: 'Desactivar' }));

    await waitFor(() => expect(recorded.bodies).toContainEqual({ method: 'DELETE', path: '/users/tech-1', body: undefined }));
    expect(await screen.findByText('Usuario desactivado')).toBeInTheDocument();
    await waitFor(() => expect(rowOf('Juan Técnico').getByText('Desactivado')).toBeInTheDocument());
  });

  it('never offers to deactivate the signed-in admin [008/RF-4.2]', async () => {
    mockUsersApi();
    renderUsers();
    await screen.findByText('Ana Admin');
    expect(screen.getByRole('button', { name: 'No puedes desactivar tu propia cuenta' })).toBeDisabled();
  });

  it('locks the role when the admin edits their own account [008/RF-3.2]', async () => {
    mockUsersApi();
    renderUsers();
    await screen.findByText('Ana Admin');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Editar Ana Admin' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Editar usuario' }));
    expect(dialog.queryByRole('combobox', { name: 'Rol' })).not.toBeInTheDocument();
    expect(dialog.getByText('No puedes cambiar tu propio rol.')).toBeInTheDocument();
  });

  it('resets a password with the same rules as creation [008/RF-3.3]', async () => {
    const recorded = mockUsersApi();
    renderUsers();
    await screen.findByText('Juan Técnico');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Restablecer contraseña de Juan Técnico' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Restablecer contraseña' }));
    await user.type(dialog.getByLabelText('Nueva contraseña'), 'sinmayuscula1');
    await user.type(dialog.getByLabelText('Repetir contraseña'), 'sinmayuscula1');
    await user.click(dialog.getByRole('button', { name: 'Restablecer' }));
    expect(await dialog.findByText('Debe incluir una mayúscula')).toBeInTheDocument();

    await user.clear(dialog.getByLabelText('Nueva contraseña'));
    await user.clear(dialog.getByLabelText('Repetir contraseña'));
    await user.type(dialog.getByLabelText('Nueva contraseña'), 'Nueva123456');
    await user.type(dialog.getByLabelText('Repetir contraseña'), 'Nueva123456');
    await user.click(dialog.getByRole('button', { name: 'Restablecer' }));

    await waitFor(() => expect(recorded.bodies).toContainEqual({ method: 'POST', path: '/users/tech-1/password', body: { password: 'Nueva123456' } }));
    expect(await screen.findByText('Contraseña restablecida')).toBeInTheDocument();
  });
});

describe('UsersPage access (RoleGuard ADMIN_ONLY)', () => {
  function frontDeskShell() {
    server.use(
      http.get(api('/spare-parts/alerts/low-stock'), () => HttpResponse.json([])),
      http.get(api('/work-orders/summary'), () => HttpResponse.json({ active: 0, overdue: 0, byStatus: [] })),
      http.get(api('/work-orders'), () => HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 20 })),
    );
  }

  it.each([
    ['RECEPTIONIST', '/'],
    ['TECHNICIAN', '/ordenes'],
    ['CUSTOMER', '/portal-cliente'],
  ] as const)('sends %s typing the URL to %s without loading users', async (role, landing) => {
    frontDeskShell();
    const recorded = mockUsersApi();
    server.use(http.get(api('/work-orders/mine'), () => HttpResponse.json([])));
    const router = renderRoutes(routes, { role, at: '/administracion/usuarios' });

    await waitFor(() => expect(router.state.location.pathname).toBe(landing));
    expect(screen.queryByRole('heading', { name: 'Usuarios', level: 1 })).not.toBeInTheDocument();
    expect(recorded.listCalls).not.toContain('?includeInactive=true');
  });
});

describe('UsersPage edit and reactivate', () => {
  it('changes the name and the role of another staff member [008/RF-3.1]', async () => {
    mockUsersApi();
    const patches: Array<{ id: string; body: unknown }> = [];
    server.use(
      http.patch(api('/users/:id'), async ({ request, params }) => {
        patches.push({ id: String(params.id), body: await request.json() });
        return HttpResponse.json(technicianFixture({ id: String(params.id), fullName: 'Juan Nuevo', role: 'RECEPTIONIST' }));
      }),
    );
    renderUsers();
    await screen.findByText('Juan Técnico');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Editar Juan Técnico' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Editar usuario' }));
    const name = dialog.getByLabelText('Nombre completo');
    await user.clear(name);
    await user.type(name, 'Juan Nuevo');
    await user.selectOptions(dialog.getByLabelText('Rol'), 'RECEPTIONIST');
    await user.click(dialog.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(patches).toHaveLength(1));
    expect(patches[0]).toMatchObject({ id: 'tech-1', body: { fullName: 'Juan Nuevo', role: 'RECEPTIONIST' } });
  });

  it('reactivates an inactive account after confirming [008/RF-4.3]', async () => {
    mockUsersApi();
    let activated = '';
    server.use(
      http.post(api('/users/:id/activate'), ({ params }) => {
        activated = String(params.id);
        return HttpResponse.json(technicianFixture({ id: 'tech-2', username: 'tecnico2', fullName: 'Luis Baja', isActive: true }));
      }),
    );
    renderUsers();
    await screen.findByText('Luis Baja');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Reactivar Luis Baja' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Reactivar usuario' }));
    expect(activated).toBe('');
    await user.click(dialog.getByRole('button', { name: 'Reactivar' }));

    await waitFor(() => expect(activated).toBe('tech-2'));
  });
});
