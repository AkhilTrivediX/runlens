# Complex Workflow Example

Runs a multi-step Playwright workflow with a login-like form, challenge/manual-review labels, retries, and an intentional missing-selector failure.

```bash
pnpm test:complex
```

The command exits successfully when the expected failed trace is created.
