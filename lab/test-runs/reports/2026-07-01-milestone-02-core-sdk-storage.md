# Milestone 02: Core Schema, SDK Lifecycle, and Local Storage

- Date/time: 2026-07-01T16:42:57.1071844+05:30
- Commit hash: recorded in git history after this report is committed
- Scope: shared trace records, rule-based failure classification, storage interface, memory storage, SQLite storage, SDK run/step lifecycle, events, marks, retries, artifacts, and passive adapter entrypoints.

## Commands run

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm smoke
```

## Result

Pass.

## Important failures

- TypeScript initially rejected direct casts from Node SQLite row records to typed rows. Fixed with explicit storage-boundary casts.
- SDK imports originally triggered Node's SQLite experimental warning in memory-only tests. Fixed by lazy-loading SQLite through the storage factory.

## Known caveats

- Direct SQLite tests still show Node 24's `ExperimentalWarning` for `node:sqlite`. Runtime users only hit that path when using SQLite storage.

## Artifacts

- Unit SQLite database: `lab/test-runs/unit/core-storage.db`
- Package builds: `packages/core/dist`, `packages/sdk/dist`

