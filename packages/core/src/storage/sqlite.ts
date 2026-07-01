import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  ArtifactType,
  EnvironmentInfo,
  FailureClass,
  IssueSeverity,
  ReliabilityMetrics,
  RunLensMode,
  RunStatus,
  RunTrace,
  RunsListFilter,
  StepStatus,
  TraceArtifactRecord,
  TraceEventRecord,
  TraceIssueRecord,
  TraceRunRecord,
  TraceStepRecord,
  TraceStorage
} from "../types.js";
import { computeMetrics } from "./metrics.js";

type SqlValue = string | number | null;

interface RunRow {
  id: string;
  project: string;
  name: string;
  mode: RunLensMode;
  status: RunStatus;
  schema_version: string;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  tags_json: string;
  metadata_json: string;
  environment_json: string;
  failure_class: FailureClass | null;
  failure_message: string | null;
}

interface StepRow {
  id: string;
  run_id: string;
  name: string;
  status: StepStatus;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  selector: string | null;
  action: string | null;
  attempt: number | null;
  max_attempts: number | null;
  metadata_json: string;
  error_json: string | null;
  failure_class: FailureClass | null;
  failure_message: string | null;
}

interface EventRow {
  id: string;
  run_id: string;
  step_id: string | null;
  type: string;
  timestamp: string;
  payload_json: string;
}

interface ArtifactRow {
  id: string;
  run_id: string;
  step_id: string | null;
  type: ArtifactType;
  label: string;
  path: string | null;
  mime_type: string | null;
  created_at: string;
  metadata_json: string;
}

interface IssueRow {
  id: string;
  run_id: string;
  step_id: string | null;
  type: TraceIssueRecord["type"];
  severity: IssueSeverity;
  message: string;
  timestamp: string;
  url: string | null;
  failure_class: FailureClass | null;
  metadata_json: string;
}

export class SqliteTraceStorage implements TraceStorage {
  private db?: DatabaseSync;

  constructor(private readonly path: string) {}

