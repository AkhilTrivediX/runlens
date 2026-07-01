# Security Policy

RunLens is an observability tool. It should not contain captcha bypass, anti-bot evasion, fingerprint spoofing, credential harvesting, or stealth bypass behavior.

## Reporting issues

For now, open a private security advisory on GitHub if available, or contact the repository owner directly through GitHub.

Please include:

- Affected package or app.
- Impact.
- Reproduction steps.
- Whether generated traces, screenshots, or DOM snapshots may include sensitive data.

## Sensitive trace data

RunLens can store screenshots, DOM snapshots, URLs, console messages, and metadata locally. Users should avoid capturing secrets and should treat trace databases as sensitive project artifacts.

