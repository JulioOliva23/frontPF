import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormField } from './form-field';

describe('FormField error display', () => {
  it('distinguishes a field with an error by more than colour: text, role and aria state [010/RF-5.2]', () => {
    render(<FormField id="username" label="Usuario" error="El nombre de usuario es obligatorio" />);

    const input = screen.getByLabelText('Usuario');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('El nombre de usuario es obligatorio');
    expect(input).toHaveAccessibleDescription('El nombre de usuario es obligatorio');
  });

  it('shows no alert and no invalid state when the field is fine [010/RF-5.2]', () => {
    render(<FormField id="username" label="Usuario" />);

    expect(screen.getByLabelText('Usuario')).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
