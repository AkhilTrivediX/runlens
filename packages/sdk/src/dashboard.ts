import { createReadStream, existsSync, realpathSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createTraceStorage, type TraceStorage } from "@runlens/core";

function sendJson(response: ServerResponse, body: unknown, status = 200): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function within(root: string, path: string): boolean {
  const value = relative(root, path);
  return value !== ".." && !value.startsWith("../") && !value.startsWith("..\\") && !isAbsolute(value);
}

function mimeType(path: string): string {
  return ({ ".png": "image/png", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json" } as Record<string, string>)[extname(path)] ?? "application/octet-stream";
}

function sendFile(response: ServerResponse, path: string): void {
  response.writeHead(200, { "content-type": mimeType(path), "x-content-type-options": "nosniff" });
  const stream = createReadStream(path);
  stream.on("error", () => response.destroy());
  stream.pipe(response);
}

export function createDashboardApi(databasePath: string) {
  const dbPath = resolve(databasePath);
  const traceRoot = dirname(dbPath);
  let storagePromise: Promise<TraceStorage> | undefined;
  async function storage(): Promise<TraceStorage> {
    storagePromise ??= (async () => {
      const store = createTraceStorage({ type: "sqlite", path: dbPath });
      await store.init();
      return store;
    })();
    return await storagePromise;
  }
  return {
    async handle(request: IncomingMessage, response: ServerResponse): Promise<boolean> {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (!url.pathname.startsWith("/api/")) return false;
      try {
        if (request.method !== "GET") {
          sendJson(response, { error: "Method not allowed" }, 405);
        } else if (url.pathname === "/api/health") {
          await storage();
          sendJson(response, { ok: true, dbPath, exists: existsSync(dbPath) });
        } else if (url.pathname === "/api/runs") {
          sendJson(response, { runs: await (await storage()).listRuns({ limit: 100 }) });
        } else if (url.pathname === "/api/metrics") {
          sendJson(response, { metrics: await (await storage()).getMetrics() });
        } else if (url.pathname.startsWith("/api/runs/")) {
          const trace = await (await storage()).getRunTrace(decodeURIComponent(url.pathname.slice("/api/runs/".length)));
          sendJson(response, trace ? { trace } : { error: "Run not found" }, trace ? 200 : 404);
        } else if (url.pathname === "/api/artifact") {
          const artifactPath = url.searchParams.get("path");
          if (!artifactPath) {
            sendJson(response, { error: "Missing artifact path" }, 400);
          } else {
            const path = resolve(artifactPath);
            if (!within(traceRoot, path) || !existsSync(path) || !statSync(path).isFile() || !within(realpathSync(traceRoot), realpathSync(path))) {
              sendJson(response, { error: "Artifact not found" }, 404);
            } else {
              sendFile(response, path);
            }
          }
        } else {
          sendJson(response, { error: "Not found" }, 404);
        }
      } catch (error) {
        sendJson(response, { error: error instanceof Error ? error.message : String(error) }, 500);
      }
      return true;
    },
    async close(): Promise<void> {
      if (storagePromise) await (await storagePromise).close?.();
    }
  };
}

export interface DashboardOptions {
  dbPath: string;
  port?: number;
  assetsDir?: string;
}

export async function startDashboard(options: DashboardOptions) {
  const assetsDir = resolve(options.assetsDir ?? fileURLToPath(new URL("./dashboard-ui/", import.meta.url)));
  if (!existsSync(resolve(assetsDir, "index.html"))) {
    throw new Error("Dashboard assets are missing. Pack the SDK or run pnpm build followed by node scripts/prepare-package.mjs.");
  }
  const api = createDashboardApi(options.dbPath);
  const server = createServer((request, response) => {
    void (async () => {
      if (await api.handle(request, response)) return;
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const path = resolve(assetsDir, url.pathname === "/" ? "index.html" : `.${decodeURIComponent(url.pathname)}`);
      if (!within(assetsDir, path) || !existsSync(path) || !statSync(path).isFile() || !within(realpathSync(assetsDir), realpathSync(path))) {
        sendJson(response, { error: "Not found" }, 404);
        return;
      }
      sendFile(response, path);
    })().catch((error) => {
      if (!response.headersSent) sendJson(response, { error: error instanceof Error ? error.message : String(error) }, 500);
      else response.destroy();
    });
  });
  await new Promise<void>((accept, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 5173, "127.0.0.1", () => { server.off("error", reject); accept(); });
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : options.port;
  return {
    url: `http://127.0.0.1:${port}`,
    async close(): Promise<void> {
      await new Promise<void>((accept, reject) => server.close((error) => error ? reject(error) : accept()));
      await api.close();
    }
  };
}
