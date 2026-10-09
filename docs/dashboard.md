# Dashboard

## Packaged dashboard

The installed SDK includes a dashboard server and its built assets:

```bash
runlens dashboard --db .runlens/runlens.db --port 5173
```

Open `http://127.0.0.1:5173`. The server listens on the local machine. Use `--port 0` to choose an available port. Press Ctrl+C to close the server.

For a repository checkout, run `pnpm build` then `pnpm start:dashboard`.

## Development dashboard

Run the local dashboard:

```bash
pnpm dev:dashboard
```

The packaged server, development server and Vite preview share these API routes:

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

