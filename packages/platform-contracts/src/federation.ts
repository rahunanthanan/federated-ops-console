/** Runtime remote manifest contract - resolved at runtime, never hard-coded at build time. */
export interface RemoteDescriptor {
  name: string;
  entryUrl: string;
  exposedModule: string;
  version: string;
  integrity?: string;
  enabled: boolean;
}

export interface RemoteLoadResult<T> {
  module: T;
  durationMs: number;
  version: string;
}

export type RemoteManifest = RemoteDescriptor[];
