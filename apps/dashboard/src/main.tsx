import { StrictMode, useEffect, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Camera,
  CheckCircle2,
  Clock3,
  Database,
  Gauge,
  GitBranch,
  Network,
  Radio,
  Route,
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
  endedAt?: string;
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

interface TraceEvent {
  id: string;
  stepId?: string;
  type: string;
  timestamp: string;
  payload: Record<string, unknown>;
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
  events: TraceEvent[];
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
          <a className="active" href="#runs">
            Runs
          </a>
          <a href="#monitoring">Monitor</a>
          <a href="#timeline">Timeline</a>
          <a href="#failures">Failures</a>
          <a href="#artifacts">Artifacts</a>
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
        <MonitoringBoard runs={runs} metrics={metrics} trace={trace} />

        <section className="workspace" id="runs">
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
    <section className="metrics" aria-label="Reliability metrics">
      <Metric icon={<Gauge size={18} />} label="Success rate" value={`${metrics?.successRate ?? 0}%`} />
      <Metric icon={<CheckCircle2 size={18} />} label="Passed runs" value={`${metrics?.passedRuns ?? 0}/${metrics?.totalRuns ?? 0}`} />
      <Metric icon={<AlertTriangle size={18} />} label="Top failure" value={topFailure ? `${topFailure.failureClass} (${topFailure.count})` : "-"} />
      <Metric icon={<Clock3 size={18} />} label="Slowest step" value={slowest ? `${slowest.name} ${formatDuration(slowest.averageDurationMs)}` : "-"} />
    </section>
  );
}

