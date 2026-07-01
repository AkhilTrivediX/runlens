import type {
  ReliabilityMetrics,
  RunTrace,
  RunsListFilter,
  TraceArtifactRecord,
  TraceEventRecord,
  TraceIssueRecord,
  TraceRunRecord,
  TraceStepRecord,
  TraceStorage
} from "../types.js";
import { computeMetrics } from "./metrics.js";

export class MemoryTraceStorage implements TraceStorage {
  private readonly runs = new Map<string, TraceRunRecord>();
  private readonly steps = new Map<string, TraceStepRecord>();
  private readonly events = new Map<string, TraceEventRecord>();
  private readonly artifacts = new Map<string, TraceArtifactRecord>();
  private readonly issues = new Map<string, TraceIssueRecord>();

  async init(): Promise<void> {}

  async createRun(run: TraceRunRecord): Promise<void> {
    this.runs.set(run.id, run);
  }

  async updateRun(id: string, patch: Partial<TraceRunRecord>): Promise<void> {
    const existing = this.runs.get(id);
    if (existing) {
      this.runs.set(id, { ...existing, ...patch });
    }
  }

  async createStep(step: TraceStepRecord): Promise<void> {
    this.steps.set(step.id, step);
  }

  async updateStep(id: string, patch: Partial<TraceStepRecord>): Promise<void> {
    const existing = this.steps.get(id);
    if (existing) {
      this.steps.set(id, { ...existing, ...patch });
    }
  }

  async addEvent(event: TraceEventRecord): Promise<void> {
    this.events.set(event.id, event);
  }

  async addArtifact(artifact: TraceArtifactRecord): Promise<void> {
    this.artifacts.set(artifact.id, artifact);
  }

  async addIssue(issue: TraceIssueRecord): Promise<void> {
    this.issues.set(issue.id, issue);
  }

  async listRuns(filter: RunsListFilter = {}): Promise<TraceRunRecord[]> {
    return [...this.runs.values()]
      .filter((run) => !filter.project || run.project === filter.project)
      .filter((run) => !filter.status || run.status === filter.status)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, filter.limit ?? 100);
  }

  async getRunTrace(runId: string): Promise<RunTrace | undefined> {
    const run = this.runs.get(runId);
    if (!run) {
      return undefined;
    }

    return {
      run,
      steps: [...this.steps.values()].filter((step) => step.runId === runId),
      events: [...this.events.values()].filter((event) => event.runId === runId),
      artifacts: [...this.artifacts.values()].filter((artifact) => artifact.runId === runId),
      issues: [...this.issues.values()].filter((issue) => issue.runId === runId)
    };
  }

  async getMetrics(): Promise<ReliabilityMetrics> {
    return computeMetrics({
      runs: [...this.runs.values()],
      steps: [...this.steps.values()],
      issues: [...this.issues.values()]
    });
  }
}

