import type {
  EnvironmentInfo,
  FailureClass,
  RunLensMode,
  RunStartInput,
  RunStatus,
  StepInput,
  StorageConfig,
  TraceIssueRecord,
  TraceStorage
} from "@runlens/core";

export interface RunLensOptions {
  project: string;
  mode?: RunLensMode;
  storage?: StorageConfig | TraceStorage;
  artifactsDir?: string;
  metadata?: Record<string, unknown>;
  environment?: EnvironmentInfo;
}

export interface PageContextSnapshot {
  label?: string;
  library?: EnvironmentInfo["library"];
  url?: string;
  title?: string;
  html?: string;
  environment?: EnvironmentInfo;
}

export interface PageContextProvider {
  label?: string;
  library?: EnvironmentInfo["library"];
  getUrl?: () => string | Promise<string>;
  getTitle?: () => string | Promise<string>;
  getDomSnapshot?: () => string | Promise<string>;
  getEnvironment?: () => EnvironmentInfo | Promise<EnvironmentInfo>;
  screenshot?: () => Promise<Buffer | Uint8Array | string>;
}

export interface IssueInput {
  type?: TraceIssueRecord["type"];
  severity?: TraceIssueRecord["severity"];
  message: string;
  stepId?: string;
  url?: string;
  failureClass?: FailureClass;
  metadata?: Record<string, unknown>;
}

export interface RetryOptions extends StepInput {
  attempts: number;
  delayMs?: number;
}

export interface RunLensRun {
  readonly id: string;
  readonly storage: TraceStorage;
  step<T>(name: string, fn: () => Promise<T>, input?: StepInput): Promise<T>;
  retry<T>(name: string, options: RetryOptions, fn: (attempt: number) => Promise<T>): Promise<T>;
  event(type: string, payload?: Record<string, unknown>): Promise<void>;
  mark(name: string, payload?: Record<string, unknown>): Promise<void>;
  issue(input: IssueInput): Promise<void>;
  attachPageContext(provider: PageContextProvider): () => void;
  captureScreenshot(label: string, stepId?: string): Promise<string | undefined>;
  end(status?: Exclude<RunStatus, "running">): Promise<void>;
}

export interface RunLensClient {
  readonly schemaVersion: string;
  startRun(input: RunStartInput): Promise<RunLensRun>;
  close(): Promise<void>;
}

export interface StepExecutionOptions extends StepInput {
  failRunOnError?: boolean;
}

