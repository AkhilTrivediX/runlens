export const TRACE_SCHEMA_VERSION = "0.1.0";

export type RunLensMode = "silent" | "debugger";

export type RunStatus = "running" | "passed" | "failed" | "cancelled";

export type StepStatus = "running" | "passed" | "failed" | "skipped";

export type FailureClass =
  | "selector_missing"
  | "navigation_timeout"
  | "network_failure"
  | "blocked_or_challenge_page"
  | "auth/session_expired"
  | "validation_error"
  | "unknown";

export interface SqliteStorageConfig {
  type: "sqlite";
  path: string;
}

export interface MemoryStorageConfig {
  type: "memory";
}

export type StorageConfig = SqliteStorageConfig | MemoryStorageConfig;

export interface EnvironmentInfo {
  runtime?: string;
  os?: string;
  library?: "puppeteer" | "playwright" | "puppeteer-real-browser" | "browser-use" | "custom";
  browserEngine?: "chromium" | "firefox" | "webkit" | "unknown";
  browserVersion?: string;
}

export interface RunStartInput {
  name: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  environment?: EnvironmentInfo;
}

export interface StepInput {
  selector?: string;
  action?: string;
  attempt?: number;
  maxAttempts?: number;
  metadata?: Record<string, unknown>;
}

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
}

export interface TraceRunRecord {
  id: string;
  project: string;
  name: string;
  mode: RunLensMode;
  status: RunStatus;
  schemaVersion: string;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  tags: string[];
  metadata: Record<string, unknown>;
  environment: EnvironmentInfo;
  failureClass?: FailureClass;
  failureMessage?: string;
}

export interface TraceStepRecord {
  id: string;
  runId: string;
  name: string;
  status: StepStatus;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  selector?: string;
  action?: string;
  attempt?: number;
  maxAttempts?: number;
  metadata: Record<string, unknown>;
  error?: SerializedError;
  failureClass?: FailureClass;
  failureMessage?: string;
}

export interface TraceEventRecord {
  id: string;
  runId: string;
  stepId?: string;
  type: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export type ArtifactType = "screenshot" | "dom_snapshot" | "log" | "trace_json";

export interface TraceArtifactRecord {
  id: string;
  runId: string;
  stepId?: string;
  type: ArtifactType;
  label: string;
  path?: string;
  mimeType?: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export type IssueSeverity = "info" | "warning" | "error";

export interface TraceIssueRecord {
  id: string;
  runId: string;
  stepId?: string;
  type:
    | "automation_error"
    | "console_error"
    | "page_error"
    | "network_failure"
    | "classification"
    | "manual_mark";
  severity: IssueSeverity;
  message: string;
  timestamp: string;
  url?: string;
  failureClass?: FailureClass;
  metadata: Record<string, unknown>;
}

export interface RunTrace {
  run: TraceRunRecord;
  steps: TraceStepRecord[];
  events: TraceEventRecord[];
  artifacts: TraceArtifactRecord[];
  issues: TraceIssueRecord[];
}

export interface RunsListFilter {
  project?: string;
  status?: RunStatus;
  limit?: number;
}

export interface FailureClassCount {
  failureClass: FailureClass;
  count: number;
}

export interface SlowStepMetric {
  name: string;
  averageDurationMs: number;
  count: number;
}

export interface FlakySelectorMetric {
  selector: string;
  failures: number;
  attempts: number;
}

export interface ReliabilityMetrics {
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  successRate: number;
  commonFailureClasses: FailureClassCount[];
  slowestSteps: SlowStepMetric[];
  flakySelectors: FlakySelectorMetric[];
}

export interface TraceStorage {
  init(): Promise<void>;
  createRun(run: TraceRunRecord): Promise<void>;
  updateRun(id: string, patch: Partial<TraceRunRecord>): Promise<void>;
  createStep(step: TraceStepRecord): Promise<void>;
  updateStep(id: string, patch: Partial<TraceStepRecord>): Promise<void>;
  addEvent(event: TraceEventRecord): Promise<void>;
  addArtifact(artifact: TraceArtifactRecord): Promise<void>;
  addIssue(issue: TraceIssueRecord): Promise<void>;
  listRuns(filter?: RunsListFilter): Promise<TraceRunRecord[]>;
  getRunTrace(runId: string): Promise<RunTrace | undefined>;
  getMetrics(): Promise<ReliabilityMetrics>;
  close?(): Promise<void>;
}

export interface FailureClassificationInput {
  error?: unknown;
  message?: string;
  url?: string;
  title?: string;
  html?: string;
  statusCode?: number;
  eventType?: string;
  metadata?: Record<string, unknown>;
}

