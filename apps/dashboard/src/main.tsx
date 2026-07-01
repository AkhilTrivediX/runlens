import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Activity, AlertTriangle, Clock3, Database, Gauge, Search } from "lucide-react";
import "./styles.css";

const runs = [
  {
    name: "lead-extraction-flow",
    project: "example",
    status: "failed",
    duration: "18.4s",
    browser: "Chromium",
    mode: "debugger",
    failure: "selector_missing"
  },
  {
    name: "checkout-healthcheck",
    project: "commerce",
    status: "passed",
    duration: "7.2s",
    browser: "Chromium",
    mode: "silent",
    failure: "-"
  },
  {
    name: "session-refresh",
    project: "backoffice",
    status: "failed",
    duration: "31.0s",
    browser: "WebKit",
    mode: "silent",
    failure: "auth/session_expired"
  }
];

function App() {
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
          <a href="/">Failures</a>
          <a href="/">Artifacts</a>
          <a href="/">Metrics</a>
        </nav>
      </aside>
      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Local trace store</p>
            <h1>Automation runs</h1>
          </div>
          <div className="search">
            <Search size={16} />
            <span>Filter runs</span>
          </div>
        </header>

        <section className="metrics" aria-label="Reliability metrics">
          <article>
            <Gauge size={18} />
            <div>
              <span>Success rate</span>
              <strong>67%</strong>
            </div>
          </article>
          <article>
            <AlertTriangle size={18} />
            <div>
              <span>Top failure</span>
              <strong>selector_missing</strong>
            </div>
          </article>
          <article>
            <Clock3 size={18} />
            <div>
              <span>Slowest step</span>
              <strong>Open dashboard</strong>
            </div>
          </article>
          <article>
            <Activity size={18} />
            <div>
              <span>Events captured</span>
              <strong>1,248</strong>
            </div>
          </article>
        </section>

        <section className="runs" aria-label="Runs list">
          <div className="tableHeader">
            <span>Run</span>
            <span>Status</span>
            <span>Duration</span>
            <span>Browser</span>
            <span>Mode</span>
            <span>Failure</span>
          </div>
          {runs.map((run) => (
            <div className="row" key={run.name}>
              <span>
                <strong>{run.name}</strong>
                <small>{run.project}</small>
              </span>
              <span className={`pill ${run.status}`}>{run.status}</span>
              <span>{run.duration}</span>
              <span>{run.browser}</span>
              <span>{run.mode}</span>
              <span>{run.failure}</span>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

