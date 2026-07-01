import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createId } from "../id.js";
import { nowIso } from "../time.js";
import { SqliteTraceStorage } from "./sqlite.js";

describe("SqliteTraceStorage", () => {
  it("stores runs, steps, issues, artifacts, events, and metrics", async () => {
    const dbPath = resolve(process.cwd(), "../../lab/test-runs/unit/core-storage.db");
    rmSync(dbPath, { force: true });
    const storage = new SqliteTraceStorage(dbPath);
    await storage.init();

    const runId = createId("run");
    const stepId = createId("step");

    await storage.createRun({
      id: runId,
      project: "unit",
      name: "storage-test",
      mode: "silent",
      status: "failed",
      schemaVersion: "0.1.0",
      startedAt: nowIso(),
      endedAt: nowIso(),
      durationMs: 42,
      tags: ["test"],
      metadata: {},
      environment: { library: "custom" },
      failureClass: "selector_missing",
      failureMessage: "missing selector"
    });
    await storage.createStep({
      id: stepId,
      runId,
      name: "Click CTA",
      status: "failed",
      startedAt: nowIso(),
      endedAt: nowIso(),
      durationMs: 12,
      selector: "[data-testid=cta]",
      action: "click",
      metadata: {},
      failureClass: "selector_missing",
      failureMessage: "missing selector"
    });
    await storage.addIssue({
      id: createId("issue"),
      runId,
      stepId,
      type: "automation_error",
      severity: "error",
      message: "missing selector",
      timestamp: nowIso(),
      failureClass: "selector_missing",
      metadata: {}
    });

    const trace = await storage.getRunTrace(runId);
    const metrics = await storage.getMetrics();

    expect(trace?.run.name).toBe("storage-test");
    expect(trace?.steps).toHaveLength(1);
    expect(trace?.issues[0]?.failureClass).toBe("selector_missing");
    expect(metrics.totalRuns).toBe(1);
    expect(metrics.commonFailureClasses[0]).toEqual({ failureClass: "selector_missing", count: 1 });

    await storage.close?.();
  });
});

