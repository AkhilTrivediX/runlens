import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredPaths = [
  "packages/sdk",
  "packages/core",
  "apps/dashboard",
  "examples/puppeteer-basic",
  "examples/playwright-basic",
  "examples/complex-workflow",
  "lab/test-runs",
  "lab/fixtures",
  "docs",
  "scripts",
  ".github/workflows"
];

const missing = requiredPaths.filter((path) => !existsSync(join(root, path)));

if (missing.length > 0) {
  console.error(`RunLens scaffold is missing required paths:\n${missing.join("\n")}`);
  process.exit(1);
}

const sdkPackage = JSON.parse(readFileSync(join(root, "packages/sdk/package.json"), "utf8")) as {
  name?: string;
};

if (sdkPackage.name !== "runlens") {
  console.error(`Expected packages/sdk package name to be "runlens", got "${sdkPackage.name}"`);
  process.exit(1);
}

console.log("RunLens scaffold smoke test passed.");

