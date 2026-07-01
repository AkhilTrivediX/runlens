import react from "@vitejs/plugin-react";
import { createReadStream, existsSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createTraceStorage, type TraceStorage } from "@runlens/core";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";

const dashboardDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(dashboardDir, "../..");
const dbPath = process.env.RUNLENS_DB ?? resolve(workspaceRoot, "lab/test-runs/runlens.db");
const traceRoot = dirname(dbPath);

export default defineConfig({
  plugins: [react(), runlensApiPlugin()],
  server: {
    port: 5173
  }
});

function runlensApiPlugin(): Plugin {
  let storagePromise: Promise<TraceStorage> | undefined;

  async function storage(): Promise<TraceStorage> {
    storagePromise ??= Promise.resolve().then(async () => {
      const store = createTraceStorage({ type: "sqlite", path: dbPath });
      await store.init();
      return store;
    });
    return await storagePromise;
  }

  return {
    name: "runlens-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (request: IncomingMessage, response: ServerResponse, next: (error?: unknown) => void) => {
        if (!request.url) {
          next();
          return;
        }

        const url = new URL(request.url, "http://runlens.local");
        if (!url.pathname.startsWith("/api/")) {
          next();
          return;
        }

        try {
          if (url.pathname === "/api/health") {
            sendJson(response, { ok: true, dbPath, exists: existsSync(dbPath) });
            return;
          }

          if (url.pathname === "/api/runs") {
            sendJson(response, { runs: await (await storage()).listRuns({ limit: 100 }) });
            return;
          }

          if (url.pathname === "/api/metrics") {
            sendJson(response, { metrics: await (await storage()).getMetrics() });
            return;
          }

          if (url.pathname.startsWith("/api/runs/")) {
            const runId = decodeURIComponent(url.pathname.replace("/api/runs/", ""));
            const trace = await (await storage()).getRunTrace(runId);
            if (!trace) {
              sendJson(response, { error: "Run not found" }, 404);
              return;
            }
            sendJson(response, { trace });
            return;
          }

          if (url.pathname === "/api/artifact") {
            const artifactPath = url.searchParams.get("path");
            if (!artifactPath) {
              sendJson(response, { error: "Missing artifact path" }, 400);
              return;
            }

            const absolutePath = resolve(artifactPath);
            if (!absolutePath.startsWith(resolve(traceRoot)) || !existsSync(absolutePath)) {
              sendJson(response, { error: "Artifact not found" }, 404);
              return;
            }

            response.statusCode = 200;
            response.setHeader("content-type", mimeTypeFor(absolutePath));
            createReadStream(absolutePath).pipe(response);
            return;
          }

          sendJson(response, { error: "Not found" }, 404);
        } catch (error) {
          sendJson(
            response,
            {
              error: error instanceof Error ? error.message : String(error)
            },
            500
          );
        }
      });
    }
  };
}

function sendJson(response: ServerResponse, body: unknown, status = 200): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function mimeTypeFor(path: string): string {
  switch (extname(path)) {
    case ".png":
      return "image/png";
    case ".html":
      return "text/html; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}
