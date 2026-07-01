# Getting Started

RunLens currently ships as a monorepo with a publishable SDK package named `runlens`.

## Try it locally

```bash
git clone https://github.com/AkhilTrivediX/runlens.git
cd runlens
pnpm install
pnpm build
pnpm test:puppeteer
pnpm test:playwright
pnpm test:complex
pnpm dev:dashboard
```

Open `http://127.0.0.1:5173`.

## Use the SDK in a project before npm release

Build a local package tarball:

```bash
pnpm --filter runlens build
pnpm --filter runlens pack --pack-destination ../../dist-packages
```

Install the tarball in your project:

```bash
pnpm add ../runlens/dist-packages/runlens-0.0.0.tgz
```

## Instrument Playwright

```ts
import { chromium } from "playwright";
import { createRunLens } from "runlens";
import { instrumentPlaywrightPage } from "runlens/adapters/playwright";

const browser = await chromium.launch();
const page = await browser.newPage();

const trace = createRunLens({
  project: "my-project",
  mode: "debugger",
  storage: { type: "sqlite", path: ".runlens/runlens.db" }
});

const run = await trace.startRun({ name: "checkout-flow" });
instrumentPlaywrightPage(page, run);

try {
  await run.step("Open checkout", () => page.goto("https://example.com/checkout"));
  await run.step("Submit form", () => page.click("[data-testid=submit]"), {
    selector: "[data-testid=submit]",
    action: "click"
  });
  await run.end();
} catch (error) {
  await run.end("failed");
  throw error;
} finally {
  await browser.close();
  await trace.close();
}
```

## Inspect traces with the CLI

```bash
runlens doctor --db .runlens/runlens.db
runlens list --db .runlens/runlens.db
runlens inspect --db .runlens/runlens.db
runlens export --db .runlens/runlens.db --out runlens-export.json
```

