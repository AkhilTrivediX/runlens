import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const testRunsPath = join(process.cwd(), "lab", "test-runs");

if (existsSync(testRunsPath)) {
  rmSync(testRunsPath, { recursive: true, force: true });
}

console.log("Removed generated trace outputs under lab/test-runs.");

