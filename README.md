# Federated Ops Console

A runnable Module Federation reference project. `apps/shell` (host) dynamically
loads `apps/operations-remote` at runtime via Webpack 5 Module Federation, with
strict TypeScript contracts, a schema-driven form, remote failure isolation,
and a runtime kill switch.

## Why this exists

This is a personal learning project — a hands-on way to actually build a
shell-and-remotes micro-frontend architecture instead of just reading about
one. It's real, runnable code (`npm run` and click through it), covering the
parts of Module Federation that are easy to skip in a tutorial: a runtime
remote manifest instead of build-time config, timeout-and-retry on remote
load, failure isolation so one broken remote doesn't take the whole app down,
a runtime kill switch, and a strict, discriminated-union-driven form schema.

## Quick start

```bash
npm install
npm run start        # shell on :3000, operations remote on :3001 (concurrently)
```

Open http://localhost:3000. Switch the region selector, submit a service
request, then use the "Disable remote" button in the Platform health card to
see the shell survive a remote outage.

Other useful scripts:

```bash
npm run build          # production build of both the remote and the shell
npm run typecheck      # strict TS across every package/app (0 errors)
npm run test           # jest: contract + component tests
npm run test:e2e       # playwright smoke journey (run `npx playwright install` first)
```

## Where each part lives

| Area | Where to look |
|---|---|
| Strict TypeScript patterns | `packages/platform-contracts/src` (discriminated unions, generics), `apps/operations-remote/src/forms/SchemaForm.tsx` (exhaustive union switch via `assertNever`), `tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`) |
| Runtime remote loading | `apps/shell/src/remotes/loadRemote.ts` + `RemoteLoader.tsx` (runtime manifest, timeout, single retry, error isolation, kill switch) |
| Shared SDKs / platform contracts | `packages/platform-http`, `platform-events`, `platform-observability`, `platform-auth` — each with a typed public API and (for http/events) contract tests |
| Multi-region config | `apps/shell/src/region/regions.ts` + `RegionContext.tsx` — SG/MY/HK config drives currency, approval threshold and feature flags, no per-country `if` branches in components |
| Build tooling | Webpack 5 + `ModuleFederationPlugin` in both `apps/shell/webpack.config.js` and `apps/operations-remote/webpack.config.js` |
| Engineering conventions | `.eslintrc.cjs` (boundary-enforcing `no-restricted-imports`), `docs/adr/ADR-001-...md`, `docs/architecture/overview.md` |
| Observability | `packages/platform-observability` — every remote load/failure and form submission records a span/metric/error |

## What this app actually is

A regional frontend platform, not a single React app. The shell owns
authentication, region configuration and remote orchestration; the
operations domain is an independently buildable, independently deployable
remote loaded at runtime — not through a build-time `remotes` map, but from
a JSON manifest, which is what lets you ship a remote without rebuilding
the shell. Most of the effort went into the boring-but-critical parts:
timeout-and-retry-once on remote load, an error boundary so one remote
crashing doesn't take down the shell, a runtime kill switch, and strict
TypeScript with a discriminated-union schema form so adding a new field
type is a compile error everywhere it's not handled.

## Honest scope notes

This is an MVP slice, not a complete platform. `docs/architecture/overview.md`
names the trade-offs explicitly: per-remote client instances instead of a shared
singleton, a mocked network layer, only one remote built, and no CI/CD YAML yet.

## Repo layout

```
apps/shell/               Module Federation host (port 3000)
apps/operations-remote/   Module Federation remote (port 3001)
packages/platform-*/      Shared typed contracts, HTTP client, event bus, observability
packages/design-system/   Shared UI primitives (Button, Card, Banner, tokens)
docs/architecture/        Architecture overview + boundary rules
docs/adr/                 ADR-001: Module Federation vs modular monolith
e2e/                      Playwright smoke journey
```
