import { MemoryTraceStorage } from "@runlens/core";
import { describe, expect, it } from "vitest";
import { createRunLens } from "./client.js";

describe("createRunLens", () => {
  it.each(["silent", "debugger"] as const)("preserves automation errors when artifacts fail in %s mode", async (mode) => {
    const storage = new MemoryTraceStorage();
    const client = createRunLens({ project: "unit", mode, storage });
    const run = await client.startRun({ name: "closed-page" });
    run.attachPageContext({
      label: "closed-page",
      library: "playwright",
      screenshot: async () => { throw new Error("Page closed during screenshot"); },
      getDomSnapshot: async () => { throw new Error("Page closed during DOM capture"); }
    });
    const original = new Error("Original automation failure");
    await expect(run.step("Fail", async () => { throw original; })).rejects.toBe(original);
    await run.end();
    const trace = await storage.getRunTrace(run.id);
    expect(trace?.run.status).toBe("failed");
    expect(trace?.run.failureMessage).toBe(original.message);
    expect(trace?.steps[0].status).toBe("failed");
    expect(trace?.events.filter((event) => event.type === "artifact_capture_failed")).toHaveLength(mode === "debugger" ? 2 : 1);
    await client.close();
  });

  it("keeps successful steps passed when automatic screenshots fail", async () => {
    const storage = new MemoryTraceStorage();
    const client = createRunLens({ project: "unit", mode: "debugger", storage });
    const run = await client.startRun({ name: "screenshot-unavailable" });
    run.attachPageContext({ label: "closed-page", library: "playwright", screenshot: async () => { throw new Error("Page closed"); } });
    await expect(run.step("Success", async () => "result")).resolves.toBe("result");
    await run.end();
    const trace = await storage.getRunTrace(run.id);
    expect(trace?.run.status).toBe("passed");
    expect(trace?.steps[0].status).toBe("passed");
    expect(trace?.issues).toHaveLength(0);
    await client.close();
  });

  it("records passed and failed steps", async () => {
    const storage = new MemoryTraceStorage();
    const client = createRunLens({ project: "unit", mode: "silent", storage });
    const run = await client.startRun({ name: "sdk-test" });

    await run.step("Open page", async () => "ok");
    await expect(
      run.step(
        "Click CTA",
        async () => {
          throw new Error("Waiting for selector [data-testid=cta] failed");
        },
        { selector: "[data-testid=cta]", action: "click" }
      )
    ).rejects.toThrow("Waiting for selector");
    await run.end();

    const trace = await storage.getRunTrace(run.id);
    expect(trace?.run.status).toBe("failed");
    expect(trace?.steps.map((step) => step.status)).toEqual(["passed", "failed"]);
    expect(trace?.issues[0]?.failureClass).toBe("selector_missing");
  });
});

