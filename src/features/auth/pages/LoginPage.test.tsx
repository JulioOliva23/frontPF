import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../../shared/api/httpClient';
import type { AuthUser } from '../api/auth-service';
import { renderWithProviders } from '../../../test/render';
import { LoginPage } from './LoginPage';

function renderLogin(login: (username: string, password: string) => Promise<AuthUser>) {
  return renderWithProviders(<LoginPage />, {
    role: null,
    route: '/auth/login',
    path: '/auth/login',
    auth: { login },
    extraRoutes: [
      // Front desk lands on the dashboard (phase 2).
      <Route key="d" path="/" element={<p>Panel de recepción</p>} />,
      <Route key="o" path="/ordenes" element={<p>Listado de órdenes</p>} />,
      <Route key="p" path="/portal-cliente" element={<p>Portal del cliente</p>} />,
    ],
  });
}

async function submit(username: string, password: string) {
  const user = userEvent.setup();
  if (username) await user.type(screen.getByLabelText('Usuario'), username);
  if (password) await user.type(screen.getByLabelText('Contraseña'), password);
  await user.click(screen.getByRole('button', { name: 'Ingresar' }));
}

describe('LoginPage', () => {
  it('validates required fields before calling the API', async () => {
    const login = vi.fn();
    renderLogin(login);
    await submit('', '');
    expect(await screen.findByText('El nombre de usuario es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it.each([
    ['RECEPTIONIST', 'Panel de recepción'],
    ['TECHNICIAN', 'Listado de órdenes'],
    ['CUSTOMER', 'Portal del cliente'],
  ] as const)('sends a %s to their default route', async (role, landing) => {
    const login = vi.fn(async () => ({ id: 'u1', fullName: 'Ana', username: 'ana', role }));
    renderLogin(login);
    await submit('recep01', 'secreto');
    expect(await screen.findByText(landing)).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith('recep01', 'secreto');
  });

  it('shows the backend message on bad credentials', async () => {
    renderLogin(async () => {
      throw new ApiError(401, ['Credenciales de acceso incorrectas o usuario inactivo']);
    });
    await submit('admin01', 'mala');
    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales de acceso incorrectas o usuario inactivo');
  });

  it('asks to wait when rate limited', async () => {
    renderLogin(async () => {
      throw new ApiError(429, ['ThrottlerException: Too Many Requests']);
    });
    await submit('admin01', 'mala');
    expect(await screen.findByRole('alert')).toHaveTextContent('Demasiados intentos');
  });

  it('falls back to a generic message for unexpected errors', async () => {
    renderLogin(async () => {
      throw new Error('network down');
    });
    await submit('admin01', 'mala');
    expect(await screen.findByRole('alert')).toHaveTextContent('Error inesperado al iniciar sesión');
  });
});
