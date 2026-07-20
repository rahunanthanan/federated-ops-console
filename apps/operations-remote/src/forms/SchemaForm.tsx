import React, { useMemo, useRef, useState } from 'react';
import type { ZodSchema } from 'zod';
import { Button, tokens } from '@platform/design-system';
import type { FormField, RequestSchema } from './schema';
import { isFieldVisible } from './schema';

function assertNever(value: never): never {
  throw new Error(`Unhandled form field type: ${JSON.stringify(value)}`);
}

interface SchemaFormProps<TValues extends Record<string, unknown>> {
  schema: RequestSchema;
  validationSchema: ZodSchema<TValues>;
  onSubmit: (values: TValues) => void | Promise<void>;
  submitLabel?: string;
}

/**
 * Renders a RequestSchema into an accessible, validated form. Field
 * visibility is evaluated purely from declarative VisibilityRule data -
 * no arbitrary code execution in configuration.
 */
export function SchemaForm<TValues extends Record<string, unknown>>({
  schema,
  validationSchema,
  onSubmit,
  submitLabel = 'Submit request'
}: SchemaFormProps<TValues>) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const visibleFields = useMemo(() => schema.fields.filter((field) => isFieldVisible(field, values)), [schema.fields, values]);

  function handleChange(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = validationSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      // Move focus to the error summary so screen-reader / keyboard users land on the problem list.
      errorSummaryRef.current?.focus();
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit(result.data);
    } finally {
      setSubmitting(false);
    }
  }

  const errorEntries = Object.entries(errors);

  return (
    <form onSubmit={handleSubmit} noValidate aria-describedby={errorEntries.length ? 'schema-form-errors' : undefined}>
      {errorEntries.length > 0 && (
        <div
          id="schema-form-errors"
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          style={{
            background: tokens.color.dangerSurface,
            color: tokens.color.danger,
            borderRadius: tokens.radius,
            padding: tokens.spacing(3),
            marginBottom: tokens.spacing(3)
          }}
        >
          <strong>Please fix the following before submitting:</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            {errorEntries.map(([field, message]) => (
              <li key={field}>
                <a href={`#field-${field}`}>{message}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {visibleFields.map((field) => (
        <FieldRenderer key={field.name} field={field} value={values[field.name]} error={errors[field.name]} onChange={handleChange} />
      ))}

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : submitLabel}
      </Button>
    </form>
  );
}

function FieldRenderer({
  field,
  value,
  error,
  onChange
}: {
  field: FormField;
  value: unknown;
  error?: string;
  onChange: (name: string, value: unknown) => void;
}) {
  const inputId = `field-${field.name}`;
  const wrapperStyle: React.CSSProperties = { marginBottom: tokens.spacing(3) };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 };
  const controlStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: tokens.radius,
    border: `1px solid ${error ? tokens.color.danger : tokens.color.border}`
  };

  const label = (
    <label htmlFor={inputId} style={labelStyle}>
      {field.label}
      {field.required ? ' *' : ''}
    </label>
  );

  const errorNode = error ? (
    <div style={{ color: tokens.color.danger, fontSize: 12, marginTop: 4 }} id={`${inputId}-error`}>
      {error}
    </div>
  ) : null;

  switch (field.type) {
    case 'text':
      return (
        <div style={wrapperStyle}>
          {label}
          <input
            id={inputId}
            type="text"
            maxLength={field.maxLength}
            value={(value as string) ?? ''}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            onChange={(event) => onChange(field.name, event.target.value)}
            style={controlStyle}
          />
          {errorNode}
        </div>
      );
    case 'number':
      return (
        <div style={wrapperStyle}>
          {label}
          <input
            id={inputId}
            type="number"
            min={field.minimum}
            max={field.maximum}
            value={(value as number | undefined) ?? ''}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            onChange={(event) => onChange(field.name, event.target.value === '' ? undefined : Number(event.target.value))}
            style={controlStyle}
          />
          {errorNode}
        </div>
      );
    case 'date':
      return (
        <div style={wrapperStyle}>
          {label}
          <input
            id={inputId}
            type="date"
            min={field.minimumDate}
            value={(value as string) ?? ''}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            onChange={(event) => onChange(field.name, event.target.value)}
            style={controlStyle}
          />
          {errorNode}
        </div>
      );
    case 'select':
      return (
        <div style={wrapperStyle}>
          {label}
          <select
            id={inputId}
            value={(value as string) ?? ''}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            onChange={(event) => onChange(field.name, event.target.value)}
            style={controlStyle}
          >
            <option value="" disabled>
              Select…
            </option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errorNode}
        </div>
      );
    default:
      return assertNever(field);
  }
}
