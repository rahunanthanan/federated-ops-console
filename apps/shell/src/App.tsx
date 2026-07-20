import React, { useEffect, useState } from 'react';
import type { RemoteDescriptor, PlatformEvent, RegionCode } from '@platform/contracts';
import { createMockAuthClient } from '@platform/auth';
import { createEventBus } from '@platform/events';
import { createMockObservabilityClient } from '@platform/observability';
import { Button, Card, tokens } from '@platform/design-system';
import { RegionProvider, useRegion } from './region/RegionContext';
import { SUPPORTED_REGIONS } from './region/regions';
import { loadManifest } from './remotes/manifest';
import { RemoteLoader } from './remotes/RemoteLoader';
import { Notification } from './components/Notification';

const authClient = createMockAuthClient();
const eventBus = createEventBus();
const observability = createMockObservabilityClient('shell');

type NotificationPayload = Extract<PlatformEvent, { type: 'notification.show' }>['payload'];

function Header() {
  const { config, setRegion } = useRegion();
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${tokens.spacing(3)} ${tokens.spacing(5)}`,
        background: tokens.color.primary,
        color: '#fff'
      }}
    >
      <div>
        <strong>Federated Ops Console</strong>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Shell v0.1.0 · config {config.configVersion}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label htmlFor="region-select" style={{ fontSize: 12 }}>
          Region
        </label>
        <select
          id="region-select"
          value={config.region}
          onChange={(event) => setRegion(event.target.value as RegionCode)}
          style={{ padding: '4px 8px', borderRadius: tokens.radius }}
        >
          {SUPPORTED_REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}

function RegionSummary() {
  const { config } = useRegion();
  return (
    <Card style={{ marginBottom: tokens.spacing(4) }}>
      <strong>Active regional configuration</strong>
      <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '4px 16px', marginTop: 8, fontSize: 14 }}>
        <dt>Locale</dt>
        <dd>{config.locale}</dd>
        <dt>Currency</dt>
        <dd>{config.currency}</dd>
        <dt>Approval threshold</dt>
        <dd>
          {config.currency} {config.approvalThreshold.toLocaleString()}
        </dd>
        <dt>Advanced approval</dt>
        <dd>{config.features.advancedApproval ? 'Enabled' : 'Disabled'}</dd>
        <dt>Bulk operations</dt>
        <dd>{config.features.bulkOperations ? 'Enabled' : 'Disabled'}</dd>
      </dl>
    </Card>
  );
}

function OperationsSection({ descriptor, manifestError }: { descriptor: RemoteDescriptor | null; manifestError: string | null }) {
  const { config } = useRegion();

  if (manifestError) {
    return (
      <Card>
        Platform error: could not load the runtime remote manifest. The shell keeps running; only remote-backed
        sections are affected.
      </Card>
    );
  }

  if (!descriptor) {
    return <Card>Resolving remote manifest…</Card>;
  }

  return (
    <RemoteLoader descriptor={descriptor} region={config.region} observability={observability} route="/operations" />
  );
}

function AdminKillSwitch({ descriptor, onToggle }: { descriptor: RemoteDescriptor | null; onToggle: () => void }) {
  if (!descriptor) return null;
  return (
    <Card style={{ marginTop: tokens.spacing(4) }}>
      <strong>Platform health (Regional Administrator view)</strong>
      <p style={{ fontSize: 13, margin: '8px 0' }}>
        {descriptor.name} · v{descriptor.version} · {descriptor.enabled ? 'enabled' : 'disabled'}
      </p>
      <Button variant={descriptor.enabled ? 'danger' : 'primary'} onClick={onToggle}>
        {descriptor.enabled ? 'Disable remote (kill switch)' : 'Re-enable remote'}
      </Button>
    </Card>
  );
}

export function App() {
  const [notification, setNotification] = useState<NotificationPayload | null>(null);
  // Single source of truth for the "operations" remote descriptor - both the
  // rendered section and the admin kill switch read/write the same state so
  // toggling `enabled` actually unmounts/remounts the remote. The admin
  // interface displays the active remote version and allows a feature-level
  // kill switch.
  const [descriptor, setDescriptor] = useState<RemoteDescriptor | null>(null);
  const [manifestError, setManifestError] = useState<string | null>(null);

  useEffect(() => {
    loadManifest()
      .then((remotes) => setDescriptor(remotes.find((remote) => remote.name === 'operations') ?? null))
      .catch((error: unknown) => setManifestError(error instanceof Error ? error.message : 'Failed to load runtime manifest'));

    const unsubscribe = eventBus.subscribe('notification.show', (event) => setNotification(event.payload));
    return unsubscribe;
  }, []);

  const handleRegionChange = (region: RegionCode) => {
    eventBus.publish({ type: 'region.changed', payload: { region } });
    eventBus.publish({ type: 'notification.show', payload: { severity: 'success', message: `Region switched to ${region}` } });
  };

  return (
    <RegionProvider onRegionChange={handleRegionChange}>
      <Header />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: tokens.spacing(5) }}>
        <RegionSummary />
        <OperationsSection descriptor={descriptor} manifestError={manifestError} />
        <AdminKillSwitch
          descriptor={descriptor}
          onToggle={() => setDescriptor((current) => (current ? { ...current, enabled: !current.enabled } : current))}
        />
      </main>
      <Notification notification={notification} onDismiss={() => setNotification(null)} />
    </RegionProvider>
  );
}

export { authClient, eventBus, observability };
