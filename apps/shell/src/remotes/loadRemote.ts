import type { RemoteDescriptor, RemoteLoadResult } from '@platform/contracts';

// Webpack Module Federation runtime globals - typed loosely since they're
// injected by the ModuleFederationPlugin, not part of normal TS lib types.
declare const __webpack_init_sharing__: (scope: string) => Promise<void>;
declare const __webpack_share_scopes__: { default: unknown };

interface FederationContainer {
  init(shareScope: unknown): Promise<void> | void;
  get(module: string): Promise<() => unknown>;
}

/**
 * Caching strategy (read this aloud):
 *
 * 1. manifest.local.json is served with `Cache-Control: no-cache` (see
 *    apps/shell/webpack.config.js devServer.headers) because it's the one
 *    thing a client must always revalidate - it's how a version bump gets
 *    discovered at all. If it were cached, nobody would see a new remote
 *    version without a hard refresh.
 * 2. remoteEntry.js gets the same `no-cache` treatment (see
 *    apps/operations-remote/webpack.config.js) for the identical reason:
 *    its filename is stable/non-hashed by design - consumers need a fixed
 *    URL to reference - so it can't rely on the URL changing to signal
 *    "this is new content." It has to be revalidated on every request.
 * 3. Everything remoteEntry.js references - its content-hashed chunk files
 *    (`chunkFilename: '[name].[contenthash:8].js'`) - gets
 *    `Cache-Control: public, max-age=31536000, immutable`. That's safe
 *    specifically because the filename encodes the content: a change in
 *    content always produces a new URL, so a cached URL can never go stale.
 * 4. scriptCache below is a separate, in-memory layer on top of all of
 *    that HTTP caching. It's keyed on `entryUrl@version`, not just
 *    `entryUrl`, so a manifest version bump - even one that reuses the
 *    same entryUrl - is treated as a cache miss. That triggers a fresh
 *    <script> injection, which (thanks to #2) always hits the network,
 *    gets the current code, and re-registers the federation container on
 *    `window[name]` - no full page reload required. Stale entries for
 *    superseded versions are left in the map rather than pruned: webpack's
 *    container registration overwrites `window[name]` regardless, so old
 *    entries are harmless dead weight, not a correctness risk. A longer-
 *    lived production tab would want to prune them.
 */
const scriptCache = new Map<string, Promise<void>>();

function cacheKey(descriptor: RemoteDescriptor): string {
  return `${descriptor.entryUrl}@${descriptor.version}`;
}

function loadRemoteEntryScript(descriptor: RemoteDescriptor): Promise<void> {
  const key = cacheKey(descriptor);
  const cached = scriptCache.get(key);
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

  scriptCache.set(key, promise);
  return promise;
}

/**
 * Diagnostic events for the demo-only load-progress indicator in
 * RemoteLoader.tsx (behind SHOW_LOAD_DIAGNOSTICS there). Purely observational
 * - nothing here affects the actual load/timeout/retry behavior.
 */
export type RemoteLoadDiagnosticEvent =
  | { stage: 'attempt-start'; attempt: number }
  | { stage: 'timeout'; attempt: number; timeoutMs: number }
  | { stage: 'retry-start' }
  | { stage: 'success'; attempt: number; durationMs: number }
  | { stage: 'failure'; attempt: number; error: string };

/**
 * Dynamically loads a federated remote by descriptor (not by a build-time
 * webpack `remotes` entry). Supports a configurable timeout, a single retry
 * on transient failure, and returns a load-result carrying version + duration
 * for observability.
 */
export async function loadRemoteModule<T>(
  descriptor: RemoteDescriptor,
  options: { timeoutMs?: number; retry?: boolean; onAttempt?: (event: RemoteLoadDiagnosticEvent) => void } = {}
): Promise<RemoteLoadResult<T>> {
  const { timeoutMs = 6000, retry = true, onAttempt } = options;
  const start = performance.now();

  const attempt = async (attemptNumber: number): Promise<T> => {
    onAttempt?.({ stage: 'attempt-start', attempt: attemptNumber });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        onAttempt?.({ stage: 'timeout', attempt: attemptNumber, timeoutMs });
        reject(new Error(`Remote "${descriptor.name}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);
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
    const module = await attempt(1);
    const durationMs = performance.now() - start;
    onAttempt?.({ stage: 'success', attempt: 1, durationMs });
    return { module, durationMs, version: descriptor.version };
  } catch (firstError) {
    if (!retry) {
      onAttempt?.({ stage: 'failure', attempt: 1, error: describeError(firstError) });
      throw firstError;
    }
    // Retry once only for likely-transient failures - avoid uncontrolled retry loops.
    onAttempt?.({ stage: 'retry-start' });
    try {
      const module = await attempt(2);
      const durationMs = performance.now() - start;
      onAttempt?.({ stage: 'success', attempt: 2, durationMs });
      return { module, durationMs, version: descriptor.version };
    } catch (secondError) {
      onAttempt?.({ stage: 'failure', attempt: 2, error: describeError(secondError) });
      throw secondError;
    }
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown remote load failure';
}