function MonitoringBoard({ runs, metrics, trace }: { runs: TraceRun[]; metrics?: Metrics; trace?: RunTrace }) {
  const projects = new Set(runs.map((run) => run.project)).size;
  const lastRun = runs[0];
  const failedRecent = runs.slice(0, 12).filter((run) => run.status === "failed").length;
  const health = Math.round(metrics?.successRate ?? 0);

  return (
    <section className="monitoringGrid" id="monitoring" aria-label="Monitoring overview">
      <article className="monitorCard wide">
        <div className="panelHeader">
          <span>
            <Radio size={16} />
            Health stream
          </span>
          <strong>{health}%</strong>
        </div>
        <RunTrend runs={runs} />
      </article>

      <article className="monitorCard">
        <div className="panelHeader">
          <span>
            <GitBranch size={16} />
            Coverage
          </span>
        </div>
        <div className="monitorStats">
          <Summary label="Projects" value={`${projects}`} />
          <Summary label="Recent failures" value={`${failedRecent}`} />
          <Summary label="Last run" value={lastRun ? timeAgo(lastRun.startedAt) : "-"} />
        </div>
      </article>

      <article className="monitorCard">
        <div className="panelHeader">
          <span>
            <BarChart3 size={16} />
            Failure mix
          </span>
        </div>
        <FailureDistribution metrics={metrics} />
      </article>

      <article className="monitorCard">
        <div className="panelHeader">
          <span>
            <Route size={16} />
            Selector watchlist
          </span>
        </div>
        <SelectorWatchlist metrics={metrics} />
      </article>

      <article className="monitorCard">
        <div className="panelHeader">
          <span>
            <Network size={16} />
            Active run signals
          </span>
        </div>
        <ActiveSignals trace={trace} />
      </article>
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

function RunTrend({ runs }: { runs: TraceRun[] }) {
  const recent = runs.slice(0, 18).reverse();
  const maxDuration = Math.max(1, ...recent.map((run) => run.durationMs ?? 1));

  if (recent.length === 0) {
    return <p className="muted">No run trend yet.</p>;
  }

  return (
    <div className="trendBars">
      {recent.map((run) => (
        <span
          className={`trendBar ${run.status}`}
          key={run.id}
          style={{ height: `${Math.max(16, ((run.durationMs ?? 1) / maxDuration) * 86)}%` }}
          title={`${run.project}: ${run.status} in ${formatDuration(run.durationMs)}`}
        />
      ))}
    </div>
  );
}

function FailureDistribution({ metrics }: { metrics?: Metrics }) {
  const failures = metrics?.commonFailureClasses ?? [];
  const max = Math.max(1, ...failures.map((failure) => failure.count));

  if (failures.length === 0) {
    return <p className="muted">No failure classes recorded.</p>;
  }

  return (
    <div className="barList">
      {failures.slice(0, 4).map((failure) => (
        <div className="barRow" key={failure.failureClass}>
          <span>{failure.failureClass}</span>
          <div>
            <i style={{ width: `${Math.max(8, (failure.count / max) * 100)}%` }} />
          </div>
          <strong>{failure.count}</strong>
        </div>
      ))}
    </div>
  );
}

function SelectorWatchlist({ metrics }: { metrics?: Metrics }) {
  const selectors = metrics?.flakySelectors ?? [];

  if (selectors.length === 0) {
    return <p className="muted">No flaky selectors detected.</p>;
  }

  return (
    <div className="watchlist">
      {selectors.slice(0, 3).map((selector) => (
        <div key={selector.selector}>
          <strong>{selector.selector}</strong>
          <span>
            {selector.failures}/{selector.attempts} failed attempts
          </span>
        </div>
      ))}
    </div>
  );
}

function ActiveSignals({ trace }: { trace?: RunTrace }) {
  if (!trace) {
    return <p className="muted">Select a run to inspect signals.</p>;
  }

  const network = trace.issues.filter((issue) => issue.type === "network_failure").length;
  const consoleErrors = trace.issues.filter((issue) => issue.type === "console_error" || issue.type === "page_error").length;
  const retries = trace.events.filter((event) => event.type === "retry_attempt_failed").length;

  return (
    <div className="signalGrid">
      <Summary label="Events" value={`${trace.events.length}`} />
      <Summary label="Network" value={`${network}`} />
      <Summary label="Console" value={`${consoleErrors}`} />
      <Summary label="Retries" value={`${retries}`} />
    </div>
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

      <section className="panel" id="timeline">
        <h3>Graph timeline</h3>
        <StepGraph trace={trace} />
      </section>

      <section className="detailGrid">
        <section className="panel">
          <h3>Step trace</h3>
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

        <section className="panel">
          <h3>Event stream</h3>
          <EventStream events={trace.events} />
        </section>
      </section>

      <section className="detailGrid">
        <section className="panel" id="failures">
          <h3>Failure analysis</h3>
          {trace.run.failureClass ? (
            <IssueRow icon={<AlertTriangle size={16} />} title={trace.run.failureClass} detail={trace.run.failureMessage ?? "No message recorded"} />
          ) : (
            <p className="muted">No run-level failure.</p>
          )}
          {trace.issues.slice(0, 6).map((issue) => (
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

function StepGraph({ trace }: { trace: RunTrace }) {
  const runStart = new Date(trace.run.startedAt).getTime();
  const totalMs = Math.max(
    1,
    trace.run.durationMs ??
      Math.max(
        ...trace.steps.map((step) => new Date(step.endedAt ?? step.startedAt).getTime() - runStart + (step.durationMs ?? 0)),
        1
      )
  );

  return (
    <div className="graphTimeline">
      <div className="graphScale">
        <span>0ms</span>
        <span>{formatDuration(totalMs)}</span>
      </div>
      {trace.steps.map((step) => {
        const offset = Math.max(0, new Date(step.startedAt).getTime() - runStart);
        const left = Math.min(96, (offset / totalMs) * 100);
        const width = Math.max(4, Math.min(100 - left, ((step.durationMs ?? 1) / totalMs) * 100));
        const stepEvents = trace.events.filter((event) => event.stepId === step.id);

        return (
          <div className="graphRow" key={step.id}>
            <span>{step.name}</span>
            <div className="graphTrack">
              <i className={`graphBar ${step.status}`} style={{ left: `${left}%`, width: `${width}%` }} />
              {stepEvents.slice(0, 8).map((event) => {
                const eventOffset = Math.max(0, new Date(event.timestamp).getTime() - runStart);
                return <b key={event.id} style={{ left: `${Math.min(99, (eventOffset / totalMs) * 100)}%` }} title={event.type} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EventStream({ events }: { events: TraceEvent[] }) {
  const visibleEvents = events.slice(-14).reverse();

  if (visibleEvents.length === 0) {
    return <p className="muted">No events recorded.</p>;
  }

  return (
    <div className="eventStream">
      {visibleEvents.map((event) => (
        <div key={event.id}>
          <span>{formatTime(event.timestamp)}</span>
          <strong>{event.type}</strong>
          <p>{payloadSummary(event.payload)}</p>
        </div>
      ))}
    </div>
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

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function timeAgo(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  if (diffMs < 60_000) {
    return "now";
  }
  if (diffMs < 3_600_000) {
    return `${Math.round(diffMs / 60_000)}m ago`;
  }
  if (diffMs < 86_400_000) {
    return `${Math.round(diffMs / 3_600_000)}h ago`;
  }
  return `${Math.round(diffMs / 86_400_000)}d ago`;
}

function payloadSummary(payload: Record<string, unknown>): string {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined && value !== null);
  if (entries.length === 0) {
    return "-";
  }

  return entries
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value).slice(0, 48)}`)
    .join(" | ");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

