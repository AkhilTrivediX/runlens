import { cpSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
cpSync(resolve(root, "apps/dashboard/dist"), resolve(root, "packages/sdk/dist/dashboard-ui"), { recursive: true });
cpSync(resolve(root, "LICENSE"), resolve(root, "packages/sdk/dist/LICENSE"));
