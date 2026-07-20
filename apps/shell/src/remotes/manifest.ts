import type { RemoteManifest } from '@platform/contracts';

/**
 * Loads the runtime remote manifest for the current environment. Local dev
 * reads public/manifest.local.json; a real deployment would point this at an
 * environment-specific manifest URL served/controlled by the release pipeline,
 * updated through a controlled approval process.
 */
export async function loadManifest(): Promise<RemoteManifest> {
  const response = await fetch('/manifest.local.json');
  if (!response.ok) {
    throw new Error(`Failed to load remote manifest: ${response.status}`);
  }
  const data = (await response.json()) as { remotes: RemoteManifest };
  return data.remotes;
}
