/**
 * Type-safe, data-driven form schema. A FormField is a discriminated union
 * keyed on `type` - adding a new field type is a compile-time-checked
 * exhaustiveness problem everywhere the union is switched over (see
 * SchemaForm.tsx's `assertNever`).
 */
export interface SelectOption {
  value: string;
  label: string;
}

export interface VisibilityRule {
  field: string;
  operator: 'equals' | 'notEquals';
  value: unknown;
}

interface BaseField {
  name: string;
  label: string;
  required?: boolean;
  visibleWhen?: VisibilityRule;
}

export type FormField =
  | (BaseField & { type: 'text'; maxLength?: number })
  | (BaseField & { type: 'select'; options: SelectOption[] })
  | (BaseField & { type: 'number'; minimum?: number; maximum?: number })
  | (BaseField & { type: 'date'; minimumDate?: string });

export interface RequestSchema {
  id: string;
  version: number;
  supportedRegions: Array<'SG' | 'MY' | 'HK'>;
  fields: FormField[];
}

export function isFieldVisible(field: FormField, values: Record<string, unknown>): boolean {
  if (!field.visibleWhen) return true;
  const { field: dependsOn, operator, value } = field.visibleWhen;
  const currentValue = values[dependsOn];
  return operator === 'equals' ? currentValue === value : currentValue !== value;
}
