import { StrictMode, useEffect, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock3,
  Database,
  Gauge,
  Search,
  Terminal,
  XCircle
} from "lucide-react";
import "./styles.css";

type RunStatus = "running" | "passed" | "failed" | "cancelled";

interface TraceRun {
  id: string;
  project: string;
  name: string;
  mode: "silent" | "debugger";
  status: RunStatus;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  failureClass?: string;
  failureMessage?: string;
  environment: {
    library?: string;
    browserEngine?: string;
    browserVersion?: string;
  };
}

interface TraceStep {
  id: string;
  name: string;
  status: "running" | "passed" | "failed" | "skipped";
  startedAt: string;
  durationMs?: number;
  selector?: string;
  action?: string;
  failureClass?: string;
  failureMessage?: string;
}

interface TraceIssue {
  id: string;
  type: string;
  severity: "info" | "warning" | "error";
  message: string;
  timestamp: string;
  url?: string;
  failureClass?: string;
}

interface TraceArtifact {
  id: string;
  type: "screenshot" | "dom_snapshot" | "log" | "trace_json";
  label: string;
  path?: string;
  createdAt: string;
}

interface RunTrace {
  run: TraceRun;
  steps: TraceStep[];
  issues: TraceIssue[];
  artifacts: TraceArtifact[];
}

interface Metrics {
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  successRate: number;
  commonFailureClasses: Array<{ failureClass: string; count: number }>;
  slowestSteps: Array<{ name: string; averageDurationMs: number; count: number }>;
  flakySelectors: Array<{ selector: string; failures: number; attempts: number }>;
}

function App() {
  const [runs, setRuns] = useState<TraceRun[]>([]);
  const [metrics, setMetrics] = useState<Metrics>();
  const [selectedRunId, setSelectedRunId] = useState<string>();
  const [trace, setTrace] = useState<RunTrace>();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!selectedRunId) {
      setTrace(undefined);
      return;
    }

    void fetchJson<{ trace: RunTrace }>(`/api/runs/${encodeURIComponent(selectedRunId)}`)
      .then((result) => setTrace(result.trace))
      .catch((caught) => setError(caught instanceof Error ? caught.message : String(caught)));
  }, [selectedRunId]);

  const filteredRuns = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return runs;
    }

    return runs.filter((run) => [run.name, run.project, run.status, run.failureClass].filter(Boolean).join(" ").toLowerCase().includes(value));
  }, [query, runs]);

  async function refresh() {
    try {
      const [runsResponse, metricsResponse] = await Promise.all([
        fetchJson<{ runs: TraceRun[] }>("/api/runs"),
        fetchJson<{ metrics: Metrics }>("/api/metrics")
      ]);
      setRuns(runsResponse.runs);
      setMetrics(metricsResponse.metrics);
      setSelectedRunId((current) => current ?? runsResponse.runs[0]?.id);
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar" aria-label="RunLens navigation">
        <div className="brand">
          <Database size={18} />
          <span>RunLens</span>
        </div>
        <nav>
          <a className="active" href="/">
            Runs
          </a>
          <a href="#failures">Failures</a>
          <a href="#artifacts">Artifacts</a>
          <a href="#metrics">Metrics</a>
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Local trace store</p>
            <h1>Automation runs</h1>
          </div>
          <label className="search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter runs" />
          </label>
        </header>

        {error ? <div className="notice">{error}</div> : null}

        <MetricsStrip metrics={metrics} />

        <section className="workspace">
          <RunsList runs={filteredRuns} selectedRunId={selectedRunId} onSelect={setSelectedRunId} />
          <RunDetail trace={trace} />
        </section>
      </section>
    </main>
  );
}

