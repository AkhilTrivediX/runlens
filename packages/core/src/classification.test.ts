import { describe, expect, it } from "vitest";
import { classifyFailure } from "./classification.js";

describe("classifyFailure", () => {
  it("classifies selector failures", () => {
    expect(classifyFailure({ message: "Waiting for selector [data-testid=cta] failed" })).toBe("selector_missing");
  });

  it("classifies challenge pages", () => {
    expect(classifyFailure({ title: "Just a moment", html: "Verify you are human with Turnstile" })).toBe(
      "blocked_or_challenge_page"
    );
  });

  it("classifies network and auth status codes", () => {
    expect(classifyFailure({ statusCode: 502 })).toBe("network_failure");
    expect(classifyFailure({ statusCode: 401 })).toBe("auth/session_expired");
  });
});

