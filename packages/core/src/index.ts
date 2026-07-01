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
  metadata?: Record<string, unknown>;
}

export interface TraceEvent {
  id: string;
  runId: string;
  stepId?: string;
  type: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

