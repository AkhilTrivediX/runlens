# Dashboard

Run the local dashboard:

```bash
pnpm dev:dashboard
```

The development dashboard exposes local API routes through Vite middleware:

- `/api/health`
- `/api/runs`
- `/api/runs/:id`
- `/api/metrics`
- `/api/artifact?path=...`

The default database is `lab/test-runs/runlens.db`. Set `RUNLENS_DB` to inspect another trace store.

```bash
RUNLENS_DB=.runlens/runlens.db pnpm dev:dashboard
```

Smoke check a running dashboard:

```bash
RUNLENS_MIN_RUNS=3 pnpm test:dashboard
```

