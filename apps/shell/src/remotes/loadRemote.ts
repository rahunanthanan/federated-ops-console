import type { RemoteDescriptor, RemoteLoadResult } from '@platform/contracts';

// Webpack Module Federation runtime globals - typed loosely since they're
// injected by the ModuleFederationPlugin, not part of normal TS lib types.
declare const __webpack_init_sharing__: (scope: string) => Promise<void>;
declare const __webpack_share_scopes__: { default: unknown };

interface FederationContainer {
  init(shareScope: unknown): Promise<void> | void;
  get(module: string): Promise<() => unknown>;
}

const scriptCache = new Map<string, Promise<void>>();

function loadRemoteEntryScript(descriptor: RemoteDescriptor): Promise<void> {
  const cached = scriptCache.get(descriptor.entryUrl);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = descriptor.entryUrl;
    script.type = 'text/javascript';
    script.async = true;
    if (descriptor.integrity) {
      script.integrity = descriptor.integrity;
      script.crossOrigin = 'anonymous';
    }
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load remote entry script: ${descriptor.entryUrl}`));
    document.head.appendChild(script);
  });

  scriptCache.set(descriptor.entryUrl, promise);
  return promise;
}

/**
 * Dynamically loads a federated remote by descriptor (not by a build-time
 * webpack `remotes` entry). Supports a configurable timeout, a single retry
 * on transient failure, and returns a load-result carrying version + duration
 * for observability.
 */
export async function loadRemoteModule<T>(
  descriptor: RemoteDescriptor,
  options: { timeoutMs?: number; retry?: boolean } = {}
): Promise<RemoteLoadResult<T>> {
  const { timeoutMs = 6000, retry = true } = options;
  const start = performance.now();

  const attempt = async (): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Remote "${descriptor.name}" timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    const loadPromise = (async () => {
      await loadRemoteEntryScript(descriptor);
      await __webpack_init_sharing__('default');
      const container = (window as unknown as Record<string, FederationContainer>)[descriptor.name];
      if (!container) {
        throw new Error(`Remote container "${descriptor.name}" was not found on window after script load`);
      }
      await container.init(__webpack_share_scopes__.default);
      const factory = await container.get(descriptor.exposedModule);
      return factory() as T;
    })();

    return Promise.race([loadPromise, timeoutPromise]);
  };

  try {
    const module = await attempt();
    return { module, durationMs: performance.now() - start, version: descriptor.version };
  } catch (firstError) {
    if (!retry) throw firstError;
    // Retry once only for likely-transient failures - avoid uncontrolled retry loops.
    try {
      const module = await attempt();
      return { module, durationMs: performance.now() - start, version: descriptor.version };
    } catch (secondError) {
      throw secondError;
    }
  }
}
