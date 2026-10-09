import { cpSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "packages/sdk/dist");
cpSync(join(root, "packages/core/dist"), join(dist, "core"), { recursive: true });

function rewrite(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "core") rewrite(path);
    } else if (entry.name.endsWith(".js") || entry.name.endsWith(".d.ts")) {
      let target = relative(dirname(path), join(dist, "core/index.js")).replaceAll("\\", "/");
      if (!target.startsWith(".")) target = `./${target}`;
      writeFileSync(path, readFileSync(path, "utf8").replaceAll('"@runlens/core"', JSON.stringify(target)));
    }
  }
}
rewrite(dist);
