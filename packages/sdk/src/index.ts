import {
  TRACE_SCHEMA_VERSION,
  type RunLensMode,
  type RunStartInput,
  type StepInput,
  type StorageConfig
} from "@runlens/core";

export interface RunLensOptions {
  project: string;
  mode?: RunLensMode;
  storage?: StorageConfig;
  metadata?: Record<string, unknown>;
}

export interface RunLensRun {
  readonly id: string;
  step<T>(name: string, fn: () => Promise<T>, input?: StepInput): Promise<T>;
  event(type: string, payload?: Record<string, unknown>): Promise<void>;
  mark(name: string, payload?: Record<string, unknown>): Promise<void>;
  end(): Promise<void>;
}

export interface RunLensClient {
  readonly schemaVersion: string;
  startRun(input: RunStartInput): Promise<RunLensRun>;
}

export function createRunLens(options: RunLensOptions): RunLensClient {
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    async startRun(input) {
      const runId = crypto.randomUUID();
      const startedAt = new Date().toISOString();

      return {
        id: runId,
        async step(name, fn, stepInput) {
          void options;
          void input;
          void startedAt;
          void name;
          void stepInput;
          return await fn();
        },
        async event(type, payload) {
          void type;
          void payload;
        },
        async mark(name, payload) {
          void name;
          void payload;
        },
        async end() {}
      };
    }
  };
}

export const createTracePilot = createRunLens;

