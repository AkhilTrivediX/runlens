# Dashboard

## Packaged dashboard

The installed SDK includes a dashboard server and its built assets:

```bash
runlens dashboard --db .runlens/runlens.db --port 5173
```

Open `http://127.0.0.1:5173`. The server listens on the local machine. Use `--port 0` to choose an available port. Press Ctrl+C to close the server.

For a repository checkout, run `pnpm build` then `pnpm start:dashboard`.

## Investigate a run

The run explorer connects the run ledger to an execution waterfall and captured browser evidence.

1. Filter the ledger by status or project. Search matches run names, projects, IDs and failure classes.
2. Select a run. A failed run opens with its first failed step selected.
3. Select a step in the waterfall to inspect its selector, error, events and evidence. Bar positions and lengths reflect recorded timing.
4. Open Signals for recorded issues. Open Evidence for screenshots and other captured files. Expand an event to inspect its full payload.
5. Export trace downloads the selected trace as JSON. Artifact paths are metadata. Open evidence files separately to retrieve their contents.

Workspace health and Reliability use all stored runs. The ledger, project filters and history use the 100 most recent runs returned by the API. Filtering does not change the workspace health totals.

Refresh traces manually or enable Follow runs to refresh every 10 seconds. Press `/` to focus search. Use arrow keys within the inspector tabs.

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

