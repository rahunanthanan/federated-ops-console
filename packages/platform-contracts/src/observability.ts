import type { RegionCode } from './region';

export interface ErrorContext {
  application: string;
  version: string;
  route: string;
  region: RegionCode;
  correlationId?: string;
  category: string;
}

export interface ObservabilityClient {
  captureError(error: unknown, context: ErrorContext): void;
  recordMetric(name: string, value: number, attributes?: Record<string, string>): void;
  startSpan(name: string, attributes?: Record<string, string>): { end(): void };
}
