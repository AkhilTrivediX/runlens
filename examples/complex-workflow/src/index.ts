import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { createRunLens } from "runlens";
import { instrumentPlaywrightPage } from "runlens/adapters/playwright";
import { startFixtureServer } from "../../../lab/fixtures/server.js";
import { findChromePath } from "../../../scripts/browser/find-chrome.js";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const outputDir = join(workspaceRoot, "lab", "test-runs");
const dbPath = join(outputDir, "runlens.db");

export async function runComplexWorkflow(): Promise<{ runId: string; dbPath: string; expectedFailure: string }> {
  mkdirSync(outputDir, { recursive: true });
  const executablePath = findChromePath();
  if (!executablePath) {
    throw new Error("No Chrome/Chromium executable found. Set RUNLENS_CHROME_PATH to run the complex workflow example.");
  }

  const fixture = await startFixtureServer();
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const trace = createRunLens({
    project: "complex-workflow",
    mode: "debugger",
    storage: { type: "sqlite", path: dbPath },
    artifactsDir: join(outputDir, "artifacts"),
    metadata: { owner: "examples", intent: "intentional-failure" }
  });
  const run = await trace.startRun({
    name: "complex-login-like-flow",
    tags: ["example", "retry", "intentional-failure"],
    environment: { library: "playwright", browserEngine: "chromium" }
  });
  const instrumentation = instrumentPlaywrightPage(page, run);
  let expectedFailure: string | undefined;

  try {
    await run.step("Open homepage", async () => {
      await page.goto(`${fixture.url}/`, { waitUntil: "networkidle" });
      await page.waitForSelector("[data-testid=heading]");
    });

    await run.step(
      "Open form",
      async () => {
        await page.click("[data-testid=cta]");
        await page.waitForSelector("[data-testid=email]");
      },
      { selector: "[data-testid=cta]", action: "click" }
    );

    await run.step("Fill login-like form", async () => {
      await page.fill("[data-testid=email]", "workflow@example.com");
      await page.fill("[data-testid=company]", "RunLens Reliability Team");
      await page.click("[data-testid=submit]");
      await page.waitForSelector("[data-testid=done]");
    });

    await run.step("Detect challenge state", async () => {
      await page.goto(`${fixture.url}/challenge`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("iframe[title='turnstile challenge']");
      await run.event("captcha_detected", { reason: "turnstile iframe visible", action: "label_only" });
      await run.mark("manual_review_required", { reason: "challenge page visible" });
    });

    await run.retry(
      "Click post-review action",
      { attempts: 2, delayMs: 100, selector: "[data-testid=post-review-action]", action: "click" },
      async () => {
        await page.click("[data-testid=post-review-action]", { timeout: 500 });
      }
    );

    throw new Error("Expected the complex workflow to fail on the missing post-review action.");
  } catch (error) {
    expectedFailure = error instanceof Error ? error.message : String(error);
    await run.end("failed");
  } finally {
    instrumentation.detach();
    await context.close();
    await browser.close();
    await fixture.close();
    await trace.close();
  }

  if (!expectedFailure) {
    throw new Error("Complex workflow did not produce the expected failure.");
  }

  return { runId: run.id, dbPath, expectedFailure };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runComplexWorkflow();
  console.log(`Complex workflow trace created: ${result.runId}`);
  console.log(`Expected failure: ${result.expectedFailure}`);
  console.log(`Trace database: ${result.dbPath}`);
}

