# runlens

The public TypeScript SDK for RunLens browser automation observability.

```ts
import { createRunLens } from "runlens";

const trace = createRunLens({
  project: "example",
  mode: "silent",
  storage: { type: "sqlite", path: ".runlens/runlens.db" }
});
```

## Adapters

```ts
import { instrumentPuppeteerPage } from "runlens/adapters/puppeteer";
import { instrumentPlaywrightPage } from "runlens/adapters/playwright";
```

## CLI

```bash
runlens doctor --db .runlens/runlens.db
runlens list --db .runlens/runlens.db
runlens inspect --db .runlens/runlens.db
runlens export --db .runlens/runlens.db --out runlens-export.json
```

Requires Node 22 (22.13+) or Node 24+. Node 24 is recommended.

The package includes the core runtime and a local dashboard. Start it with:

```bash
runlens dashboard --db .runlens/runlens.db --port 5173
```

Open `http://127.0.0.1:5173` to inspect your traces.

See the repository README and `docs/` directory for adapter examples.
