import type {
  FailureClass,
  FlakySelectorMetric,
  ReliabilityMetrics,
  SlowStepMetric,
  TraceIssueRecord,
  TraceRunRecord,
  TraceStepRecord
} from "../types.js";

interface MetricsInput {
  runs: TraceRunRecord[];
  steps: TraceStepRecord[];
  issues: TraceIssueRecord[];
}

export function computeMetrics(input: MetricsInput): ReliabilityMetrics {
  const totalRuns = input.runs.length;
  const passedRuns = input.runs.filter((run) => run.status === "passed").length;
  const failedRuns = input.runs.filter((run) => run.status === "failed").length;
  const failureCounts = new Map<FailureClass, number>();

  for (const run of input.runs) {
    if (run.failureClass) {
      failureCounts.set(run.failureClass, (failureCounts.get(run.failureClass) ?? 0) + 1);
    }
  }

  const stepBuckets = new Map<string, { total: number; count: number }>();
  for (const step of input.steps) {
    if (typeof step.durationMs === "number") {
      const bucket = stepBuckets.get(step.name) ?? { total: 0, count: 0 };
      bucket.total += step.durationMs;
      bucket.count += 1;
      stepBuckets.set(step.name, bucket);
    }
  }

  const selectorBuckets = new Map<string, { failures: number; attempts: number }>();
  for (const step of input.steps) {
    if (!step.selector) {
      continue;
    }

    const bucket = selectorBuckets.get(step.selector) ?? { failures: 0, attempts: 0 };
    bucket.attempts += 1;
    if (step.status === "failed") {
      bucket.failures += 1;
    }
    selectorBuckets.set(step.selector, bucket);
  }

  return {
    totalRuns,
    passedRuns,
    failedRuns,
    successRate: totalRuns === 0 ? 0 : Math.round((passedRuns / totalRuns) * 1000) / 10,
    commonFailureClasses: [...failureCounts.entries()]
      .map(([failureClass, count]) => ({ failureClass, count }))
      .sort((a, b) => b.count - a.count),
    slowestSteps: [...stepBuckets.entries()]
      .map<SlowStepMetric>(([name, bucket]) => ({
        name,
        averageDurationMs: Math.round(bucket.total / bucket.count),
        count: bucket.count
      }))
      .sort((a, b) => b.averageDurationMs - a.averageDurationMs)
      .slice(0, 10),
    flakySelectors: [...selectorBuckets.entries()]
      .map<FlakySelectorMetric>(([selector, bucket]) => ({ selector, ...bucket }))
      .filter((metric) => metric.failures > 0)
      .sort((a, b) => b.failures - a.failures)
      .slice(0, 10)
  };
}

