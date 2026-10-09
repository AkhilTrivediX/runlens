import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nodeDir = dirname(process.execPath);
const npmCli = [
  join(nodeDir, "node_modules/npm/bin/npm-cli.js"),
  resolve(nodeDir, "../lib/node_modules/npm/bin/npm-cli.js")
].find(existsSync);
assert(npmCli, "npm must be installed alongside Node to run the release check");
const consumer = mkdtempSync(join(tmpdir(), "runlens-release-"));
function npm(args, cwd) {
  execFileSync(process.execPath, [npmCli, ...args], { cwd, stdio: "inherit", timeout: 120_000 });
}

npm(["pack", "--pack-destination", consumer], join(root, "packages/sdk"));
const tarball = readdirSync(consumer).find((file) => file.endsWith(".tgz"));
assert(tarball, "pack must produce a tarball");
writeFileSync(join(consumer, "package.json"), JSON.stringify({ name: "runlens-release-consumer", private: true, type: "module" }));
npm(["install", join(consumer, tarball), "--offline", "--ignore-scripts", "--no-audit", "--no-fund"], consumer);

// All imports below resolve from the isolated consumer, outside the monorepo.
writeFileSync(join(consumer, "check.mjs"), `
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRunLens } from "runlens";
import { instrumentPlaywrightPage } from "runlens/adapters/playwright";
import { instrumentPuppeteerPage } from "runlens/adapters/puppeteer";
import { startDashboard } from "runlens/dashboard";
assert.equal(typeof instrumentPlaywrightPage, "function");
assert.equal(typeof instrumentPuppeteerPage, "function");
const installed = resolve("node_modules/runlens");
const packageJson = JSON.parse(readFileSync(resolve(installed, "package.json"), "utf8"));
assert.equal(Object.keys(packageJson.dependencies ?? {}).length, 0);
assert.equal(packageJson.author.email, "akhiltrivedix@gmail.com");
assert.equal(packageJson.bin.runlens, "dist/cli.js");
assert(existsSync(resolve("node_modules/.bin/runlens" + (process.platform === "win32" ? ".cmd" : ""))), "Installed CLI shim must exist");
process.chdir(mkdtempSync(resolve("verification-")));
const dbPath = resolve("traces/runlens.db");
const trace = createRunLens({ project: "release", storage: { type: "sqlite", path: dbPath } });
const run = await trace.startRun({ name: "installed-sdk" });
await run.step("Success", async () => "ok");
await run.end();
await trace.close();
const doctor = JSON.parse(execFileSync(process.execPath, [resolve(installed, "dist/cli.js"), "doctor", "--db", dbPath, "--json"], { encoding: "utf8" }));
assert.equal(doctor.totalRuns, 1);
assert.equal(doctor.ok, true);
mkdirSync("traces/artifacts", { recursive: true });
writeFileSync("traces/artifacts/example.png", "artifact-check");
mkdirSync("traces-sibling", { recursive: true });
writeFileSync("traces-sibling/private.txt", "must-not-be-served");
const dashboard = await startDashboard({ dbPath, port: 0 });
try {
  const get = (path) => fetch(dashboard.url + path, { signal: AbortSignal.timeout(10000) });
  const health = await (await get("/api/health")).json();
  assert.equal(health.ok, true);
  const runs = await (await get("/api/runs")).json();
  assert.equal(runs.runs[0].id, run.id);
  const detail = await (await get("/api/runs/" + run.id)).json();
  assert.equal(detail.trace.steps[0].status, "passed");
  const metrics = await (await get("/api/metrics")).json();
  assert.equal(metrics.metrics.totalRuns, 1);
  assert.equal((await get("/api/unknown")).status, 404);
  assert.equal((await get("/api/runs/missing")).status, 404);
  const artifact = await get("/api/artifact?path=" + encodeURIComponent(resolve("traces/artifacts/example.png")));
  assert.equal(await artifact.text(), "artifact-check");
  const sibling = await get("/api/artifact?path=" + encodeURIComponent(resolve("traces-sibling/private.txt")));
  assert.equal(sibling.status, 404);
  const index = await get("/");
  assert.match(index.headers.get("content-type"), /text\\/html/);
  const html = await index.text();
  const asset = html.match(/src="([^"]+\\.js)"/)[1];
  const js = await get(asset);
  assert.equal(js.status, 200);
  assert.match(js.headers.get("content-type"), /javascript/);
  assert.equal((await get("/runlens-logo.png")).status, 200);
  assert.equal((await get("/missing.js")).status, 404);
} finally {
  await dashboard.close();
}
const cli = spawn(process.execPath, [resolve(installed, "dist/cli.js"), "dashboard", "--db", dbPath, "--port", "0"], { stdio: ["ignore", "pipe", "pipe"] });
try {
  const url = await new Promise((accept, reject) => {
    const timeout = setTimeout(() => reject(new Error("CLI dashboard startup timed out")), 10000);
    let output = "";
    cli.on("error", (error) => { clearTimeout(timeout); reject(error); });
    cli.on("exit", (code) => { clearTimeout(timeout); reject(new Error("CLI exited before readiness: " + code)); });
    cli.stdout.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/http:\\/\\/127\\.0\\.0\\.1:\\d+/);
      if (match) { clearTimeout(timeout); accept(match[0]); }
    });
  });
  const response = await fetch(url + "/api/runs", { signal: AbortSignal.timeout(10000) });
  assert.equal((await response.json()).runs[0].id, run.id);
} finally {
  const exited = new Promise((accept) => cli.once("exit", accept));
  if (cli.exitCode === null && cli.signalCode === null) { cli.kill(); await exited; }
}
console.log("Installed SDK, adapters, CLI, SQLite and production dashboard passed.");
`);
execFileSync(process.execPath, [join(consumer, "check.mjs")], { cwd: consumer, stdio: "inherit", timeout: 30_000 });

writeFileSync(join(consumer, "check.ts"), `
import { createRunLens } from "runlens";
import { instrumentPlaywrightPage } from "runlens/adapters/playwright";
import { instrumentPuppeteerPage } from "runlens/adapters/puppeteer";
import { startDashboard } from "runlens/dashboard";
const client = createRunLens({ project: "consumer", storage: { type: "sqlite", path: "trace.db" } });
const run = await client.startRun({ name: "types" });
const value: number = await run.step("value", async () => 42);
void [value, instrumentPlaywrightPage, instrumentPuppeteerPage, startDashboard];
`);
execFileSync(process.execPath, [join(root, "node_modules/typescript/bin/tsc"), "--noEmit", "--strict", "--module", "NodeNext", "--moduleResolution", "NodeNext", "--target", "ES2022", "--typeRoots", join(root, "node_modules/@types"), join(consumer, "check.ts")], { cwd: consumer, stdio: "inherit", timeout: 30_000 });
console.log(`Release checks passed. Isolated package and results: ${consumer}`);
