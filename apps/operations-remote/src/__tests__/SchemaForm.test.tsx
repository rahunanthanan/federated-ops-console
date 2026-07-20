import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchemaForm } from '../forms/SchemaForm';
import { serviceRequestSchema, serviceRequestValidationSchema } from '../forms/serviceRequestSchema';

describe('SchemaForm (component)', () => {
  it('renders every top-level field from the schema, including a conditional one hidden by default', () => {
    render(
      <SchemaForm schema={serviceRequestSchema} validationSchema={serviceRequestValidationSchema} onSubmit={jest.fn()} />
    );

    expect(screen.getByLabelText(/subscription id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/incident category/i)).toBeInTheDocument();
    // "Estimated cost" is only visible when category === device_fault - hidden until selected.
    expect(screen.queryByLabelText(/estimated cost/i)).not.toBeInTheDocument();
  });

  it('reveals a conditional field once its visibleWhen dependency is satisfied', async () => {
    const user = userEvent.setup();
    render(
      <SchemaForm schema={serviceRequestSchema} validationSchema={serviceRequestValidationSchema} onSubmit={jest.fn()} />
    );

    await user.selectOptions(screen.getByLabelText(/incident category/i), 'device_fault');
    expect(screen.getByLabelText(/estimated cost/i)).toBeInTheDocument();
  });

  it('blocks submission and shows an accessible error summary when required fields are missing', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(
      <SchemaForm schema={serviceRequestSchema} validationSchema={serviceRequestValidationSchema} onSubmit={onSubmit} />
    );

    await user.click(screen.getByRole('button', { name: /submit request/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits parsed, typed values once validation passes', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(
      <SchemaForm schema={serviceRequestSchema} validationSchema={serviceRequestValidationSchema} onSubmit={onSubmit} />
    );

    await user.type(screen.getByLabelText(/subscription id/i), 'SUB-001');
    await user.selectOptions(screen.getByLabelText(/incident category/i), 'billing');
    await user.selectOptions(screen.getByLabelText(/severity/i), 'low');
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionId: 'SUB-001', category: 'billing', severity: 'low' })
    ));
  });
});
