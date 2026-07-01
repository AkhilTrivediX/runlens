# Examples

These examples use local harmless fixture pages and write outputs under `lab/test-runs`.

## Puppeteer basic

```bash
pnpm test:puppeteer
```

Creates a passing Puppeteer trace with console, network, screenshots, and step timing.

## Playwright basic

```bash
pnpm test:playwright
```

Creates a passing Playwright trace with the same fixture flow.

## Complex workflow

```bash
pnpm test:complex
```

Creates an expected failed trace with a login-like form, challenge/manual-review labels, retries, and selector failure classification.

