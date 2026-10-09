import { dirname, join } from "node:path";
import {
  TRACE_SCHEMA_VERSION,
  classifyFailure,
  createId,
  createTraceStorage,
  durationMs,
  nowIso,
  serializeError,
  type EnvironmentInfo,
  type FailureClass,
  type RunStatus,
  type StepInput,
  type TraceIssueRecord,
  type TraceRunRecord,
  type TraceStepRecord,
  type TraceStorage
} from "@runlens/core";
import { writeArtifact } from "./artifacts.js";
import type {
  IssueInput,
  PageContextProvider,
  PageContextSnapshot,
  RetryOptions,
  RunLensClient,
  RunLensOptions,
  RunLensRun,
  StepExecutionOptions
} from "./types.js";

export function createRunLens(options: RunLensOptions): RunLensClient {
  return new DefaultRunLensClient(options);
}

class DefaultRunLensClient implements RunLensClient {
  readonly schemaVersion = TRACE_SCHEMA_VERSION;
  private readonly storage: TraceStorage;
  private readonly artifactsDir: string;
  private initPromise?: Promise<void>;

  constructor(private readonly options: RunLensOptions) {
    this.storage = isTraceStorage(options.storage) ? options.storage : createTraceStorage(options.storage ?? { type: "memory" });
    this.artifactsDir = options.artifactsDir ?? defaultArtifactsDir(options);
  }

  async startRun(input: Parameters<RunLensClient["startRun"]>[0]): Promise<RunLensRun> {
    await this.ensureInit();

    const startedAt = nowIso();
    const run: TraceRunRecord = {
      id: createId("run"),
      project: this.options.project,
      name: input.name,
      mode: this.options.mode ?? "silent",
      status: "running",
      schemaVersion: TRACE_SCHEMA_VERSION,
      startedAt,
      tags: input.tags ?? [],
      metadata: { ...(this.options.metadata ?? {}), ...(input.metadata ?? {}) },
      environment: { runtime: `node ${process.version}`, os: process.platform, ...(this.options.environment ?? {}), ...(input.environment ?? {}) }
    };

    await this.storage.createRun(run);
    await this.storage.addEvent({
      id: createId("event"),
      runId: run.id,
      type: "run_started",
      timestamp: startedAt,
      payload: { name: run.name, project: run.project, mode: run.mode }
    });

    return new DefaultRunSession(run, this.storage, this.artifactsDir);
  }

  async close(): Promise<void> {
    await this.storage.close?.();
  }

  private async ensureInit(): Promise<void> {
    this.initPromise ??= this.storage.init();
    await this.initPromise;
  }
}

class DefaultRunSession implements RunLensRun {
  readonly id: string;
  private status: RunStatus = "running";
  private ended = false;
  private activeStepId?: string;
  private readonly contexts = new Set<PageContextProvider>();

  constructor(
    private readonly run: TraceRunRecord,
    readonly storage: TraceStorage,
    private readonly artifactsDir: string
  ) {
    this.id = run.id;
  }

  async step<T>(name: string, fn: () => Promise<T>, input: StepInput = {}): Promise<T> {
    return await this.executeStep(name, fn, { ...input, failRunOnError: true });
  }

  async retry<T>(name: string, options: RetryOptions, fn: (attempt: number) => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
      try {
        return await this.executeStep(name, () => fn(attempt), {
          ...options,
          attempt,
          maxAttempts: options.attempts,
          failRunOnError: attempt === options.attempts
        });
      } catch (error) {
        lastError = error;
        await this.event("retry_attempt_failed", {
          name,
          attempt,
          attempts: options.attempts,
          error: serializeError(error)
        });

        if (attempt < options.attempts && options.delayMs) {
          await sleep(options.delayMs);
        }
      }
    }

