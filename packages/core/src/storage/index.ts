import type { StorageConfig, TraceStorage } from "../types.js";
import { MemoryTraceStorage } from "./memory.js";

export function createTraceStorage(config: StorageConfig = { type: "memory" }): TraceStorage {
  if (config.type === "sqlite") {
    return new DeferredSqliteTraceStorage(config.path);
  }

  return new MemoryTraceStorage();
}

export { MemoryTraceStorage } from "./memory.js";

class DeferredSqliteTraceStorage implements TraceStorage {
  private storage?: TraceStorage;
  private storagePromise?: Promise<TraceStorage>;

  constructor(private readonly path: string) {}

  async init(): Promise<void> {
    await this.delegate();
  }

  async createRun(...args: Parameters<TraceStorage["createRun"]>): Promise<void> {
    return await (await this.delegate()).createRun(...args);
  }

  async updateRun(...args: Parameters<TraceStorage["updateRun"]>): Promise<void> {
    return await (await this.delegate()).updateRun(...args);
  }

  async createStep(...args: Parameters<TraceStorage["createStep"]>): Promise<void> {
    return await (await this.delegate()).createStep(...args);
  }

  async updateStep(...args: Parameters<TraceStorage["updateStep"]>): Promise<void> {
    return await (await this.delegate()).updateStep(...args);
  }

  async addEvent(...args: Parameters<TraceStorage["addEvent"]>): Promise<void> {
    return await (await this.delegate()).addEvent(...args);
  }

  async addArtifact(...args: Parameters<TraceStorage["addArtifact"]>): Promise<void> {
    return await (await this.delegate()).addArtifact(...args);
  }

  async addIssue(...args: Parameters<TraceStorage["addIssue"]>): Promise<void> {
    return await (await this.delegate()).addIssue(...args);
  }

  async listRuns(...args: Parameters<TraceStorage["listRuns"]>): ReturnType<TraceStorage["listRuns"]> {
    return await (await this.delegate()).listRuns(...args);
  }

  async getRunTrace(...args: Parameters<TraceStorage["getRunTrace"]>): ReturnType<TraceStorage["getRunTrace"]> {
    return await (await this.delegate()).getRunTrace(...args);
  }

  async getMetrics(): ReturnType<TraceStorage["getMetrics"]> {
    return await (await this.delegate()).getMetrics();
  }

  async close(): Promise<void> {
    await this.storage?.close?.();
    this.storage = undefined;
    this.storagePromise = undefined;
  }

  private async delegate(): Promise<TraceStorage> {
    if (this.storage) {
      return this.storage;
    }

    this.storagePromise ??= import("./sqlite.js").then(async ({ SqliteTraceStorage }) => {
      const storage = new SqliteTraceStorage(this.path);
      await storage.init();
      this.storage = storage;
      return storage;
    });

    return await this.storagePromise;
  }
}
