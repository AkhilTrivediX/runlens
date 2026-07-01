# Contributing

RunLens is a TypeScript monorepo for browser automation observability. Contributions should keep the SDK passive, lightweight, and safe.

## Development setup

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm test:puppeteer
pnpm test:playwright
pnpm test:complex
pnpm dev:dashboard
```

Set `RUNLENS_CHROME_PATH` if Chrome or Chromium is not in a standard location.

## Before opening a PR

- Keep SDK changes in `packages/sdk` and shared schema/storage changes in `packages/core`.
- Keep generated traces and screenshots under `lab/test-runs`.
- Add or update tests when changing trace schema, storage behavior, adapters, or dashboard data assumptions.
- Run `pnpm build`, `pnpm typecheck`, `pnpm test`, and relevant browser smoke tests.
- Do not add captcha solving, anti-bot bypass, fingerprint spoofing, stealth bypass logic, or evasion behavior.

## Commit style

Use concise conventional messages:

- `feat: add playwright context instrumentation`
- `fix: classify navigation timeout errors`
- `docs: clarify dashboard setup`
- `test: add selector flake fixture`

## Good first contributions

- Add more harmless fixture pages.
- Add adapter tests around console/network/page errors.
- Improve trace export format.
- Add dashboard filters for project, status, and failure class.
- Improve docs for CI artifact workflows.

