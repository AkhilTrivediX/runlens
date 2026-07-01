import { classifyFailure } from "@runlens/core";
import type { PageContextProvider, RunLensRun } from "../types.js";
import { fireAndForget } from "./shared.js";

type Listener = (...args: unknown[]) => void;

interface PlaywrightPageLike {
  on(event: string, listener: Listener): unknown;
  off?(event: string, listener: Listener): unknown;
  url(): string;
  title(): Promise<string>;
  content(): Promise<string>;
  screenshot(options?: Record<string, unknown>): Promise<Buffer | Uint8Array>;
  context?(): {
    browser?(): {
      browserType?(): { name(): string };
      version?(): string;
    } | null;
  };
}

interface PlaywrightConsoleMessageLike {
  type(): string;
  text(): string;
  location(): Record<string, unknown>;
}

interface PlaywrightRequestLike {
  url(): string;
  method(): string;
  resourceType(): string;
  failure(): { errorText: string } | null;
}

interface PlaywrightResponseLike {
  url(): string;
  status(): number;
  request(): PlaywrightRequestLike;
}

interface PlaywrightFrameLike {
  url(): string;
}

export interface PlaywrightInstrumentation {
  detach(): void;
}

export function instrumentPlaywrightPage(page: PlaywrightPageLike, run: RunLensRun): PlaywrightInstrumentation {
  const provider: PageContextProvider = {
    label: "playwright-page",
    library: "playwright",
    getUrl: () => page.url(),
    getTitle: () => page.title(),
    getDomSnapshot: () => page.content(),
    getEnvironment: () => ({
      library: "playwright",
      browserEngine: (page.context?.().browser?.()?.browserType?.().name() as "chromium" | "firefox" | "webkit" | undefined) ?? "unknown",
      browserVersion: page.context?.().browser?.()?.version?.()
    }),
    screenshot: () => page.screenshot({ type: "png", fullPage: true })
  };
  const detachContext = run.attachPageContext(provider);

  const onConsole = (message: unknown) => {
    const consoleMessage = message as PlaywrightConsoleMessageLike;
    const type = consoleMessage.type();
    const text = consoleMessage.text();
    fireAndForget(
      run.event("console", {
        library: "playwright",
        type,
        text,
        location: consoleMessage.location()
      })
    );

    if (type === "error") {
      fireAndForget(
        run.issue({
          type: "console_error",
          severity: "error",
          message: text,
          url: page.url(),
          failureClass: classifyFailure({ message: text, url: page.url(), eventType: "console_error" }),
          metadata: { library: "playwright", location: consoleMessage.location() }
        })
      );
    }
  };

  const onPageError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    fireAndForget(
      run.issue({
        type: "page_error",
        severity: "error",
        message,
        url: page.url(),
        failureClass: classifyFailure({ error, url: page.url(), eventType: "page_error" }),
        metadata: { library: "playwright" }
      })
    );
  };

  const onRequestFailed = (request: unknown) => {
    const req = request as PlaywrightRequestLike;
    const failure = req.failure();
    fireAndForget(
      run.issue({
        type: "network_failure",
        severity: "error",
        message: failure?.errorText ?? `Request failed: ${req.url()}`,
        url: req.url(),
        failureClass: "network_failure",
        metadata: {
          library: "playwright",
          method: req.method(),
          resourceType: req.resourceType(),
          failure
        }
      })
    );
  };

  const onResponse = (response: unknown) => {
    const res = response as PlaywrightResponseLike;
    const status = res.status();
    if (status < 400) {
      return;
    }

    fireAndForget(
      run.issue({
        type: "network_failure",
        severity: status >= 500 ? "error" : "warning",
        message: `HTTP ${status}: ${res.url()}`,
        url: res.url(),
        failureClass: classifyFailure({ statusCode: status, url: res.url(), eventType: "response" }),
        metadata: {
          library: "playwright",
          status,
          method: res.request().method(),
          resourceType: res.request().resourceType()
        }
      })
    );
  };

  const onFrameNavigated = (frame: unknown) => {
    fireAndForget(run.event("navigation", { library: "playwright", url: (frame as PlaywrightFrameLike).url() }));
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);
  page.on("response", onResponse);
  page.on("framenavigated", onFrameNavigated);

  return {
    detach() {
      page.off?.("console", onConsole);
      page.off?.("pageerror", onPageError);
      page.off?.("requestfailed", onRequestFailed);
      page.off?.("response", onResponse);
      page.off?.("framenavigated", onFrameNavigated);
      detachContext();
    }
  };
}

export const attachPlaywrightPage = instrumentPlaywrightPage;

