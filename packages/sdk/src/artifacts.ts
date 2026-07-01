import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createId, nowIso, type TraceArtifactRecord } from "@runlens/core";

export function writeArtifact(input: {
  artifactsDir: string;
  runId: string;
  stepId?: string;
  type: TraceArtifactRecord["type"];
  label: string;
  extension: string;
  mimeType: string;
  data: Buffer | Uint8Array | string;
  metadata?: Record<string, unknown>;
}): TraceArtifactRecord {
  const runDir = join(input.artifactsDir, input.runId);
  mkdirSync(runDir, { recursive: true });

  const fileName = `${new Date().toISOString().replaceAll(":", "-")}-${safeName(input.label)}.${input.extension}`;
  const path = join(runDir, fileName);
  writeFileSync(path, input.data);

  return {
    id: createId("artifact"),
    runId: input.runId,
    stepId: input.stepId,
    type: input.type,
    label: input.label,
    path,
    mimeType: input.mimeType,
    createdAt: nowIso(),
    metadata: input.metadata ?? {}
  };
}

function safeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

