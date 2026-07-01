# Use Cases

RunLens is for developers operating browser automation in production-like workflows.

## Debug flaky selectors

Capture every step, selector, action, screenshot, and failure class so teams can see whether a selector is missing, detached, or only flaky after navigation.

## Understand navigation and session failures

Classify navigation timeouts, auth/session expiry, challenge states, and manual-review pages without modifying the browser fingerprint or bypassing site controls.

## Triage network and console issues

Surface failed requests, HTTP 4xx/5xx responses, console errors, and page errors alongside the run timeline that triggered them.

## Observe browser-agent workflows

Browser-use-style agents and custom automation loops can add manual events, marks, metadata, and retry attempts to explain why an agent stalled or recovered.

## Improve CI evidence

Use SQLite traces, screenshots, DOM snapshots, and JSON exports as durable CI artifacts when automation fails outside a developer laptop.

## Compare reliability across projects

The local dashboard summarizes success rate, common failure classes, slowest steps, and flaky selectors across Puppeteer, Playwright, and custom workflows.

## Safety boundary

RunLens observes and labels automation behavior. It does not solve captcha, bypass bot protections, spoof fingerprints, or provide stealth evasion.

