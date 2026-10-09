import {
  StrictMode,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Code2,
  Copy,
  FileText,
  Layers,
  Network,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  X,
  XCircle,
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
  stepId?: string;
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
  slowestSteps: Array<{
    name: string;
    averageDurationMs: number;
    count: number;
  }>;
  flakySelectors: Array<{
    selector: string;
    failures: number;
    attempts: number;
  }>;
}

function App() {
  const [runs, setRuns] = useState<TraceRun[]>([]);
  const [metrics, setMetrics] = useState<Metrics>();
  const [selectedId, setSelectedId] = useState<string>();
  const [trace, setTrace] = useState<RunTrace>();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [project, setProject] = useState("all");
  const [view, setView] = useState("explore");
  const [loading, setLoading] = useState(true);
  const [traceLoading, setTraceLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [traceError, setTraceError] = useState<string>();
  const [follow, setFollow] = useState(false);
  const [revision, setRevision] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>();
  const search = useRef<HTMLInputElement>(null);
  const refreshInFlight = useRef(false);

  async function refresh() {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setLoading(true);
    try {
      const [list, stats] = await Promise.all([
        fetchJson<{ runs: TraceRun[] }>("/api/runs"),
        fetchJson<{ metrics: Metrics }>("/api/metrics"),
      ]);
      setRuns(list.runs);
      setMetrics(stats.metrics);
      setSelectedId((current) =>
        list.runs.some((run) => run.id === current)
          ? current
          : list.runs[0]?.id,
      );
      setLastUpdated(new Date());
      setRevision((value) => value + 1);
      setError(undefined);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
      refreshInFlight.current = false;
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  useEffect(() => {
    if (!follow) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [follow]);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLSelectElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        setView("explore");
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);
  useEffect(() => {
    if (!selectedId) {
      setTrace(undefined);
      return;
    }
    const controller = new AbortController();
    setTraceLoading(true);
    setTraceError(undefined);
    void fetchJson<{ trace: RunTrace }>(
      `/api/runs/${encodeURIComponent(selectedId)}`,
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) setTrace(result.trace);
      })
      .catch((caught) => {
        if (!controller.signal.aborted) setTraceError(errorMessage(caught));
      })
      .finally(() => {
        if (!controller.signal.aborted) setTraceLoading(false);
      });
    return () => controller.abort();
  }, [selectedId, revision]);
  const projects = [...new Set(runs.map((run) => run.project))];
  const filtered = useMemo(
    () =>
      runs.filter(
        (run) =>
          (status === "all" || run.status === status) &&
          (project === "all" || run.project === project) &&
          [run.name, run.project, run.id, run.status, run.failureClass]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [runs, status, project, query],
  );
  useEffect(() => {
    if (filtered.length && !filtered.some((run) => run.id === selectedId))
      setSelectedId(filtered[0].id);
    if (!filtered.length) setSelectedId(undefined);
  }, [filtered, selectedId]);
  const activeTrace = trace?.run.id === selectedId ? trace : undefined;
  const reset = () => {
    setQuery("");
    setProject("all");
    setStatus("all");
  };
  function investigate(failureClass?: string) {
    setView("explore");
    setStatus("failed");
    setProject("all");
    setQuery(failureClass ?? "");
  }

  return (
    <main className="app">
      <a className="skipLink" href="#main-content">
        Skip to runs
      </a>
      <aside className="navigation" aria-label="Main navigation">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setView("explore");
            reset();
          }}
          aria-label="RunLens home"
        >
          <span className="brandMark">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M10 3H3v7M22 3h7v7M29 22v7h-7M3 22v7h7" />
              <circle cx="16" cy="16" r="6" />
              <path d="M16 7v3M16 22v3M7 16h3M22 16h3" />
            </svg>
          </span>
          <span>
            runlens<span className="brandDot">.</span>
          </span>
        </a>
        <div className="workspaceLabel">
          <span className="workspaceIcon">
            <Code2 size={16} />
          </span>
          <div>
            <strong>Local workspace</strong>
            <span>Browser automation</span>
          </div>
        </div>
        <nav>
          <button
            className={view === "explore" ? "navItem active" : "navItem"}
            onClick={() => setView("explore")}
            aria-current={view === "explore" ? "page" : undefined}
          >
            <Layers size={18} />
            Run explorer<span className="navCount">{runs.length}</span>
          </button>
          <button
            className={view === "reliability" ? "navItem active" : "navItem"}
            onClick={() => setView("reliability")}
            aria-current={view === "reliability" ? "page" : undefined}
          >
            <Activity size={18} />
            Reliability
          </button>
        </nav>
        <div className="projectNav">
          <h2>
            Projects <span>{projects.length}</span>
          </h2>
          {projects.map((name, index) => (
            <button
              key={name}
              className={
                project === name && view === "explore"
                  ? "projectLink chosen"
                  : "projectLink"
              }
              onClick={() => {
                setView("explore");
                setProject(name);
                setQuery("");
                setStatus("all");
              }}
            >
              <span className={`projectDot tone${index % 3}`} />
              <span>{name}</span>
              <span>{runs.filter((run) => run.project === name).length}</span>
            </button>
          ))}
        </div>
        <div className="navigationFoot">
          <div className="localNote">
            <ShieldCheck size={17} />
            <div>
              <strong>Your traces stay here.</strong>
              <p>Stored on this machine.</p>
            </div>
          </div>
          <a
            href="https://github.com/AkhilTrivediX/runlens/blob/main/docs/getting-started.md"
            target="_blank"
            rel="noreferrer"
          >
            <FileText size={16} />
            Documentation
            <ArrowUpRight size={14} />
          </a>
          <span className="version">
            RunLens 0.1.0<span>Local edition</span>
          </span>
        </div>
      </aside>
      <section className="mainContent" id="main-content">
        <header className="appHeader">
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} />
            <strong>
              {view === "explore" ? "Run explorer" : "Reliability"}
            </strong>
          </div>
          <div className="headerActions">
            <span className="storeState">
              <span
                className={error ? "statusDot failed" : "statusDot passed"}
              />
              {error
                ? "Connection interrupted"
                : lastUpdated
                  ? "Local store connected"
                  : "Connecting to store"}
            </span>
            <button
              className="iconButton refresh"
              onClick={() => {
                void refresh();
              }}
              disabled={loading}
              aria-label="Refresh traces"
            >
              <RefreshCw size={16} className={loading ? "spinning" : ""} />
            </button>
          </div>
        </header>
        <div className="pageHeading">
          <div>
            <h1>
              {view === "explore"
                ? "Every run tells a story."
                : "Know where reliability breaks."}
            </h1>
            <p>
              {view === "explore"
                ? "Follow the steps. Find the failure. See what the browser saw."
                : "Patterns across your stored runs, steps and selectors."}
            </p>
          </div>
          <button
            className={`followButton ${follow ? "following" : ""}`}
            onClick={() => setFollow(!follow)}
            aria-pressed={follow}
          >
            {follow ? <Pause size={14} /> : <Play size={14} />}{" "}
            {follow ? "Following runs" : "Follow runs"}
          </button>
        </div>
        {error && (
          <div className="errorNotice" role="alert">
            <XCircle size={18} />
            <div>
              <strong>Could not refresh traces</strong>
              <p>{error}. Check that the dashboard server is running.</p>
            </div>
            <button
              onClick={() => {
                void refresh();
              }}
            >
              Try again
            </button>
          </div>
        )}
        <div className="healthRibbon" aria-label="All stored run metrics">
          <div className="ribbonTitle">
            <Activity size={18} />
            <strong>Workspace health</strong>
            <span>All stored runs</span>
          </div>
          <div>
            <span>Success rate</span>
            <strong>
              {metrics?.totalRuns ? `${metrics.successRate}%` : "—"}
            </strong>
          </div>
          <div>
            <span>Passed</span>
            <strong className="successText">
              {metrics?.passedRuns ?? "—"}
            </strong>
          </div>
          <button onClick={() => investigate()}>
            <span>Failed</span>
            <strong className="failureText">
              {metrics?.failedRuns ?? "—"}
              <ArrowUpRight size={15} />
            </strong>
          </button>
          <div>
            <span>Total runs</span>
            <strong>{metrics?.totalRuns ?? "—"}</strong>
          </div>
        </div>
        {view === "reliability" ? (
          <Reliability metrics={metrics} investigate={investigate} />
        ) : (
          <>
            <RunHistory
              runs={runs.slice(0, 40)}
              selectedId={selectedId}
              onSelect={(id) => {
                reset();
                setSelectedId(id);
              }}
            />
            <div className="filterBar">
              <label className="searchBox">
                <Search size={17} />
                <input
                  ref={search}
                  aria-label="Search runs"
                  placeholder="Search runs or projects"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query ? (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <kbd>/</kbd>
                )}
              </label>
              <div className="statusFilters" aria-label="Filter by run status">
                {["all", "failed", "passed", "running"].map((item) => (
                  <button
                    key={item}
                    aria-pressed={status === item}
                    className={status === item ? "selected" : ""}
                    onClick={() => setStatus(item)}
                  >
                    {item === "all" ? "All runs" : humanise(item)}
                    <span>
                      {item === "all"
                        ? runs.length
                        : runs.filter((run) => run.status === item).length}
                    </span>
                  </button>
                ))}
              </div>
              <label className="projectSelect">
                <select
                  aria-label="Filter by project"
                  value={project}
                  onChange={(event) => setProject(event.target.value)}
                >
                  <option value="all">All projects</option>
                  {projects.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
                <ChevronDown size={14} />
              </label>
            </div>
            <div className="investigation">
              <section className="runLedger" aria-label="Runs list">
                <header className="sectionHeading">
                  <h2>
                    Run ledger <span>{filtered.length}</span>
                  </h2>
                  <span>Latest first</span>
                </header>
                <div className="ledgerRows">
                  {loading && !runs.length ? (
                    <Skeleton label="Loading runs" />
                  ) : !filtered.length ? (
                    <div className="emptyState">
                      <Layers size={26} />
                      <h3>
                        {runs.length
                          ? "No matching runs"
                          : "Your first run starts here"}
                      </h3>
                      <p>
                        {runs.length
                          ? "Try another search or clear your filters."
                          : "Instrument a Puppeteer or Playwright workflow to capture its first trace."}
                      </p>
                      {runs.length ? (
                        <button className="textButton" onClick={reset}>
                          Clear filters
                        </button>
                      ) : (
                        <code>
                          import &#123; createRunLens &#125; from "runlens";
                        </code>
                      )}
                    </div>
                  ) : (
                    filtered.map((run) => (
                      <button
                        key={run.id}
                        className={`ledgerRow ${selectedId === run.id ? "selected" : ""}`}
                        onClick={() => setSelectedId(run.id)}
                        aria-pressed={selectedId === run.id}
                      >
                        <StatusIcon status={run.status} />
                        <div className="runName">
                          <strong>{run.name}</strong>
                          <span>{run.project}</span>
                          <div>
                            <span>{run.environment.library ?? "custom"}</span>
                            <span>{formatTime(run.startedAt)}</span>
                          </div>
                        </div>
                        <div className="runMeta">
                          <span className={`statusLabel ${run.status}`}>
                            {humanise(run.status)}
                          </span>
                          <span>{formatDuration(run.durationMs)}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <footer>
                  Showing {runs.length} most recent stored runs
                  {lastUpdated && (
                    <span>
                      Refreshed{" "}
                      {lastUpdated.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </footer>
              </section>
              <Inspector
                key={selectedId ?? "empty"}
                trace={activeTrace}
                loading={traceLoading}
                error={traceError}
                retry={() => setRevision((value) => value + 1)}
              />
            </div>
          </>
        )}
        <footer className="pageFooter">
          <span>
            <ShieldCheck size={13} />
            Local traces. Nothing uploaded.
          </span>
          <span>
            {follow
              ? "Refreshes every 10 seconds"
              : "Refresh manually or follow new runs"}
          </span>
        </footer>
      </section>
    </main>
  );
}

function RunHistory({
  runs,
  selectedId,
  onSelect,
}: {
  runs: TraceRun[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const recent = [...runs].reverse();
  const max = Math.max(1, ...recent.map((run) => run.durationMs ?? 0));
  return (
    <section className="runHistory" aria-label="Recent run history">
      <div className="historyIntro">
        <h2>Run history</h2>
        <p>
          {runs.length
            ? `Last ${runs.length} captured runs`
            : "Waiting for the first trace"}
        </p>
        <div className="legend">
          <span>
            <i className="passed" />
            Passed
          </span>
          <span>
            <i className="failed" />
            Failed
          </span>
        </div>
      </div>
      <div className="historyChart">
        <div className="historyBars">
          {recent.map((run) => (
            <button
              key={run.id}
              className={`historyBar ${run.status} ${run.id === selectedId ? "selected" : ""}`}
              onClick={() => onSelect(run.id)}
              aria-label={`Inspect ${run.name}, ${run.status}, ${formatDuration(run.durationMs)}`}
              title={`${run.name} · ${run.status} · ${formatDuration(run.durationMs)}`}
            >
              <span
                style={{
                  height: `${Math.max(12, ((run.durationMs ?? 0) / max) * 100)}%`,
                }}
              />
            </button>
          ))}
        </div>
        <div className="historyAxis">
          <span>Older</span>
          <span>
            Height represents duration · maximum{" "}
            {runs.length ? formatDuration(max) : "—"}
          </span>
          <span>Latest</span>
        </div>
      </div>
    </section>
  );
}

function Inspector({
  trace,
  loading,
  error,
  retry,
}: {
  trace?: RunTrace;
  loading: boolean;
  error?: string;
  retry: () => void;
}) {
  const [tab, setTab] = useState("trace");
  const [stepId, setStepId] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  if (error)
    return (
      <section className="inspector">
        <div className="emptyState">
          <XCircle size={26} />
          <h2>Could not load this run</h2>
          <p>{error}</p>
          <button className="textButton" onClick={retry}>
            Try again
          </button>
        </div>
      </section>
    );
  if (!trace)
    return (
      <section className="inspector">
        {loading ? (
          <Skeleton label="Loading run trace" />
        ) : (
          <div className="emptyState">
            <Activity size={30} />
            <h2>A closer look at every step.</h2>
            <p>
              Select a run from the ledger to inspect its execution, signals and
              evidence.
            </p>
          </div>
        )}
      </section>
    );
  const selectedStep =
    trace.steps.find((step) => step.id === stepId) ??
    trace.steps.find((step) => step.status === "failed") ??
    trace.steps[0];
  const failed = trace.steps.filter((step) => step.status === "failed");
  const retries = trace.events.filter(
    (event) => event.type === "retry_attempt_failed",
  ).length;
  const screenshots = trace.artifacts.filter(
    (artifact) => artifact.type === "screenshot",
  );
  const related = selectedStep
    ? trace.artifacts.filter((artifact) => artifact.stepId === selectedStep.id)
    : [];
  const selectedEvents = selectedStep
    ? trace.events.filter((event) => event.stepId === selectedStep.id)
    : trace.events;
  function navigateTabs(event: ReactKeyboardEvent<HTMLDivElement>) {
    const ids = ["trace", "signals", "evidence"];
    const index = ids.indexOf(tab);
    const next =
      event.key === "ArrowRight"
        ? ids[(index + 1) % ids.length]
        : event.key === "ArrowLeft"
          ? ids[(index + ids.length - 1) % ids.length]
          : event.key === "Home"
            ? ids[0]
            : event.key === "End"
              ? ids[ids.length - 1]
              : undefined;
    if (!next) return;
    event.preventDefault();
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  }
  async function copyId() {
    try {
      await navigator.clipboard.writeText(trace!.run.id);
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(true);
    }
  }
  function exportTrace() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(trace, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${trace!.run.id}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="inspector" aria-label="Run inspector">
      <header className="inspectorHeader">
        <div className="inspectorContext">
          <span>{trace.run.project}</span>
          <span className={`statusLabel ${trace.run.status}`}>
            <StatusIcon status={trace.run.status} />
            {humanise(trace.run.status)}
          </span>
        </div>
        <h2>{trace.run.name}</h2>
        <div className="inspectorToolbar">
          <button
            className="runId"
            onClick={() => {
              void copyId();
            }}
            title="Copy full run ID"
          >
            {trace.run.id.slice(0, 16)}…
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          <span aria-live="polite">
            {copyError
              ? "Copy failed. ID shown below."
              : copied
                ? "Copied"
                : ""}
          </span>
          <button className="exportButton" onClick={exportTrace}>
            <ArrowDownToLine size={14} />
            Export trace
          </button>
        </div>
        {copyError && <code className="fullId">{trace.run.id}</code>}
        <div className="runFacts">
          <span>
            <Clock3 size={14} />
            {formatDuration(trace.run.durationMs)}
          </span>
          <span>
            <Code2 size={14} />
            {trace.run.environment.browserEngine ?? "Unknown browser"}
          </span>
          <span>
            <Layers size={14} />
            {trace.steps.length} steps
          </span>
          <span>{trace.run.mode} mode</span>
        </div>
      </header>
      <div
        className="inspectorTabs"
        role="tablist"
        aria-label="Run detail sections"
        onKeyDown={navigateTabs}
      >
        {[
          { id: "trace", name: "Execution trace", count: trace.steps.length },
          { id: "signals", name: "Signals", count: trace.issues.length },
          { id: "evidence", name: "Evidence", count: trace.artifacts.length },
        ].map((item) => (
          <button
            key={item.id}
            role="tab"
            id={`tab-${item.id}`}
            aria-controls={`panel-${item.id}`}
            aria-selected={tab === item.id}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
          >
            {item.name}
            <span>{item.count}</span>
          </button>
        ))}
      </div>
      <div
        className="inspectorBody"
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {tab === "trace" && (
          <>
            <div className={`outcome ${trace.run.status}`}>
              <StatusIcon status={trace.run.status} />
              <div>
                <strong>
                  {trace.run.status === "failed"
                    ? humanise(trace.run.failureClass ?? "Automation failure")
                    : trace.run.status === "passed"
                      ? "This run completed successfully"
                      : humanise(trace.run.status)}
                </strong>
                <p>
                  {trace.run.status === "failed"
                    ? `${failed.length} failed ${failed.length === 1 ? "step" : "steps"}${retries ? ` · ${retries} retry ${retries === 1 ? "attempt" : "attempts"}` : ""}. Select a step to inspect what happened.`
                    : trace.run.status === "passed"
                      ? `${trace.steps.length} steps completed. ${trace.issues.length ? `${trace.issues.length} signals were recorded for review.` : "No issues recorded."}`
                      : "The trace reflects the latest recorded state."}
                </p>
              </div>
            </div>
            <div className="traceHeading">
              <h3>Execution waterfall</h3>
              <span>Click a step to investigate</span>
            </div>
            <Waterfall
              trace={trace}
              selectedId={selectedStep?.id}
              onSelect={setStepId}
            />
            {selectedStep && (
              <section className="stepFocus">
                <div className="stepFocusTitle">
                  <StatusIcon status={selectedStep.status} />
                  <h3>{selectedStep.name}</h3>
                  <span>{formatDuration(selectedStep.durationMs)}</span>
                </div>
                {selectedStep.selector && (
                  <div className="selectorLine">
                    <span>Selector</span>
                    <code>{selectedStep.selector}</code>
                  </div>
                )}
                {selectedStep.failureMessage && (
                  <pre className="errorCode">
                    {cleanAnsi(selectedStep.failureMessage)}
                  </pre>
                )}
                <div className="stepEvidence">
                  <div>
                    <h4>
                      Captured evidence <span>{related.length}</span>
                    </h4>
                    {related.length ? (
                      <div className="evidencePreview">
                        {related
                          .filter((artifact) => artifact.type === "screenshot")
                          .slice(0, 1)
                          .map((artifact) => (
                            <a
                              href={artifactUrl(artifact)}
                              key={artifact.id}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={artifactUrl(artifact)}
                                alt={artifact.label}
                              />
                              <span>
                                {artifact.label}
                                <ArrowUpRight size={13} />
                              </span>
                            </a>
                          ))}
                        <button
                          className="textButton"
                          onClick={() => setTab("evidence")}
                        >
                          View all evidence
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    ) : (
                      <p className="quietText">
                        No artifact was captured for this step.
                      </p>
                    )}
                  </div>
                  <div>
                    <h4>
                      Step events <span>{selectedEvents.length}</span>
                    </h4>
                    <EventStream events={selectedEvents.slice(-4)} />
                  </div>
                </div>
              </section>
            )}
            <details className="allEvents">
              <summary>
                Full event stream <span>{trace.events.length} events</span>
              </summary>
              <EventStream events={trace.events} />
            </details>
          </>
        )}
        {tab === "signals" && (
          <>
            <div className="signalsSummary">
              <span>
                <Network size={16} />
                {
                  trace.issues.filter(
                    (issue) => issue.type === "network_failure",
                  ).length
                }{" "}
                network issues
              </span>
              <span>
                <Terminal size={16} />
                {
                  trace.issues.filter((issue) =>
                    ["console_error", "page_error"].includes(issue.type),
                  ).length
                }{" "}
                browser errors
              </span>
              <span>{retries} retries</span>
            </div>
            {trace.run.failureMessage && (
              <section className="signalItem">
                <h3>
                  Run failure · {humanise(trace.run.failureClass ?? "unknown")}
                </h3>
                <pre className="errorCode">
                  {cleanAnsi(trace.run.failureMessage)}
                </pre>
              </section>
            )}
            {trace.issues.length ? (
              trace.issues.map((issue) => (
                <article
                  className={`signalItem ${issue.severity}`}
                  key={issue.id}
                >
                  <div>
                    <span className={`severity ${issue.severity}`}>
                      {issue.severity}
                    </span>
                    <strong>{humanise(issue.type)}</strong>
                    <time>{formatTime(issue.timestamp)}</time>
                  </div>
                  <p>{cleanAnsi(issue.message)}</p>
                  {issue.url && <code>{issue.url}</code>}
                  {issue.failureClass && (
                    <span className="signalClass">
                      {humanise(issue.failureClass)}
                    </span>
                  )}
                </article>
              ))
            ) : (
              <div className="emptyState">
                <ShieldCheck size={28} />
                <h3>No issues recorded</h3>
                <p>
                  This run has no recorded network, console or automation
                  issues.
                </p>
              </div>
            )}
          </>
        )}
        {tab === "evidence" && (
          <>
            <div className="traceHeading">
              <h3>What the browser saw</h3>
              <span>
                {screenshots.length} screenshots ·{" "}
                {trace.artifacts.length - screenshots.length} other files
              </span>
            </div>
            {!trace.artifacts.length && (
              <div className="emptyState">
                <FileText size={28} />
                <h3>No evidence captured</h3>
                <p>
                  Debugger mode captures screenshots after steps and DOM
                  snapshots when a step fails.
                </p>
              </div>
            )}
            <div className="artifactGallery">
              {trace.artifacts.map((artifact) => (
                <a
                  className="artifact"
                  key={artifact.id}
                  href={artifact.path ? artifactUrl(artifact) : undefined}
                  target="_blank"
                  rel="noreferrer"
                >
                  {artifact.type === "screenshot" && artifact.path ? (
                    <img
                      src={artifactUrl(artifact)}
                      alt={artifact.label}
                      loading="lazy"
                    />
                  ) : (
                    <div className="filePreview">
                      <FileText size={28} />
                      <span>{humanise(artifact.type)}</span>
                    </div>
                  )}
                  <div>
                    <strong>{artifact.label}</strong>
                    <span>
                      {formatTime(artifact.createdAt)}
                      <ArrowUpRight size={13} />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
      <footer className="inspectorFooter">
        <span>Captured {formatDate(trace.run.startedAt)}</span>
        <span>Trace schema 0.1.0</span>
      </footer>
    </section>
  );
}

function Waterfall({
  trace,
  selectedId,
  onSelect,
}: {
  trace: RunTrace;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const start = new Date(trace.run.startedAt).getTime();
  const total = Math.max(
    1,
    trace.run.durationMs ??
      Math.max(
        1,
        ...trace.steps.map(
          (step) => new Date(step.endedAt ?? step.startedAt).getTime() - start,
        ),
      ),
  );
  return (
    <div className="waterfall">
      <div className="waterfallScale">
        <span>Step</span>
        <div>
          <span>0</span>
          <span>{formatDuration(total / 2)}</span>
          <span>{formatDuration(total)}</span>
        </div>
        <span>Duration</span>
      </div>
      {trace.steps.length ? (
        trace.steps.map((step, index) => {
          const offset = Math.max(
            0,
            new Date(step.startedAt).getTime() - start,
          );
          const left = Math.min(99, (offset / total) * 100);
          const width = Math.max(
            0.8,
            Math.min(100 - left, ((step.durationMs ?? 0) / total) * 100),
          );
          return (
            <button
              className={`waterfallRow ${step.status} ${step.id === selectedId ? "selected" : ""}`}
              key={step.id}
              onClick={() => onSelect(step.id)}
              aria-pressed={step.id === selectedId}
            >
              <span className="stepLabel">
                <span className="stepIndex">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <StatusIcon status={step.status} />
                <span>{step.name}</span>
              </span>
              <span className="waterfallTrack">
                <span
                  className="waterfallBar"
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
                {trace.events
                  .filter((event) => event.stepId === step.id)
                  .map((event) => (
                    <i
                      key={event.id}
                      style={{
                        left: `${Math.max(0, Math.min(99, ((new Date(event.timestamp).getTime() - start) / total) * 100))}%`,
                      }}
                      title={humanise(event.type)}
                    />
                  ))}
              </span>
              <span className="stepDuration">
                {formatDuration(step.durationMs)}
              </span>
            </button>
          );
        })
      ) : (
        <p className="quietText">No steps were recorded for this run.</p>
      )}
      <div className="waterfallLegend">
        <span>
          <i />
          Event markers
        </span>
        <span>Positions reflect recorded timing</span>
      </div>
    </div>
  );
}
function EventStream({ events }: { events: TraceEvent[] }) {
  return (
    <div className="eventStream">
      {events.length ? (
        [...events].reverse().map((event) => (
          <details key={event.id}>
            <summary>
              <ChevronRight size={12} className="eventChevron" />
              <time>{formatTime(event.timestamp)}</time>
              <strong>{humanise(event.type)}</strong>
            </summary>
            <p>{payloadSummary(event.payload)}</p>
            <pre className="eventPayload">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </details>
        ))
      ) : (
        <p className="quietText">No events recorded.</p>
      )}
    </div>
  );
}
function Reliability({
  metrics,
  investigate,
}: {
  metrics?: Metrics;
  investigate: (failureClass?: string) => void;
}) {
  return (
    <div className="reliabilityView">
      <section>
        <header className="sectionHeading">
          <h2>Failure patterns</h2>
          <span>Across all stored runs</span>
        </header>
        {metrics?.commonFailureClasses.length ? (
          metrics.commonFailureClasses.map((item) => (
            <button
              className="failurePattern"
              key={item.failureClass}
              onClick={() => investigate(item.failureClass)}
            >
              <span>
                <XCircle size={18} />
                <strong>{humanise(item.failureClass)}</strong>
              </span>
              <span>
                {item.count} runs
                <ArrowUpRight size={16} />
              </span>
            </button>
          ))
        ) : (
          <div className="emptyState">
            <ShieldCheck size={28} />
            <h3>No classified failures</h3>
            <p>Failure patterns appear after a run records a failure class.</p>
          </div>
        )}
      </section>
      <section>
        <header className="sectionHeading">
          <h2>Selector watchlist</h2>
          <span>Failed step attempts</span>
        </header>
        {metrics?.flakySelectors.length ? (
          metrics.flakySelectors.map((item) => (
            <div className="selectorWatch" key={item.selector}>
              <code>{item.selector}</code>
              <span>
                <strong>{item.failures}</strong> failed of {item.attempts}{" "}
                attempts
              </span>
            </div>
          ))
        ) : (
          <p className="quietText">
            No selectors with failed attempts recorded.
          </p>
        )}
      </section>
      <section>
        <header className="sectionHeading">
          <h2>Steps taking the most time</h2>
          <span>Average recorded duration</span>
        </header>
        {metrics?.slowestSteps.map((item, index) => (
          <div className="slowStep" key={item.name}>
            <span>{index + 1}</span>
            <strong>{item.name}</strong>
            <span>{item.count} samples</span>
            <strong>{formatDuration(item.averageDurationMs)}</strong>
          </div>
        ))}
        {!metrics?.slowestSteps.length && (
          <p className="quietText">
            Step timings will appear after a workflow runs.
          </p>
        )}
      </section>
    </div>
  );
}
function Skeleton({ label }: { label: string }) {
  return (
    <div className="skeleton" role="status" aria-label={label}>
      <div />
      <div />
      <div />
      <p>{label}…</p>
    </div>
  );
}
function StatusIcon({ status }: { status: string }) {
  const Icon =
    status === "passed"
      ? CheckCircle2
      : status === "failed"
        ? XCircle
        : status === "running"
          ? Activity
          : Circle;
  return (
    <Icon
      className={`stateIcon ${status}`}
      size={16}
      aria-label={humanise(status)}
    />
  );
}
function humanise(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("/", " / ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}
function cleanAnsi(value: string) {
  return value.replace(/\x1b\[[0-9;]*m/g, "");
}
function errorMessage(value: unknown) {
  return value instanceof Error ? value.message : String(value);
}
function artifactUrl(artifact: TraceArtifact) {
  return `/api/artifact?path=${encodeURIComponent(artifact.path ?? "")}`;
}
async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok)
    throw new Error(
      `Server returned ${response.status} ${response.statusText}`,
    );
  return (await response.json()) as T;
}
function formatDuration(value?: number) {
  return typeof value !== "number"
    ? "—"
    : value < 1000
      ? `${Math.round(value)} ms`
      : `${(value / 1000).toFixed(2)} s`;
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
function payloadSummary(payload: Record<string, unknown>) {
  return Object.entries(payload)
    .filter(([, value]) => value !== undefined && value !== null)
    .slice(0, 3)
    .map(
      ([key, value]) =>
        `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`,
    )
    .join(" · ");
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
