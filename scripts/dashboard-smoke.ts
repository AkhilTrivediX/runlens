const baseUrl = process.env.RUNLENS_DASHBOARD_URL ?? "http://127.0.0.1:5173";
const minRuns = Number(process.env.RUNLENS_MIN_RUNS ?? "1");

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main(): Promise<void> {
  const [health, runs, metrics] = await Promise.all([
    getJson<{ ok: boolean; dbPath: string; exists: boolean }>("/api/health"),
    getJson<{ runs: unknown[] }>("/api/runs"),
    getJson<{ metrics: { totalRuns: number; successRate: number } }>("/api/metrics")
  ]);

  if (!health.ok || !health.exists) {
    throw new Error(`Dashboard API is not connected to an existing trace DB: ${health.dbPath}`);
  }

  if (runs.runs.length < minRuns) {
    throw new Error(`Expected at least ${minRuns} dashboard runs, got ${runs.runs.length}`);
  }

  console.log(
    JSON.stringify({
      ok: true,
      dbPath: health.dbPath,
      runCount: runs.runs.length,
      totalRuns: metrics.metrics.totalRuns,
      successRate: metrics.metrics.successRate
    })
  );
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return (await response.json()) as T;
}
