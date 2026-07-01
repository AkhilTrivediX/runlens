# runlens

The public TypeScript SDK for RunLens browser automation observability.

```ts
import { createRunLens } from "runlens";

const trace = createRunLens({
  project: "example",
  mode: "silent",
  storage: { type: "sqlite", path: ".runlens/runlens.db" }
});
```

See the root README and `docs/` directory for adapter examples and dashboard usage.
