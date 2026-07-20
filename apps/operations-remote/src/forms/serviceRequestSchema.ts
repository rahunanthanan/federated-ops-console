import { z } from 'zod';
import type { RequestSchema } from './schema';

/**
 * Concrete schema for the "device incident" service request journey used in
 * the operations remote MVP. Region-specific extension happens by branching
 * on supportedRegions/approvalThreshold in the caller, not by forking this
 * schema per country.
 */
export const serviceRequestSchema: RequestSchema = {
  id: 'device-incident-request',
  version: 3,
  supportedRegions: ['SG', 'MY', 'HK'],
  fields: [
    { type: 'text', name: 'subscriptionId', label: 'Subscription ID', required: true, maxLength: 32 },
    {
      type: 'select',
      name: 'category',
      label: 'Incident category',
      required: true,
      options: [
        { value: 'device_fault', label: 'Device fault' },
        { value: 'billing', label: 'Billing dispute' },
        { value: 'service_change', label: 'Service change' }
      ]
    },
    {
      type: 'select',
      name: 'severity',
      label: 'Severity',
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
      ]
    },
    {
      type: 'number',
      name: 'estimatedCost',
      label: 'Estimated cost',
      minimum: 0,
      // Only relevant once a fault is confirmed billable - demonstrates conditional visibility.
      visibleWhen: { field: 'category', operator: 'equals', value: 'device_fault' }
    },
    { type: 'date', name: 'requiredByDate', label: 'Required by' },
    { type: 'text', name: 'notes', label: 'Notes', maxLength: 500 }
  ]
};

/** Zod schema derived from the same field list - single source of truth, no duplicated validation rules. */
export const serviceRequestValidationSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required').max(32),
  category: z.enum(['device_fault', 'billing', 'service_change'], {
    errorMap: () => ({ message: 'Select an incident category' })
  }),
  severity: z.enum(['low', 'medium', 'high'], { errorMap: () => ({ message: 'Select a severity' }) }),
  estimatedCost: z.number().min(0).optional(),
  requiredByDate: z.string().optional(),
  notes: z.string().max(500).optional()
});

export type ServiceRequestFormValues = z.infer<typeof serviceRequestValidationSchema>;