    throw lastError;
  }

  async event(type: string, payload: Record<string, unknown> = {}): Promise<void> {
    await this.storage.addEvent({
      id: createId("event"),
      runId: this.id,
      stepId: this.activeStepId,
      type,
      timestamp: nowIso(),
      payload
    });

    const classification = classifyFailure({ eventType: type, message: JSON.stringify(payload), metadata: payload });
    if (classification === "blocked_or_challenge_page" && type !== "issue_recorded") {
      await this.issue({
        type: "classification",
        severity: "warning",
        message: `Detected possible challenge state from event "${type}".`,
        failureClass: classification,
        metadata: payload
      });
    }
  }

  async mark(name: string, payload: Record<string, unknown> = {}): Promise<void> {
    await this.event("mark", { name, ...payload });

    const failureClass = classifyFailure({ eventType: name, message: name, metadata: payload });
    await this.issue({
      type: "manual_mark",
      severity: failureClass === "unknown" ? "info" : "warning",
      message: name,
      failureClass: failureClass === "unknown" ? undefined : failureClass,
      metadata: payload
    });
  }

  async issue(input: IssueInput): Promise<void> {
    const issue: TraceIssueRecord = {
      id: createId("issue"),
      runId: this.id,
      stepId: input.stepId ?? this.activeStepId,
      type: input.type ?? "automation_error",
      severity: input.severity ?? "error",
      message: input.message,
      timestamp: nowIso(),
      url: input.url,
      failureClass: input.failureClass,
      metadata: input.metadata ?? {}
    };

    await this.storage.addIssue(issue);
    await this.storage.addEvent({
      id: createId("event"),
      runId: this.id,
      stepId: issue.stepId,
      type: "issue_recorded",
      timestamp: issue.timestamp,
      payload: {
        issueId: issue.id,
        issueType: issue.type,
        severity: issue.severity,
        message: issue.message,
        failureClass: issue.failureClass
      }
    });
  }

  attachPageContext(provider: PageContextProvider): () => void {
    this.contexts.add(provider);
    void this.event("page_context_attached", {
      label: provider.label,
      library: provider.library
    });

    return () => {
      this.contexts.delete(provider);
    };
  }

  async captureScreenshot(label: string, stepId?: string): Promise<string | undefined> {
    const context = [...this.contexts].find((provider) => provider.screenshot);
    if (!context?.screenshot) {
      return undefined;
    }

    const artifact = writeArtifact({
      artifactsDir: this.artifactsDir,
      runId: this.id,
      stepId: stepId ?? this.activeStepId,
      type: "screenshot",
      label,
      extension: "png",
      mimeType: "image/png",
      data: await context.screenshot(),
      metadata: { provider: context.label, library: context.library }
    });

    await this.storage.addArtifact(artifact);
    return artifact.path;
  }

  async end(status?: Exclude<RunStatus, "running">): Promise<void> {
    if (this.ended) {
      return;
    }

    this.ended = true;
    const endedAt = nowIso();
    const finalStatus = status ?? (this.status === "running" ? "passed" : this.status);
    this.status = finalStatus;

    await this.storage.updateRun(this.id, {
      status: finalStatus,
      endedAt,
      durationMs: durationMs(this.run.startedAt, endedAt)
    });
    await this.storage.addEvent({
      id: createId("event"),
      runId: this.id,
      type: "run_ended",
      timestamp: endedAt,
      payload: { status: finalStatus }
    });
  }

  private async executeStep<T>(name: string, fn: () => Promise<T>, input: StepExecutionOptions): Promise<T> {
    const startedAt = nowIso();
    const step: TraceStepRecord = {
      id: createId("step"),
      runId: this.id,
      name,
      status: "running",
      startedAt,
      selector: input.selector,
      action: input.action,
      attempt: input.attempt,
      maxAttempts: input.maxAttempts,
      metadata: input.metadata ?? {}
    };

    await this.storage.createStep(step);
    await this.storage.addEvent({
      id: createId("event"),
      runId: this.id,
      stepId: step.id,
      type: "step_started",
      timestamp: startedAt,
      payload: { name, selector: input.selector, action: input.action, attempt: input.attempt, maxAttempts: input.maxAttempts }
    });

    const previousStepId = this.activeStepId;
    this.activeStepId = step.id;

    try {
      const result = await fn();
      const endedAt = nowIso();
      await this.storage.updateStep(step.id, {
        status: "passed",
        endedAt,
        durationMs: durationMs(startedAt, endedAt)
      });
      await this.storage.addEvent({
        id: createId("event"),
        runId: this.id,
        stepId: step.id,
        type: "step_passed",
        timestamp: endedAt,
        payload: { name }
      });

      if (this.run.mode === "debugger") {
        await this.captureArtifactSafely("screenshot", () => this.captureScreenshot(`${name} after`, step.id));
      }

      return result;
    } catch (error) {
      const endedAt = nowIso();
      const context = await this.captureFailureContext();
      const serialized = serializeError(error);
      const failureClass = classifyFailure({
        error,
        message: serialized.message,
        url: context.url,
        title: context.title,
        html: this.run.mode === "debugger" ? context.html : undefined,
        metadata: step.metadata
      });

      await this.storage.updateStep(step.id, {
        status: "failed",
        endedAt,
        durationMs: durationMs(startedAt, endedAt),
        error: serialized,
        failureClass,
        failureMessage: serialized.message
      });
      await this.issue({
        type: "automation_error",
        severity: "error",
        message: serialized.message,
        stepId: step.id,
        url: context.url,
        failureClass,
        metadata: {
          error: serialized,
          context,
          selector: input.selector,
          action: input.action,
          attempt: input.attempt
        }
      });
      await this.storage.addEvent({
        id: createId("event"),
        runId: this.id,
        stepId: step.id,
        type: "step_failed",
        timestamp: endedAt,
        payload: {
          name,
          failureClass,
          error: serialized,
          context
        }
      });

      if (input.failRunOnError) {
        await this.failRun(failureClass, serialized.message);
      }

      await this.captureArtifactSafely("screenshot", () => this.captureScreenshot(`${name} failure`, step.id));
      if (this.run.mode === "debugger") {
        await this.captureArtifactSafely("dom_snapshot", () => this.captureDomSnapshot(`${name} dom`, step.id));
      }

      throw error;
    } finally {
      this.activeStepId = previousStepId;
    }
  }

  private async captureArtifactSafely(type: string, capture: () => Promise<unknown>): Promise<void> {
    try {
      await capture();
    } catch (error) {
      await this.event("artifact_capture_failed", { type, error: serializeError(error) }).catch(() => {});
    }
  }

  private async failRun(failureClass: FailureClass, failureMessage: string): Promise<void> {
    this.status = "failed";
    await this.storage.updateRun(this.id, {
      status: "failed",
      failureClass,
      failureMessage
    });
  }

  private async captureDomSnapshot(label: string, stepId?: string): Promise<string | undefined> {
    const context = [...this.contexts].find((provider) => provider.getDomSnapshot);
    if (!context?.getDomSnapshot) {
      return undefined;
    }

    const artifact = writeArtifact({
      artifactsDir: this.artifactsDir,
      runId: this.id,
      stepId,
      type: "dom_snapshot",
      label,
      extension: "html",
      mimeType: "text/html",
      data: await context.getDomSnapshot(),
      metadata: { provider: context.label, library: context.library }
    });

    await this.storage.addArtifact(artifact);
    return artifact.path;
  }

  private async captureFailureContext(): Promise<PageContextSnapshot> {
    const provider = [...this.contexts][0];
    if (!provider) {
      return {};
    }

    return {
      label: provider.label,
      library: provider.library,
      url: await safeRead(provider.getUrl),
      title: await safeRead(provider.getTitle),
      html: this.run.mode === "debugger" ? await safeRead(provider.getDomSnapshot) : undefined,
      environment: await safeRead(provider.getEnvironment)
    };
  }
}

function isTraceStorage(value: unknown): value is TraceStorage {
  return Boolean(value && typeof value === "object" && "createRun" in value && "listRuns" in value);
}

function defaultArtifactsDir(options: RunLensOptions): string {
  if (options.storage && typeof options.storage === "object" && "type" in options.storage && options.storage.type === "sqlite") {
    return join(dirname(options.storage.path), "artifacts");
  }

  return join(process.cwd(), ".runlens", "artifacts");
}

async function safeRead<T>(reader: (() => T | Promise<T>) | undefined): Promise<T | undefined> {
  if (!reader) {
    return undefined;
  }

  try {
    return await reader();
  } catch {
    return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

