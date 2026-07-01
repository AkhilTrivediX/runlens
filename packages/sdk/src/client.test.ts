import { MemoryTraceStorage } from "@runlens/core";
import { describe, expect, it } from "vitest";
import { createRunLens } from "./client.js";

describe("createRunLens", () => {
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

