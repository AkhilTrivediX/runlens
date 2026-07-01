#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createTraceStorage, type RunTrace } from "@runlens/core";

interface CliOptions {
  command: string;
  args: string[];
  dbPath: string;
  json: boolean;
  out?: string;
}

const options = parseArgs(process.argv.slice(2));

main(options).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main(input: CliOptions): Promise<void> {
  if (input.command === "help" || input.command === "--help" || input.command === "-h") {
    printHelp();
    return;
  }

  const storage = createTraceStorage({ type: "sqlite", path: input.dbPath });
  await storage.init();

  try {
    if (input.command === "doctor") {
      const runs = await storage.listRuns({ limit: 1_000 });
      const metrics = await storage.getMetrics();
      output(input, {
        ok: true,
        dbPath: input.dbPath,
        totalRuns: metrics.totalRuns,
        successRate: metrics.successRate,
        latestRun: runs[0]?.name ?? null
      });
      return;
    }

    if (input.command === "list") {
      const runs = await storage.listRuns({ limit: Number(input.args[0] ?? "25") });
      output(
        input,
        runs.map((run) => ({
          id: run.id,
          project: run.project,
          name: run.name,
          status: run.status,
          durationMs: run.durationMs,
          failureClass: run.failureClass,
          startedAt: run.startedAt
        }))
      );
      return;
    }

    if (input.command === "inspect") {
      const runId = input.args[0] ?? (await storage.listRuns({ limit: 1 }))[0]?.id;
      if (!runId) {
        throw new Error("No run id provided and no runs exist in the trace store.");
      }

      const trace = await storage.getRunTrace(runId);
      if (!trace) {
        throw new Error(`Run not found: ${runId}`);
      }

      output(input, summarizeTrace(trace));
      return;
    }

    if (input.command === "export") {
      const runs = await storage.listRuns({ limit: 10_000 });
      const traces = await Promise.all(runs.map((run) => storage.getRunTrace(run.id)));
      const payload = {
        exportedAt: new Date().toISOString(),
        dbPath: input.dbPath,
        metrics: await storage.getMetrics(),
        traces: traces.filter(Boolean)
      };

      if (!input.out) {
        output(input, payload);
        return;
      }

      const outPath = resolve(input.out);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, JSON.stringify(payload, null, 2));
      console.log(`Exported ${payload.traces.length} traces to ${outPath}`);
      return;
    }

    throw new Error(`Unknown command "${input.command}". Run "runlens help".`);
  } finally {
    await storage.close?.();
  }
}

function parseArgs(args: string[]): CliOptions {
  let dbPath = process.env.RUNLENS_DB ?? ".runlens/runlens.db";
  let out: string | undefined;
  let json = false;
  const commandArgs: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--db") {
      dbPath = args[index + 1] ?? dbPath;
      index += 1;
      continue;
    }

    if (arg === "--out") {
      out = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--json") {
      json = true;
      continue;
    }

    commandArgs.push(arg);
  }

  return {
    command: commandArgs[0] ?? "help",
    args: commandArgs.slice(1),
    dbPath: resolve(dbPath),
    json,
    out
  };
}

function output(options: CliOptions, value: unknown): void {
  if (options.json) {
    console.log(JSON.stringify(value, null, 2));
    return;
  }

  if (Array.isArray(value)) {
    console.table(value);
    return;
  }

  console.log(JSON.stringify(value, null, 2));
}

function summarizeTrace(trace: RunTrace) {
  return {
    run: {
      id: trace.run.id,
      project: trace.run.project,
      name: trace.run.name,
      status: trace.run.status,
      durationMs: trace.run.durationMs,
      mode: trace.run.mode,
      failureClass: trace.run.failureClass,
      failureMessage: trace.run.failureMessage
    },
    counts: {
      steps: trace.steps.length,
      events: trace.events.length,
      issues: trace.issues.length,
      artifacts: trace.artifacts.length
    },
    failedSteps: trace.steps
      .filter((step) => step.status === "failed")
      .map((step) => ({
        name: step.name,
        selector: step.selector,
        failureClass: step.failureClass,
        failureMessage: step.failureMessage
      })),
    topIssues: trace.issues.slice(0, 8).map((issue) => ({
      type: issue.type,
      severity: issue.severity,
      failureClass: issue.failureClass,
      message: issue.message
    }))
  };
}

function printHelp(): void {
  console.log(`RunLens CLI

Usage:
  runlens doctor --db .runlens/runlens.db
  runlens list --db .runlens/runlens.db [limit]
  runlens inspect --db .runlens/runlens.db [runId]
  runlens export --db .runlens/runlens.db --out runlens-export.json

Options:
  --db <path>    SQLite trace database path. Defaults to RUNLENS_DB or .runlens/runlens.db.
  --json         Print JSON for list/inspect/doctor output.
  --out <path>   Export destination for "export".
`);
}
