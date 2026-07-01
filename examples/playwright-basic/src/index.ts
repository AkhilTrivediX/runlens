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

export async function runPlaywrightBasic(): Promise<{ runId: string; dbPath: string }> {
  mkdirSync(outputDir, { recursive: true });
  const executablePath = findChromePath();
  if (!executablePath) {
    throw new Error("No Chrome/Chromium executable found. Set RUNLENS_CHROME_PATH to run the Playwright example.");
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
    project: "playwright-basic",
    mode: "debugger",
    storage: { type: "sqlite", path: dbPath },
    artifactsDir: join(outputDir, "artifacts")
  });
  const run = await trace.startRun({
    name: "playwright-basic-local-fixture",
    tags: ["example", "playwright"],
    environment: { library: "playwright", browserEngine: "chromium" }
  });
  const instrumentation = instrumentPlaywrightPage(page, run);

  try {
    await run.step("Open fixture homepage", async () => {
      await page.goto(`${fixture.url}/`, { waitUntil: "networkidle" });
      await page.waitForSelector("[data-testid=heading]");
    });

    await run.step(
      "Click CTA",
      async () => {
        await page.click("[data-testid=cta]");
        await page.waitForSelector("[data-testid=email]");
      },
      { selector: "[data-testid=cta]", action: "click" }
    );

    await run.step("Submit form", async () => {
      await page.fill("[data-testid=email]", "dev@example.com");
      await page.fill("[data-testid=company]", "RunLens Labs");
      await page.click("[data-testid=submit]");
      await page.waitForSelector("[data-testid=done]");
    });

    await run.end();
    return { runId: run.id, dbPath };
  } catch (error) {
    await run.end("failed");
    throw error;
  } finally {
    instrumentation.detach();
    await context.close();
    await browser.close();
    await fixture.close();
    await trace.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runPlaywrightBasic();
  console.log(`Playwright trace created: ${result.runId}`);
  console.log(`Trace database: ${result.dbPath}`);
}

