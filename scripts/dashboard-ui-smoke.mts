import { createRequire } from "node:module";
import { findChromePath } from "./browser/find-chrome.js";
import { createRunLens } from "../packages/sdk/dist/index.js";
import { startDashboard } from "../packages/sdk/dist/dashboard.js";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../examples/playwright-basic/package.json", import.meta.url),
);
const { chromium } = require("playwright");
const executablePath = findChromePath();
assert(
  executablePath,
  "Set RUNLENS_CHROME_PATH or install Chrome before running the UI check",
);
const temp = mkdtempSync(join(tmpdir(), "runlens-ui-"));
const dbPath = join(temp, "runlens.db");
const client = createRunLens({
  project: "ui-smoke",
  mode: "debugger",
  storage: { type: "sqlite", path: dbPath },
});
await client.startRun({
  name: "In progress",
  environment: { library: "playwright", browserEngine: "chromium" },
});
const success = await client.startRun({
  name: "Successful workflow",
  environment: { library: "playwright", browserEngine: "chromium" },
});
await success.step("Open homepage", async () => {});
await success.end();
const failure = await client.startRun({
  name: "Failed workflow",
  environment: { library: "playwright", browserEngine: "chromium" },
});
failure.attachPageContext({
  label: "ui-fixture",
  library: "playwright",
  screenshot: async () =>
    readFileSync(
      new URL("../apps/dashboard/public/runlens-logo.png", import.meta.url),
    ),
  getDomSnapshot: async () => "<html><body>UI smoke evidence</body></html>",
});
await failure.step("Open homepage", async () => {});
try {
  await failure.retry(
    "Click CTA",
    { attempts: 2, selector: "[data-testid=cta]", action: "click" },
    async () => {
      throw new Error("Waiting for selector [data-testid=cta] failed");
    },
  );
} catch {}
await failure.end();
await client.close();
const server = await startDashboard({ dbPath, port: 0 });
const browser = await chromium.launch({ executablePath, headless: true });
try {
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
    ["tablet", 1024, 900],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(server.url);
    await page.getByRole("tab", { name: /Execution trace/ }).waitFor();
    await page.locator(".waterfallRow").first().waitFor();

    const overflow = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert(overflow.scroll <= overflow.width, JSON.stringify(overflow));
    await page.getByRole("tab", { name: /Signals/ }).click();
    assert((await page.locator(".signalItem").count()) > 0);
    await page.getByRole("tab", { name: /Evidence/ }).click();
    await page.locator(".artifact").first().waitFor();
    assert((await page.locator(".artifact").count()) > 0);
    await page.getByRole("tab", { name: /Execution trace/ }).click();
    await page.locator(".waterfallRow").first().click();
    assert.equal(
      await page.locator(".stepFocusTitle h3").innerText(),
      "Open homepage",
    );
    await page
      .locator(".statusFilters")
      .getByRole("button", { name: /Passed/ })
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector(".ledgerRow .statusLabel")?.textContent ===
        "Passed",
    );
    assert.equal(
      await page.locator(".ledgerRow .statusLabel.failed").count(),
      0,
    );
    await page.getByRole("button", { name: /All runs/ }).click();
    await page
      .getByRole("textbox", { name: "Search runs" })
      .fill("does-not-exist-xyz");
    await page.getByRole("heading", { name: "No matching runs" }).waitFor();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await page
      .getByRole("button", { name: "Reliability", exact: true })
      .click();
    await page.getByRole("heading", { name: "Selector watchlist" }).waitFor();
    await page.locator(".failurePattern").first().click();
    await page.locator(".ledgerRow .statusLabel.failed").first().waitFor();
    assert.equal(
      await page.locator(".ledgerRow .statusLabel.passed").count(),
      0,
    );
    await page
      .getByRole("button", { name: "Follow runs", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Following runs", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await page
      .getByRole("button", { name: "Following runs", exact: true })
      .click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export trace" }).click();
    const download = await downloadPromise;
    assert(download.suggestedFilename().endsWith(".json"));
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({ name, overflow, interactions: "passed", errors }),
    );
    await page.close();
  }
  const empty = await browser.newPage();
  await empty.route("**/api/runs", (route) =>
    route.fulfill({ json: { runs: [] } }),
  );
  await empty.route("**/api/metrics", (route) =>
    route.fulfill({
      json: {
        metrics: {
          totalRuns: 0,
          passedRuns: 0,
          failedRuns: 0,
          successRate: 0,
          commonFailureClasses: [],
          slowestSteps: [],
          flakySelectors: [],
        },
      },
    }),
  );
  await empty.goto(server.url);
  await empty
    .getByRole("heading", { name: "Your first run starts here" })
    .waitFor();
  await empty.close();
  const recovery = await browser.newPage();
  await recovery.goto(server.url);
  await recovery.getByRole("tab", { name: /Execution trace/ }).waitFor();
  await recovery.route("**/api/metrics", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await recovery.getByRole("button", { name: "Refresh traces" }).click();
  await recovery.getByRole("alert").waitFor();
  await recovery.unroute("**/api/metrics");
  await recovery
    .getByRole("button", { name: "Try again", exact: true })
    .click();
  await recovery.getByRole("alert").waitFor({ state: "hidden" });
  await recovery.getByRole("tab", { name: /Execution trace/ }).focus();
  await recovery.keyboard.press("ArrowRight");
  assert.equal(
    await recovery
      .getByRole("tab", { name: /Signals/ })
      .getAttribute("aria-selected"),
    "true",
  );
  await recovery.keyboard.press("End");
  assert.equal(
    await recovery
      .getByRole("tab", { name: /Evidence/ })
      .getAttribute("aria-selected"),
    "true",
  );
  await recovery.close();
  console.log("Empty state, connection recovery and keyboard tabs passed.");
} finally {
  await browser.close();
  await server.close();
}
