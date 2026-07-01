import type { SerializedError } from "./types.js";

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return {
    name: "NonError",
    message: typeof error === "string" ? error : JSON.stringify(error)
  };
}

export function messageFromError(error: unknown): string {
  return serializeError(error).message;
}

