# Usage

RunLens is designed to fit around existing browser automation code with minimal changes.

```ts
import { createRunLens } from "runlens";

const trace = createRunLens({
  project: "example",
  mode: "silent",
  storage: { type: "sqlite", path: ".runlens/runlens.db" }
});

const run = await trace.startRun({ name: "daily-scrape" });

await run.step("Open page", async () => {
  await page.goto("https://example.com");
});

await run.end();
await trace.close();
```

## Modes

- `silent`: records run/step lifecycle, errors, console/page/network issues, and screenshots on failure.
- `debugger`: additionally records screenshots after each step and DOM snapshots on failure.

## Manual Events

```ts
await run.event("captcha_detected", { reason: "turnstile iframe visible" });
await run.mark("manual_review_required");
```

These APIs only label observable state. They do not bypass or solve challenges.

## Retries

```ts
await run.retry(
  "Click CTA",
  { attempts: 3, delayMs: 250, selector: "[data-testid=cta]", action: "click" },
  async () => {
    await page.click("[data-testid=cta]");
  }
);
```

Each failed attempt is captured as a step and retry event. Only the final failed attempt marks the run failed.

