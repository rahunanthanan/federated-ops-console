# ADR-001: Module Federation instead of a modular monolith

## Status
Accepted (reference implementation).

## Context
The platform needs to be owned by multiple regional/domain teams (operations,
analytics, admin) that release on independent schedules, while presenting one
coherent product to end users. Two realistic options:

1. **Modular monolith** - a single SPA with route-level code-splitting, all domains
   built and deployed together from one repository/pipeline.
2. **Module Federation** - a shell host that loads independently built and deployed
   remotes at runtime.

## Decision
Use Webpack 5 Module Federation with a shell host and one or more remotes, each
independently buildable and deployable, communicating only through typed shared
packages (`@platform/contracts`, `@platform/events`) and the runtime remote manifest.

## Consequences

**Gains**
- A remote release does not require rebuilding or redeploying the shell or other
  remotes (verified in this repo: `npm run build:remote` and `npm run build:shell`
  are fully independent webpack builds).
- Runtime kill-switch: a broken or unwanted remote can be disabled via the manifest
  without a deploy (`AdminKillSwitch` in `apps/shell/src/App.tsx`).
- Failure isolation: a remote that fails to load or throws during render is caught
  by `RemoteLoader` / `ErrorBoundary` and shown as a domain-scoped fallback: the
  shell chrome (navigation, region switcher, sign-out) stays usable.
- Organisational fit: supports engineering standards adopted across multiple
  teams - the shell team owns the contract; domain teams own their remote's
  internals.

**Costs, named honestly**
- Runtime complexity: dynamic script loading, share-scope negotiation and version
  compatibility are real engineering surface area a modular monolith doesn't have.
  `loadRemote.ts` in this repo is ~70 lines that a modular monolith wouldn't need.
- Singleton dependency management: React/React-DOM must be shared as singletons
  (`shared: { react: { singleton: true } }`) or the app silently double-instantiates
  React, which manifests as broken hooks. This requires a documented supported-
  version policy across teams (see docs/architecture/overview.md).
- Harder local debugging: a bug can be "the shell", "the remote", or "the boundary
  between them" - contract/compatibility tests exist specifically to catch the
  third category early.

## Alternatives considered
- **iframe-based micro-frontends** - strongest isolation, but loses shared React
  context, harder cross-app navigation and UX consistency; rejected for an
  operations tool where shared design system and navigation matter.
- **Single-SPA / import-maps** - viable alternative to webpack Module Federation
  with similar runtime-composition properties; not chosen here mainly because
  Module Federation is the tooling this reference implementation is built to
  demonstrate.
