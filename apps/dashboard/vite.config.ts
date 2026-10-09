import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createDashboardApi } from "runlens/dashboard";
import { defineConfig, type Plugin, type ViteDevServer, type PreviewServer } from "vite";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function runlensApiPlugin(): Plugin {
  function install(server: ViteDevServer | PreviewServer) {
    const api = createDashboardApi(process.env.RUNLENS_DB ?? resolve(workspaceRoot, "lab/test-runs/runlens.db"));
    server.middlewares.use((request, response, next) => {
      void api.handle(request, response).then((handled) => { if (!handled) next(); }).catch(next);
    });
    server.httpServer?.once("close", () => { void api.close().catch(console.error); });
  }
  return { name: "runlens-api", configureServer: install, configurePreviewServer: install };
}

export default defineConfig({ plugins: [react(), runlensApiPlugin()], server: { port: 5173 } });