  async init(): Promise<void> {
    mkdirSync(dirname(this.path), { recursive: true });
    this.db = new DatabaseSync(this.path);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        project TEXT NOT NULL,
        name TEXT NOT NULL,
        mode TEXT NOT NULL,
        status TEXT NOT NULL,
        schema_version TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        duration_ms INTEGER,
        tags_json TEXT NOT NULL,
        metadata_json TEXT NOT NULL,
        environment_json TEXT NOT NULL,
        failure_class TEXT,
        failure_message TEXT
      );
      CREATE TABLE IF NOT EXISTS steps (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        duration_ms INTEGER,
        selector TEXT,
        action TEXT,
        attempt INTEGER,
        max_attempts INTEGER,
        metadata_json TEXT NOT NULL,
        error_json TEXT,
        failure_class TEXT,
        failure_message TEXT,
        FOREIGN KEY(run_id) REFERENCES runs(id)
      );
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        step_id TEXT,
        type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        FOREIGN KEY(run_id) REFERENCES runs(id)
      );
      CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        step_id TEXT,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        path TEXT,
        mime_type TEXT,
        created_at TEXT NOT NULL,
        metadata_json TEXT NOT NULL,
        FOREIGN KEY(run_id) REFERENCES runs(id)
      );
      CREATE TABLE IF NOT EXISTS issues (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        step_id TEXT,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        url TEXT,
        failure_class TEXT,
        metadata_json TEXT NOT NULL,
        FOREIGN KEY(run_id) REFERENCES runs(id)
      );
      CREATE INDEX IF NOT EXISTS idx_runs_started_at ON runs(started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_steps_run_id ON steps(run_id);
      CREATE INDEX IF NOT EXISTS idx_events_run_id ON events(run_id);
      CREATE INDEX IF NOT EXISTS idx_artifacts_run_id ON artifacts(run_id);
      CREATE INDEX IF NOT EXISTS idx_issues_run_id ON issues(run_id);
    `);
  }

  async createRun(run: TraceRunRecord): Promise<void> {
    this.database
      .prepare(
        `INSERT INTO runs (
          id, project, name, mode, status, schema_version, started_at, ended_at, duration_ms,
          tags_json, metadata_json, environment_json, failure_class, failure_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        run.id,
        run.project,
        run.name,
        run.mode,
        run.status,
        run.schemaVersion,
        run.startedAt,
        run.endedAt ?? null,
        run.durationMs ?? null,
        stringify(run.tags),
        stringify(run.metadata),
        stringify(run.environment),
        run.failureClass ?? null,
        run.failureMessage ?? null
      );
  }

  async updateRun(id: string, patch: Partial<TraceRunRecord>): Promise<void> {
    await this.updateById("runs", id, {
      project: patch.project,
      name: patch.name,
      mode: patch.mode,
      status: patch.status,
      schema_version: patch.schemaVersion,
      started_at: patch.startedAt,
      ended_at: patch.endedAt,
      duration_ms: patch.durationMs,
      tags_json: patch.tags ? stringify(patch.tags) : undefined,
      metadata_json: patch.metadata ? stringify(patch.metadata) : undefined,
      environment_json: patch.environment ? stringify(patch.environment) : undefined,
      failure_class: patch.failureClass,
      failure_message: patch.failureMessage
    });
  }

  async createStep(step: TraceStepRecord): Promise<void> {
    this.database
      .prepare(
        `INSERT INTO steps (
          id, run_id, name, status, started_at, ended_at, duration_ms, selector, action, attempt,
          max_attempts, metadata_json, error_json, failure_class, failure_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        step.id,
        step.runId,
        step.name,
        step.status,
        step.startedAt,
        step.endedAt ?? null,
        step.durationMs ?? null,
        step.selector ?? null,
        step.action ?? null,
        step.attempt ?? null,
        step.maxAttempts ?? null,
        stringify(step.metadata),
        step.error ? stringify(step.error) : null,
        step.failureClass ?? null,
        step.failureMessage ?? null
      );
  }

  async updateStep(id: string, patch: Partial<TraceStepRecord>): Promise<void> {
    await this.updateById("steps", id, {
      name: patch.name,
      status: patch.status,
      started_at: patch.startedAt,
      ended_at: patch.endedAt,
      duration_ms: patch.durationMs,
      selector: patch.selector,
      action: patch.action,
      attempt: patch.attempt,
      max_attempts: patch.maxAttempts,
      metadata_json: patch.metadata ? stringify(patch.metadata) : undefined,
      error_json: patch.error ? stringify(patch.error) : undefined,
      failure_class: patch.failureClass,
      failure_message: patch.failureMessage
    });
  }

  async addEvent(event: TraceEventRecord): Promise<void> {
    this.database
      .prepare(
        `INSERT INTO events (id, run_id, step_id, type, timestamp, payload_json)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(event.id, event.runId, event.stepId ?? null, event.type, event.timestamp, stringify(event.payload));
  }

  async addArtifact(artifact: TraceArtifactRecord): Promise<void> {
    this.database
      .prepare(
        `INSERT INTO artifacts (id, run_id, step_id, type, label, path, mime_type, created_at, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        artifact.id,
        artifact.runId,
        artifact.stepId ?? null,
        artifact.type,
        artifact.label,
        artifact.path ?? null,
        artifact.mimeType ?? null,
        artifact.createdAt,
        stringify(artifact.metadata)
      );
  }

  async addIssue(issue: TraceIssueRecord): Promise<void> {
    this.database
      .prepare(
        `INSERT INTO issues (id, run_id, step_id, type, severity, message, timestamp, url, failure_class, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        issue.id,
        issue.runId,
        issue.stepId ?? null,
        issue.type,
        issue.severity,
        issue.message,
        issue.timestamp,
        issue.url ?? null,
        issue.failureClass ?? null,
        stringify(issue.metadata)
      );
  }

  async listRuns(filter: RunsListFilter = {}): Promise<TraceRunRecord[]> {
    const clauses: string[] = [];
    const values: SqlValue[] = [];

    if (filter.project) {
      clauses.push("project = ?");
      values.push(filter.project);
    }

    if (filter.status) {
      clauses.push("status = ?");
      values.push(filter.status);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = filter.limit ?? 100;
    const rows = this.database
      .prepare(`SELECT * FROM runs ${where} ORDER BY started_at DESC LIMIT ?`)
      .all(...values, limit) as unknown as RunRow[];

    return rows.map(runFromRow);
  }

  async getRunTrace(runId: string): Promise<RunTrace | undefined> {
    const runRow = this.database.prepare("SELECT * FROM runs WHERE id = ?").get(runId) as RunRow | undefined;

    if (!runRow) {
      return undefined;
    }

    const steps = this.database.prepare("SELECT * FROM steps WHERE run_id = ? ORDER BY started_at ASC").all(runId) as unknown as StepRow[];
    const events = this.database
      .prepare("SELECT * FROM events WHERE run_id = ? ORDER BY timestamp ASC")
      .all(runId) as unknown as EventRow[];
    const artifacts = this.database
      .prepare("SELECT * FROM artifacts WHERE run_id = ? ORDER BY created_at ASC")
      .all(runId) as unknown as ArtifactRow[];
    const issues = this.database
      .prepare("SELECT * FROM issues WHERE run_id = ? ORDER BY timestamp ASC")
      .all(runId) as unknown as IssueRow[];

    return {
      run: runFromRow(runRow),
      steps: steps.map(stepFromRow),
      events: events.map(eventFromRow),
      artifacts: artifacts.map(artifactFromRow),
      issues: issues.map(issueFromRow)
    };
  }

  async getMetrics(): Promise<ReliabilityMetrics> {
    const runs = (this.database.prepare("SELECT * FROM runs").all() as unknown as RunRow[]).map(runFromRow);
    const steps = (this.database.prepare("SELECT * FROM steps").all() as unknown as StepRow[]).map(stepFromRow);
    const issues = (this.database.prepare("SELECT * FROM issues").all() as unknown as IssueRow[]).map(issueFromRow);
    return computeMetrics({ runs, steps, issues });
  }

  async close(): Promise<void> {
    this.db?.close();
    this.db = undefined;
  }

  private async updateById(table: string, id: string, values: Record<string, SqlValue | undefined>): Promise<void> {
    const entries = Object.entries(values).filter((entry): entry is [string, SqlValue] => entry[1] !== undefined);
    if (entries.length === 0) {
      return;
    }

    const assignments = entries.map(([key]) => `${key} = ?`).join(", ");
    this.database.prepare(`UPDATE ${table} SET ${assignments} WHERE id = ?`).run(...entries.map((entry) => entry[1]), id);
  }

  private get database(): DatabaseSync {
    if (!this.db) {
      throw new Error("SqliteTraceStorage.init() must be called before use.");
    }

    return this.db;
  }
}

function stringify(value: unknown): string {
  return JSON.stringify(value ?? {});
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  return JSON.parse(value) as T;
}

function runFromRow(row: RunRow): TraceRunRecord {
  return {
    id: row.id,
    project: row.project,
    name: row.name,
    mode: row.mode,
    status: row.status,
    schemaVersion: row.schema_version,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    durationMs: row.duration_ms ?? undefined,
    tags: parseJson<string[]>(row.tags_json, []),
    metadata: parseJson<Record<string, unknown>>(row.metadata_json, {}),
    environment: parseJson<EnvironmentInfo>(row.environment_json, {}),
    failureClass: row.failure_class ?? undefined,
    failureMessage: row.failure_message ?? undefined
  };
}

function stepFromRow(row: StepRow): TraceStepRecord {
  return {
    id: row.id,
    runId: row.run_id,
    name: row.name,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    durationMs: row.duration_ms ?? undefined,
    selector: row.selector ?? undefined,
    action: row.action ?? undefined,
    attempt: row.attempt ?? undefined,
    maxAttempts: row.max_attempts ?? undefined,
    metadata: parseJson<Record<string, unknown>>(row.metadata_json, {}),
    error: parseJson(row.error_json, undefined),
    failureClass: row.failure_class ?? undefined,
    failureMessage: row.failure_message ?? undefined
  };
}

function eventFromRow(row: EventRow): TraceEventRecord {
  return {
    id: row.id,
    runId: row.run_id,
    stepId: row.step_id ?? undefined,
    type: row.type,
    timestamp: row.timestamp,
    payload: parseJson<Record<string, unknown>>(row.payload_json, {})
  };
}

function artifactFromRow(row: ArtifactRow): TraceArtifactRecord {
  return {
    id: row.id,
    runId: row.run_id,
    stepId: row.step_id ?? undefined,
    type: row.type,
    label: row.label,
    path: row.path ?? undefined,
    mimeType: row.mime_type ?? undefined,
    createdAt: row.created_at,
    metadata: parseJson<Record<string, unknown>>(row.metadata_json, {})
  };
}

function issueFromRow(row: IssueRow): TraceIssueRecord {
  return {
    id: row.id,
    runId: row.run_id,
    stepId: row.step_id ?? undefined,
    type: row.type,
    severity: row.severity,
    message: row.message,
    timestamp: row.timestamp,
    url: row.url ?? undefined,
    failureClass: row.failure_class ?? undefined,
    metadata: parseJson<Record<string, unknown>>(row.metadata_json, {})
  };
}
