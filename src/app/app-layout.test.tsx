import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderRoutes } from '../test/render';
import { AppLayout } from './app-layout';

function renderTechnicianLayout() {
  renderRoutes(
    [{ path: '/', element: <AppLayout />, children: [{ path: 'ordenes', element: <h1>Mis reparaciones</h1> }] }],
    { role: 'TECHNICIAN', at: '/ordenes' },
  );
}

describe('AppLayout mobile navigation', () => {
  it('keeps the technician navigation within their allowed routes', async () => {
    renderTechnicianLayout();
    const mobile = screen.getByRole('navigation', { name: 'Navegación móvil' });
    expect(within(mobile).getByRole('link', { name: 'Órdenes' })).toHaveAttribute('aria-current', 'page');
    expect(within(mobile).queryByRole('link', { name: 'Inventario' })).not.toBeInTheDocument();

    await userEvent.setup().click(within(mobile).getByRole('button', { name: 'Más opciones' }));
    const drawer = screen.getByRole('dialog', { name: 'Menú de navegación' });
    expect(within(drawer).getByRole('link', { name: 'Órdenes de trabajo' })).toHaveAttribute('href', '/ordenes');
    expect(within(drawer).queryByRole('link', { name: /Presupuestos|Inventario|Usuarios/ })).not.toBeInTheDocument();
  });

  it('manages keyboard focus and restores scrolling when the drawer closes', async () => {
    const user = userEvent.setup();
    renderTechnicianLayout();
    const trigger = screen.getByRole('button', { name: 'Más opciones' });
    await user.click(trigger);
    const drawer = screen.getByRole('dialog', { name: 'Menú de navegación' });
    expect(drawer).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');

    await user.tab();
    expect(within(drawer).getByRole('button', { name: 'Cerrar menú' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(within(drawer).getByRole('button', { name: 'Cerrar sesión' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });
});
