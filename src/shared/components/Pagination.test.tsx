import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Pagination } from './Pagination';

describe('Pagination (BE-E13)', () => {
  it('shows the "showing X–Y of Z" range and the available pages', () => {
    render(<Pagination page={1} pageSize={20} total={45} onPageChange={vi.fn()} />);

    expect(screen.getByText('Mostrando 1–20 de 45 resultados')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Anterior$/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Siguiente$/ })).toBeEnabled();
  });

  it('computes the range of the last partial page', () => {
    render(<Pagination page={3} pageSize={20} total={45} onPageChange={vi.fn()} />);

    expect(screen.getByText('Mostrando 41–45 de 45 resultados')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Anterior$/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /^Siguiente$/ })).toBeDisabled();
  });

  it('notifies the requested page on Previous and Next', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={2} pageSize={20} total={45} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: /^Anterior$/ }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole('button', { name: /^Siguiente$/ }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('does not render when the result fits on a single page', () => {
    const { container } = render(
      <Pagination page={1} pageSize={20} total={5} onPageChange={vi.fn()} />,
    );

    expect(container.querySelector('button')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Mostrando/)).not.toBeInTheDocument();
  });
});