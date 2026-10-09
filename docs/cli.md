# CLI

The `runlens` package exposes a small CLI for local trace stores.

```bash
runlens doctor --db .runlens/runlens.db
runlens list --db .runlens/runlens.db
runlens inspect --db .runlens/runlens.db
runlens export --db .runlens/runlens.db --out runlens-export.json
runlens dashboard --db .runlens/runlens.db --port 5173
```

## Commands

- `doctor`: checks that the SQLite trace store can be opened and prints summary metrics.
- `list`: prints recent runs.
- `inspect`: prints a selected run, or the latest run when no id is provided.
- `export`: writes all runs, metrics, events, issues, and artifacts metadata to JSON.
- `dashboard`: serves the packaged dashboard and API at `http://127.0.0.1:5173`. Use `--port` to change the port.

## Environment

Set `RUNLENS_DB` to avoid passing `--db` repeatedly.

```bash
RUNLENS_DB=.runlens/runlens.db runlens list
```

