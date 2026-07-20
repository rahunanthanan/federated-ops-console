# Architecture overview

## Context

```
Browser
 |
 +-- Shell (host, port 3000)
 |    +-- Authentication adapter (mock, @platform/auth)
 |    +-- Region provider (SG / MY / HK, validated runtime config)
 |    +-- Runtime remote manifest loader (public/manifest.local.json)
 |    +-- RemoteLoader (dynamic script injection + timeout/retry/error boundary)
 |    +-- Observability bootstrap (mock, @platform/observability)
 |
 +-- Operations Remote (port 3001, exposes "./App")
 |    +-- Schema-driven service-request form (discriminated union + Zod)
 |    +-- Own state, own API calls, own audit history
 |
 +-- Shared packages (packages/*)
      +-- platform-contracts   - types only, zero runtime deps
      +-- platform-auth        - mock AuthClient
      +-- platform-http        - typed HTTP client, error mapping, correlation IDs
      +-- platform-events      - typed pub/sub EventBus
      +-- platform-observability - mock ObservabilityClient
      +-- design-system        - Button / Card / Banner / tokens
```

## Boundary rule

The shell never imports `apps/operations-remote/src/**` directly, and the reverse is
also true. The only sanctioned communication paths are:

1. **Module Federation** - the shell loads the remote's single exposed module (`./App`)
   at runtime, resolved from `manifest.local.json`, never from a build-time `remotes` map.
2. **`@platform/contracts`** - shared types both sides compile against.
3. **`@platform/events`** - a typed event bus for cross-cutting notifications
   (region changes, request-created, remote-load/failure).

This is enforced today by convention + the `no-restricted-imports` rule in the root
`.eslintrc.cjs`; a production repo would add `eslint-plugin-boundaries` or a Nx module
boundary rule so it's a CI gate, not a convention.

## Why runtime remote resolution, not build-time `remotes`

`apps/shell/webpack.config.js` registers `ModuleFederationPlugin` with an **empty**
`remotes` object. The plugin is still required on the host because it sets up the
webpack share scope (`__webpack_share_scopes__`) that a dynamically loaded remote
attaches to. The actual remote URL, version and enabled/disabled flag come from
`apps/shell/src/remotes/manifest.ts`, which fetches `manifest.local.json` at runtime.

This means:

- A new remote version can be shipped and the manifest updated **without rebuilding
  the shell** - this is the entire point of runtime remote resolution, rather
  than just running two React apps side by side.
- The admin kill-switch in the shell (`AdminKillSwitch` in `App.tsx`) can flip
  `enabled: false` and the `RemoteLoader` will unmount/never mount the remote,
  without a deploy.

See `apps/shell/src/remotes/loadRemote.ts` for the implementation: it injects a
`<script>` tag for `entryUrl`, calls `container.init(shareScope)`, then
`container.get(exposedModule)`, with a configurable timeout and a single retry.

## Known scope trade-offs in this MVP

These are deliberate simplifications made to keep the reference buildable end-to-end
in a short timeframe. Worth naming explicitly rather than pretending they don't exist:

- **Per-remote client instances.** `apps/operations-remote/src/App.tsx` creates its
  own `EventBus`/`ObservabilityClient` instances rather than receiving a shared
  singleton from the shell, because the current `RemoteLoader` renders
  `<Component />` with no injected props. A production version would expose a second
  federated module (e.g. `./platformRuntime`) or pass a prop-based runtime context at
  mount time so shell and remote genuinely share one event bus instance.
- **Mocked network layer.** `apps/operations-remote/src/api/mockHttp.ts` intercepts
  `window.fetch` for `/service-requests` rather than calling a real backend, so the
  project runs without infrastructure. `@platform/http`'s timeout/correlation/error-
  mapping behaviour is still real and contract-tested.
- **Two remotes, not four.** Only `operations` is implemented; `analytics` and
  `admin` were planned but not built, to keep the MVP scoped to what's
  demoable end-to-end.
- **No CSP/CI pipeline files.** Security headers and CI/CD are not
  implemented as actual pipeline config in this pass.
