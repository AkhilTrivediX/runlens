# Development

## Tooling

- Node 22 (22.13+) or Node 24+. Node 24 is recommended.
- pnpm 11.
- Chrome or Chromium for browser examples. Set `RUNLENS_CHROME_PATH` if it is not in a standard location.

## Commands

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm test:puppeteer
pnpm test:playwright
pnpm test:complex
pnpm dev:dashboard
pnpm test:release
```

`pnpm test:release` packs the SDK and installs it into a temporary project outside the workspace. It checks the installed SDK, adapters, SQLite storage, CLI, production dashboard and TypeScript declarations. npm must be installed alongside Node.

CI runs these checks on Node 22.13 and Node 24. It also installs Chromium and runs all three browser examples.

## Generated outputs

Generated traces, screenshots, logs, and dashboard smoke screenshots live under `lab/test-runs`.