function MetricsStrip({ metrics }: { metrics?: Metrics }) {
  const topFailure = metrics?.commonFailureClasses[0];
  const slowest = metrics?.slowestSteps[0];

  return (
    <section className="metrics" id="metrics" aria-label="Reliability metrics">
      <Metric icon={<Gauge size={18} />} label="Success rate" value={`${metrics?.successRate ?? 0}%`} />
      <Metric icon={<CheckCircle2 size={18} />} label="Passed runs" value={`${metrics?.passedRuns ?? 0}/${metrics?.totalRuns ?? 0}`} />
      <Metric icon={<AlertTriangle size={18} />} label="Top failure" value={topFailure ? `${topFailure.failureClass} (${topFailure.count})` : "-"} />
      <Metric icon={<Clock3 size={18} />} label="Slowest step" value={slowest ? `${slowest.name} ${formatDuration(slowest.averageDurationMs)}` : "-"} />
    </section>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <article>
      {icon}
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function RunsList({
  runs,
  selectedRunId,
  onSelect
}: {
  runs: TraceRun[];
  selectedRunId?: string;
  onSelect(runId: string): void;
}) {
  return (
    <section className="runs" aria-label="Runs list">
      <div className="tableHeader">
        <span>Run</span>
        <span>Status</span>
        <span>Duration</span>
        <span>Library</span>
        <span>Mode</span>
      </div>
      {runs.length === 0 ? <p className="empty">No runs captured yet.</p> : null}
      {runs.map((run) => (
        <button className={`row ${run.id === selectedRunId ? "selected" : ""}`} key={run.id} onClick={() => onSelect(run.id)}>
          <span>
            <strong>{run.name}</strong>
            <small>{run.project}</small>
          </span>
          <span className={`pill ${run.status}`}>{run.status}</span>
          <span>{formatDuration(run.durationMs)}</span>
          <span>{run.environment.library ?? "custom"}</span>
          <span>{run.mode}</span>
        </button>
      ))}
    </section>
  );
}

function RunDetail({ trace }: { trace?: RunTrace }) {
  if (!trace) {
    return (
      <section className="detail emptyDetail">
        <Activity size={20} />
        <span>Select a run</span>
      </section>
    );
  }

  const networkIssues = trace.issues.filter((issue) => issue.type === "network_failure");
  const consoleIssues = trace.issues.filter((issue) => issue.type === "console_error" || issue.type === "page_error");
  const screenshots = trace.artifacts.filter((artifact) => artifact.type === "screenshot");

  return (
    <section className="detail">
      <header className="detailHeader">
        <div>
          <p className="eyebrow">{trace.run.project}</p>
          <h2>{trace.run.name}</h2>
        </div>
        <span className={`pill ${trace.run.status}`}>{trace.run.status}</span>
      </header>

      <section className="summaryGrid">
        <Summary label="Started" value={formatDate(trace.run.startedAt)} />
        <Summary label="Duration" value={formatDuration(trace.run.durationMs)} />
        <Summary label="Browser" value={trace.run.environment.browserEngine ?? "unknown"} />
        <Summary label="Mode" value={trace.run.mode} />
      </section>

      <section className="panel">
        <h3>Timeline</h3>
        <div className="timeline">
          {trace.steps.map((step) => (
            <div className="timelineItem" key={step.id}>
              {step.status === "passed" ? <CheckCircle2 size={16} /> : step.status === "failed" ? <XCircle size={16} /> : <Clock3 size={16} />}
              <div>
                <div className="timelineTitle">
                  <strong>{step.name}</strong>
                  <span>{formatDuration(step.durationMs)}</span>
                </div>
                <p>{[step.action, step.selector, step.failureClass].filter(Boolean).join(" | ") || "step"}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="detailGrid">
        <section className="panel" id="failures">
          <h3>Failure analysis</h3>
          {trace.run.failureClass ? (
            <IssueRow icon={<AlertTriangle size={16} />} title={trace.run.failureClass} detail={trace.run.failureMessage ?? "No message recorded"} />
          ) : (
            <p className="muted">No run-level failure.</p>
          )}
          {trace.issues.slice(0, 5).map((issue) => (
            <IssueRow key={issue.id} icon={<Terminal size={16} />} title={`${issue.type} ${issue.failureClass ?? ""}`} detail={issue.message} />
          ))}
        </section>

        <section className="panel">
          <h3>Network and console</h3>
          <IssueStat label="Network issues" value={networkIssues.length} />
          <IssueStat label="Console/page errors" value={consoleIssues.length} />
          <IssueStat label="Total issues" value={trace.issues.length} />
        </section>
      </section>

      <section className="panel" id="artifacts">
        <h3>Artifacts</h3>
        {screenshots.length === 0 ? <p className="muted">No screenshots captured.</p> : null}
        <div className="artifacts">
          {screenshots.map((artifact) => (
            <figure key={artifact.id}>
              {artifact.path ? <img src={`/api/artifact?path=${encodeURIComponent(artifact.path)}`} alt={artifact.label} /> : <Camera size={18} />}
              <figcaption>{artifact.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function IssueRow({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className="issueRow">
      {icon}
      <div>
        <strong>{title.trim()}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function IssueStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="issueStat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

function formatDuration(value?: number): string {
  if (typeof value !== "number") {
    return "-";
  }
  if (value < 1000) {
    return `${Math.round(value)}ms`;
  }
  return `${(value / 1000).toFixed(1)}s`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
