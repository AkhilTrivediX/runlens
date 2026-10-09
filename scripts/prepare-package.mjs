import { cpSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sdkDist = resolve(root, "packages/sdk/dist");
const uiDir = resolve(sdkDist, "dashboard-ui");
if (dirname(uiDir) !== sdkDist) throw new Error("Dashboard assets must remain inside SDK dist.");
rmSync(uiDir, { recursive: true, force: true });
cpSync(resolve(root, "apps/dashboard/dist"), uiDir, { recursive: true });
cpSync(resolve(root, "LICENSE"), resolve(root, "packages/sdk/dist/LICENSE"));
