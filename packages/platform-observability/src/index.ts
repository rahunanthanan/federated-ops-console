import type { ObservabilityClient, ErrorContext } from '@platform/contracts';

/**
 * Mock observability adapter. Logs to console with a consistent shape so it
 * can be swapped for a real OpenTelemetry/Sentry-style exporter without
 * touching call sites. Redacts nothing sensitive because the mock never
 * receives PII - callers are responsible for only passing safe context.
 */
export function createMockObservabilityClient(application: string): ObservabilityClient {
  return {
    captureError(error: unknown, context: ErrorContext) {
      // eslint-disable-next-line no-console
      console.error(`[observability:${application}] error`, {
        message: error instanceof Error ? error.message : String(error),
        ...context
      });
    },
    recordMetric(name: string, value: number, attributes?: Record<string, string>) {
      // eslint-disable-next-line no-console
      console.info(`[observability:${application}] metric`, { name, value, ...attributes });
    },
    startSpan(name: string, attributes?: Record<string, string>) {
      const start = performance.now();
      return {
        end() {
          const durationMs = performance.now() - start;
          // eslint-disable-next-line no-console
          console.info(`[observability:${application}] span`, { name, durationMs, ...attributes });
        }
      };
    }
  };
}

export type { ObservabilityClient, ErrorContext } from '@platform/contracts';
