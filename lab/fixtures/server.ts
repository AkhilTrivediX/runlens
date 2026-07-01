import { createServer, type Server, type ServerResponse } from "node:http";

export interface FixtureServer {
  url: string;
  close(): Promise<void>;
}

export async function startFixtureServer(): Promise<FixtureServer> {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");

    if (url.pathname === "/") {
      sendHtml(
        response,
        `<!doctype html>
        <html>
          <head><title>RunLens Fixture Home</title></head>
          <body>
            <main>
              <h1 data-testid="heading">RunLens Fixture</h1>
              <a data-testid="cta" href="/form">Start workflow</a>
              <img alt="" src="/missing-image.png" />
            </main>
            <script>
              console.error("fixture console error: analytics token missing");
              fetch("/api/fail").catch(() => {});
            </script>
          </body>
        </html>`
      );
      return;
    }

    if (url.pathname === "/form") {
      sendHtml(
        response,
        `<!doctype html>
        <html>
          <head><title>RunLens Fixture Form</title></head>
          <body>
            <form action="/done" method="get">
              <label>Email <input data-testid="email" name="email" /></label>
              <label>Company <input data-testid="company" name="company" /></label>
              <button data-testid="submit" type="submit">Submit</button>
            </form>
          </body>
        </html>`
      );
      return;
    }

    if (url.pathname === "/done") {
      sendHtml(
        response,
        `<!doctype html>
        <html>
          <head><title>RunLens Fixture Done</title></head>
          <body>
            <h1 data-testid="done">Workflow complete</h1>
          </body>
        </html>`
      );
      return;
    }

    if (url.pathname === "/challenge") {
      sendHtml(
        response,
        `<!doctype html>
        <html>
          <head><title>Verify you are human</title></head>
          <body>
            <iframe title="turnstile challenge"></iframe>
            <p>Manual review required.</p>
          </body>
        </html>`
      );
      return;
    }

    if (url.pathname === "/api/fail") {
      response.writeHead(503, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "fixture backend unavailable" }));
      return;
    }

    response.writeHead(404, { "content-type": "text/plain" });
    response.end("not found");
  });

  await listen(server);
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Fixture server did not bind to a TCP port.");
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

function sendHtml(response: ServerResponse, html: string): void {
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(html);
}

function listen(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
}
