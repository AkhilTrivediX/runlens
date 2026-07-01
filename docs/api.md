# SDK API

## `createRunLens(options)`

Creates a tracing client.

```ts
const trace = createRunLens({
  project: "example",
  mode: "debugger",
  storage: { type: "sqlite", path: ".runlens/runlens.db" },
  artifactsDir: ".runlens/artifacts"
});
```

## `trace.startRun(input)`

Starts a run and returns a run session.

```ts
const run = await trace.startRun({
  name: "lead-extraction-flow",
  tags: ["nightly"],
  metadata: { owner: "growth" }
});
```

## `run.step(name, fn, input?)`

Records a named step. Errors are rethrown after RunLens captures context.

```ts
await run.step("Click CTA", () => page.click("[data-testid=cta]"), {
  selector: "[data-testid=cta]",
  action: "click"
});
```

## Adapters

```ts
import { instrumentPuppeteerPage } from "runlens/adapters/puppeteer";
import { instrumentPlaywrightPage } from "runlens/adapters/playwright";
```

Adapters attach passive listeners for console errors, page errors, navigation, failed requests, HTTP error responses, screenshots, URL/title, DOM snapshots, and environment metadata.

