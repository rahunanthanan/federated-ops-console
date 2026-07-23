import React, { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import type { RemoteDescriptor, ObservabilityClient, RegionCode } from '@platform/contracts';
import { Banner, Button, Card } from '@platform/design-system';
import { loadRemoteModule } from './loadRemote';
import type { RemoteLoadDiagnosticEvent } from './loadRemote';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Demo-only visibility into the load/timeout/retry lifecycle from
// loadRemote.ts, surfaced as a live status line under the "Loading…" state.
// Flip to false to go back to a plain, silent loading state.
const SHOW_LOAD_DIAGNOSTICS = true;

function describeDiagnosticEvent(event: RemoteLoadDiagnosticEvent): string {
  switch (event.stage) {
    case 'attempt-start':
      return `Loading operations… (attempt ${event.attempt})`;
    case 'timeout':
      return `Attempt ${event.attempt} timed out after ${event.timeoutMs}ms`;
    case 'retry-start':
      return 'Retrying…';
    case 'success':
      return `Loaded on attempt ${event.attempt} in ${Math.round(event.durationMs)}ms`;
    case 'failure':
      return `Attempt ${event.attempt} failed: ${event.error}`;
  }
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; Component: ComponentType }
  | { status: 'error'; message: string }
  | { status: 'disabled' };

export function RemoteLoader({ descriptor, region, observability, route }: {
  descriptor: RemoteDescriptor;
  region: RegionCode;
  observability: ObservabilityClient;
  route: string;
}) {
  const [state, setState] = useState<LoadState>(descriptor.enabled ? { status: 'loading' } : { status: 'disabled' });
  const [retryCount, setRetryCount] = useState(0);
  const [diagnosticText, setDiagnosticText] = useState<string | null>(null);

  useEffect(() => {
    if (!descriptor.enabled) {
      setState({ status: 'disabled' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    setDiagnosticText(null);

    loadRemoteModule<{ default: ComponentType }>(descriptor, {
      onAttempt: SHOW_LOAD_DIAGNOSTICS
        ? (event) => {
            if (!cancelled) setDiagnosticText(describeDiagnosticEvent(event));
          }
        : undefined
    })
      .then((result) => {
        if (cancelled) return;
        observability.recordMetric('remote.load.duration_ms', result.durationMs, {
          remote: descriptor.name,
          version: result.version
        });
        setState({ status: 'ready', Component: result.module.default });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        observability.captureError(error, {
          application: descriptor.name,
          version: descriptor.version,
          route,
          region,
          category: 'remote_load_failure'
        });
        setState({ status: 'error', message: error instanceof Error ? error.message : 'Unknown remote load failure' });
      });

    return () => {
      cancelled = true;
    };
    // Re-run when the user explicitly retries (retryCount) or the descriptor
    // changes - including a version-only bump (same entryUrl, new version),
    // which is what makes the version-aware scriptCache in loadRemote.ts
    // actually get exercised instead of sitting dead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descriptor.entryUrl, descriptor.enabled, descriptor.version, retryCount]);

  if (state.status === 'disabled') {
    return (
      <Card>
        <Banner severity="info">
          The "{descriptor.name}" module has been disabled via runtime configuration by a Regional Administrator.
        </Banner>
      </Card>
    );
  }

  if (state.status === 'loading') {
    return (
      <Card>
        <p>Loading {descriptor.name}…</p>
        {SHOW_LOAD_DIAGNOSTICS && diagnosticText && (
          <p style={{ marginTop: 4, fontSize: 12, fontFamily: 'monospace', opacity: 0.7 }}>{diagnosticText}</p>
        )}
      </Card>
    );
  }

  if (state.status === 'error') {
    return (
      <Card>
        <Banner severity="error">
          <strong>{descriptor.name}</strong> is temporarily unavailable. Shell navigation and other modules are unaffected.
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>{state.message}</div>
        </Banner>
        <div style={{ marginTop: 12 }}>
          <Button
            variant="secondary"
            onClick={() => {
              setState({ status: 'loading' });
              setRetryCount((count) => count + 1);
            }}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const { Component } = state;
  return (
    <ErrorBoundary
      observability={observability}
      errorContext={{ application: descriptor.name, version: descriptor.version, route, region }}
      fallback={
        <Card>
          <Banner severity="error">
            <strong>{descriptor.name}</strong> hit a rendering error and has been isolated. Shell navigation is still available.
          </Banner>
        </Card>
      }
    >
      <Component />
    </ErrorBoundary>
  );
}
