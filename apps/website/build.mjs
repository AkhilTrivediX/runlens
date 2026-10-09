import { cpSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL(".", import.meta.url));
mkdirSync(`${root}dist`, { recursive: true });
for (const file of ["index.html", "src"])
  cpSync(`${root}${file}`, `${root}dist/${file}`, { recursive: true });
cpSync(`${root}public`, `${root}dist`, { recursive: true });
console.log("RunLens landing page built in apps/website/dist");
