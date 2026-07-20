import type { EventBus, PlatformEvent } from '@platform/contracts';

/**
 * Cross-remote typed pub/sub. This is the ONLY sanctioned way for the shell
 * and remotes to talk to each other at runtime besides routing and backend
 * state - direct remote-to-remote imports are a lint violation.
 */
export function createEventBus(): EventBus {
  const handlers = new Map<PlatformEvent['type'], Set<(event: PlatformEvent) => void>>();

  return {
    publish<T extends PlatformEvent>(event: T) {
      const listeners = handlers.get(event.type);
      if (!listeners) return;
      // Snapshot before iterating so a handler unsubscribing mid-dispatch is safe.
      Array.from(listeners).forEach((handler) => handler(event));
    },
    subscribe<TType extends PlatformEvent['type']>(
      type: TType,
      handler: (event: Extract<PlatformEvent, { type: TType }>) => void
    ) {
      const set = handlers.get(type) ?? new Set();
      const wrapped = handler as (event: PlatformEvent) => void;
      set.add(wrapped);
      handlers.set(type, set);
      return () => {
        set.delete(wrapped);
      };
    }
  };
}

export type { EventBus, PlatformEvent } from '@platform/contracts';
