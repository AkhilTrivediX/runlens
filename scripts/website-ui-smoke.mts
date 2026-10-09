import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";
import { findChromePath } from "./browser/find-chrome.js";
const require = createRequire(
  new URL("../examples/playwright-basic/package.json", import.meta.url),
);
const { chromium } = require("playwright");
const browser = await chromium.launch({
  executablePath: findChromePath(),
  headless: true,
});
const root = resolve("apps/website/dist");
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url || "/", "http://localhost").pathname;
  const file = resolve(
    root,
    "." + (pathname === "/" ? "/index.html" : pathname),
  );
  if (!file.startsWith(root + "/") && !file.startsWith(root + "\\")) {
    response.writeHead(403).end();
    return;
  }
  try {
    const content = await readFile(file);
    const mime: Record<string, string> = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".svg": "image/svg+xml",
      ".ttf": "font/ttf",
    };
    response
      .writeHead(200, {
        "Content-Type": mime[extname(file)] || "application/octet-stream",
      })
      .end(content);
  } catch {
    response.writeHead(404).end();
  }
});
if (!process.env.RUNLENS_WEBSITE_URL)
  await new Promise<void>((ready) => server.listen(0, "127.0.0.1", ready));
const address = server.address();
const url =
  process.env.RUNLENS_WEBSITE_URL ||
  `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
mkdirSync("lab/test-runs/ui", { recursive: true });
try {
  for (const [name, width, height] of [
    ["website-desktop", 1440, 1000],
    ["website-mobile", 390, 844],
    ["website-user", 660, 900],
    ["website-tablet", 1024, 900],
  ] as const) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(url, { waitUntil: "networkidle" });
    assert.equal(response?.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert(
      await page.evaluate(() =>
        [...document.fonts].some(
          (font) =>
            font.family.includes("Bricolage") && font.status === "loaded",
        ),
      ),
    );
    await page.getByRole("button", { name: /Open storefront/ }).click();
    assert.equal(
      await page.locator("#detail-status").textContent(),
      "Passed step",
    );
    const endpoint = await page
      .locator(".selected .timing")
      .evaluate(
        (lane: HTMLElement) =>
          parseFloat(getComputedStyle(lane, "::after").right) /
          lane.offsetWidth,
      );
    assert(
      Math.abs(endpoint - 0.87) < 0.02,
      "First step timing marker must end at 13%",
    );
    if (width === 1440)
      await page.screenshot({
        path: "lab/test-runs/ui/website-step-open.png",
        fullPage: true,
      });
    await page.getByRole("button", { name: /Add to basket/ }).click();
    assert.equal(await page.locator("#detail-kind").textContent(), "click");
    const secondEndpoint = await page
      .locator(".selected .timing")
      .evaluate(
        (lane: HTMLElement) =>
          parseFloat(getComputedStyle(lane, "::after").right) /
          lane.offsetWidth,
      );
    assert(
      Math.abs(secondEndpoint - 0.81) < 0.02,
      "Second step timing marker must end at 19%",
    );
    if (width === 1440)
      await page.screenshot({
        path: "lab/test-runs/ui/website-step-basket.png",
        fullPage: true,
      });
    await page.getByRole("button", { name: /Submit order/ }).click();
    assert.equal(
      await page.locator("#detail-kind").textContent(),
      "selector_missing",
    );
    await page.getByRole("link", { name: "Start tracing" }).click();
    assert(new URL(page.url()).hash === "#start");
    await page.getByRole("button", { name: "Copy setup commands" }).click();
    assert(
      (await page.evaluate(() => navigator.clipboard.readText())).includes(
        "pnpm start:dashboard",
      ),
    );
    await page.getByText("Can I install it from npm?", { exact: true }).click();
    assert.equal(await page.locator("details").nth(1).getAttribute("open"), "");
    await page.getByText("Can I install it from npm?", { exact: true }).click();
    await page.evaluate(() => {
      document.querySelector(".copy-status")!.textContent = "";
      window.scrollTo(0, 0);
    });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overflow at ${width}`,
    );
    assert(
      await page.evaluate(() =>
        [...document.images].every(
          (img) => img.complete && img.naturalWidth > 0,
        ),
      ),
      "Broken image",
    );
    assert.equal(errors.length, 0, errors.join("\n"));
    await page.screenshot({
      path: `lab/test-runs/ui/${name}.png`,
      fullPage: true,
    });
    await context.close();
  }
  console.log(
    "Landing page checks passed at 1440px, 390px, 660px and 1024px: font, trace selection, setup anchor, clipboard, FAQ, assets and overflow.",
  );
} finally {
  await browser.close();
  server.close();
}
