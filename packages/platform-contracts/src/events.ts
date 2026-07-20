import type { RegionCode } from './region';

/** Discriminated union of every event a remote/shell may publish. Exhaustive handling enforced at compile time. */
export type PlatformEvent =
  | { type: 'region.changed'; payload: { region: RegionCode } }
  | { type: 'request.created'; payload: { requestId: string } }
  | { type: 'remote.loaded'; payload: { name: string; version: string; durationMs: number } }
  | { type: 'remote.failed'; payload: { name: string; errorCategory: string; route: string } }
  | { type: 'notification.show'; payload: { severity: 'success' | 'warning' | 'error'; message: string } };

export interface EventBus {
  publish<T extends PlatformEvent>(event: T): void;
  subscribe<TType extends PlatformEvent['type']>(
    type: TType,
    handler: (event: Extract<PlatformEvent, { type: TType }>) => void
  ): () => void;
}
