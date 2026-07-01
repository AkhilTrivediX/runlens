# Clean Examples

## Minimal custom workflow

```ts
import { createRunLens } from "runlens";

const trace = createRunLens({
  project: "custom-worker",
  mode: "silent",
  storage: { type: "sqlite", path: ".runlens/runlens.db" }
});

const run = await trace.startRun({ name: "nightly-browser-job" });

try {
  await run.step("Fetch input", async () => {
    // Load job data.
  });

  await run.step("Run browser action", async () => {
    // Call your automation code.
  });

  await run.end();
} catch (error) {
  await run.end("failed");
  throw error;
} finally {
  await trace.close();
}
```

## Manual marks

```ts
await run.event("captcha_detected", { reason: "turnstile iframe visible" });
await run.mark("manual_review_required");
```

These calls only record observable state. They do not bypass challenges.

## Retry with evidence

```ts
await run.retry(
  "Click CTA",
  { attempts: 3, delayMs: 250, selector: "[data-testid=cta]", action: "click" },
  async () => {
    await page.click("[data-testid=cta]");
  }
);
```

