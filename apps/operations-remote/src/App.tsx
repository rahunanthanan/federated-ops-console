import React, { useState } from 'react';
import { createEventBus } from '@platform/events';
import { createMockObservabilityClient } from '@platform/observability';
import { Banner, Card, tokens } from '@platform/design-system';
import { SchemaForm } from './forms/SchemaForm';
import { serviceRequestSchema, serviceRequestValidationSchema } from './forms/serviceRequestSchema';
import type { ServiceRequestFormValues } from './forms/serviceRequestSchema';
import { operationsHttpClient } from './api/mockHttp';

// This remote owns its own event bus / observability instances so it stays
// independently runnable (spec: "Local development supports starting the
// shell with real or mocked remotes"). In a production deployment these
// would be resolved from a shared singleton exposed by the shell rather than
// instantiated per-remote - see docs/architecture/overview.md for the trade-off.
const eventBus = createEventBus();
const observability = createMockObservabilityClient('operations-remote');

interface AuditEntry {
  requestId: string;
  schemaId: string;
  schemaVersion: number;
  submittedAt: string;
}

function App() {
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([]);
  const [banner, setBanner] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);

  async function handleSubmit(values: ServiceRequestFormValues) {
    const span = observability.startSpan('service_request.submit');
    try {
      const response = await operationsHttpClient.post<ServiceRequestFormValues, { requestId: string }>(
        '/service-requests',
        values
      );

      // Audit event fired specifically because this schema version was used for submission.
      const entry: AuditEntry = {
        requestId: response.requestId,
        schemaId: serviceRequestSchema.id,
        schemaVersion: serviceRequestSchema.version,
        submittedAt: new Date().toISOString()
      };
      setAuditHistory((current) => [entry, ...current]);
      eventBus.publish({ type: 'request.created', payload: { requestId: response.requestId } });
      eventBus.publish({
        type: 'notification.show',
        payload: { severity: 'success', message: `Request ${response.requestId} submitted` }
      });
      setBanner({ severity: 'success', message: `Request ${response.requestId} submitted successfully.` });
    } catch (error) {
      observability.captureError(error, {
        application: 'operations-remote',
        version: '0.1.0-local',
        route: '/operations/service-requests/new',
        region: 'SG',
        category: 'form_submission'
      });
      setBanner({ severity: 'error', message: 'Could not submit the request. Please try again.' });
    } finally {
      span.end();
    }
  }

  return (
    <div style={{ display: 'grid', gap: tokens.spacing(4) }}>
      <div>
        <h2 style={{ margin: 0 }}>Service requests</h2>
        <p style={{ color: tokens.color.textMuted, fontSize: 13, margin: '4px 0 0' }}>
          Schema <code>{serviceRequestSchema.id}</code> · version {serviceRequestSchema.version} · supports{' '}
          {serviceRequestSchema.supportedRegions.join(', ')}
        </p>
      </div>

      {banner && <Banner severity={banner.severity}>{banner.message}</Banner>}

      <Card>
        <SchemaForm
          schema={serviceRequestSchema}
          validationSchema={serviceRequestValidationSchema}
          onSubmit={handleSubmit}
        />
      </Card>

      <Card>
        <strong>Audit history</strong>
        {auditHistory.length === 0 ? (
          <p style={{ fontSize: 13, color: tokens.color.textMuted }}>No requests submitted yet.</p>
        ) : (
          <ul style={{ paddingLeft: 18, fontSize: 13 }}>
            {auditHistory.map((entry) => (
              <li key={entry.requestId}>
                {entry.requestId} — schema v{entry.schemaVersion} — {entry.submittedAt}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default App;
