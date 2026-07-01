import { messageFromError } from "./errors.js";
import type { FailureClass, FailureClassificationInput } from "./types.js";

const challengeTerms = [
  "captcha",
  "recaptcha",
  "hcaptcha",
  "turnstile",
  "verify you are human",
  "checking your browser",
  "cloudflare",
  "challenge",
  "manual review",
  "access denied"
];

const authTerms = [
  "session expired",
  "sign in",
  "log in",
  "login",
  "unauthorized",
  "forbidden",
  "authentication required"
];

const selectorTerms = [
  "waiting for selector",
  "selector",
  "strict mode violation",
  "no node found",
  "no element found",
  "element is not attached",
  "cannot find element"
];

const navigationTerms = [
  "navigation timeout",
  "timeout exceeded",
  "net::err_timed_out",
  "page.goto",
  "waiting until"
];

const networkTerms = [
  "net::err",
  "econn",
  "socket hang up",
  "request failed",
  "network",
  "dns",
  "connection refused"
];

const validationTerms = [
  "validation",
  "invalid",
  "required field",
  "form error",
  "schema",
  "constraint"
];

export function classifyFailure(input: FailureClassificationInput): FailureClass {
  const text = [
    input.message,
    input.error ? messageFromError(input.error) : undefined,
    input.url,
    input.title,
    input.html,
    input.eventType,
    input.metadata ? JSON.stringify(input.metadata) : undefined
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  if (input.statusCode && input.statusCode >= 500) {
    return "network_failure";
  }

  if (input.statusCode === 401 || input.statusCode === 403) {
    return "auth/session_expired";
  }

  if (challengeTerms.some((term) => text.includes(term))) {
    return "blocked_or_challenge_page";
  }

  if (authTerms.some((term) => text.includes(term))) {
    return "auth/session_expired";
  }

  if (selectorTerms.some((term) => text.includes(term))) {
    return "selector_missing";
  }

  if (navigationTerms.some((term) => text.includes(term))) {
    return "navigation_timeout";
  }

  if (networkTerms.some((term) => text.includes(term))) {
    return "network_failure";
  }

  if (validationTerms.some((term) => text.includes(term))) {
    return "validation_error";
  }

  return "unknown";
}

