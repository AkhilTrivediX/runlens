import type { RunLensRun } from "../types.js";

export function fireAndForget(work: Promise<unknown>): void {
  void work.catch(() => {});
}

export function activeStepMetadata(run: RunLensRun): Record<string, unknown> {
  return { runId: run.id };
}

