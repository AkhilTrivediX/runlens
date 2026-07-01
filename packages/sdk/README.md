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

See the root README and `docs/` directory for adapter examples and dashboard usage.
