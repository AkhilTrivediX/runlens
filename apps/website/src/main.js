const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const demo = document.querySelector(".trace-demo");
const rows = [...document.querySelectorAll("[data-step]")];
const replay = document.getElementById("replay-run");
const replayLabel = replay.querySelector("span");
const replayStatus = document.getElementById("replay-status");
const detail = document.querySelector(".step-detail");
const scenarios = {
  selector: {
    kind: "selector_missing",
    message: "The checkout button could not be found.",
    selector: '[data-testid="place-order"]',
    evidence: "DOM snapshot captured",
    event: "Checkout button not found",
    dom: '<form data-testid="checkout">\n  <button data-testid="confirm-order">\n    Confirm order\n  </button>\n</form>',
    note: "The workflow expected place-order. The page has confirm-order.",
  },
  network: {
    kind: "network_failure",
    message: "The order request returned a server error.",
    selector: '[data-testid="place-order"]',
    evidence: "Failed request recorded",
    event: "POST /api/orders returned 503",
    dom: '<form data-testid="checkout">\n  <button data-testid="place-order">\n    Place order\n  </button>\n  <p role="alert">Try again later</p>\n</form>',
    note: "The selector exists. The failed request explains this run.",
  },
  session: {
    kind: "auth/session_expired",
    message: "The checkout session had expired.",
    selector: '[data-testid="place-order"]',
    evidence: "Page context captured",
    event: "Checkout redirected to sign in",
    dom: '<main>\n  <h1>Sign in to continue</h1>\n  <form data-testid="sign-in">\n    <input type="email" />\n  </form>\n</main>',
    note: "The captured page is the sign in screen rather than checkout.",
  },
};
let scenario = "selector",
  selected = 2,
  phase = -1,
  timer,
  playing = false,
  paused = false,
  barAnimation,
  detailAnimation;
const steps = [
  {
    kind: "navigation",
    status: "Passed step",
    message: "The storefront loaded and the heading was visible.",
    selector: 'page.goto("https://example.com")',
    evidence: "Navigation event recorded",
    time: "at 00:00.420",
  },
  {
    kind: "click",
    status: "Passed step",
    message: "The product was added to the basket.",
    selector: '[data-testid="add-to-basket"]',
    evidence: "Click event recorded",
    time: "at 00:00.600",
  },
];
function selectStep(index, animate = true) {
  selected = index;
  rows.forEach((row, i) => {
    row.classList.toggle("selected", i === index);
    row.setAttribute("aria-pressed", String(i === index));
  });
  const step =
    index === 2
      ? { ...scenarios[scenario], status: "Failed step", time: "at 00:03.200" }
      : steps[index];
  for (const key of [
    "kind",
    "status",
    "message",
    "selector",
    "evidence",
    "time",
  ])
    document.getElementById(`detail-${key}`).textContent = step[key];
  detail.classList.toggle("passed", index !== 2);
  document.getElementById("event-kind").textContent = scenarios[scenario].kind;
  document.getElementById("event-message").textContent =
    scenarios[scenario].event;
  document.getElementById("dom-code").textContent = scenarios[scenario].dom;
  document.getElementById("dom-note").textContent = scenarios[scenario].note;
  detailAnimation?.cancel();
  if (animate && !reduced.matches)
    detailAnimation = detail.animate(
      [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }],
      { duration: 300, easing: "cubic-bezier(.16,1,.3,1)" },
    );
}
function finishReplay() {
  clearTimeout(timer);
  barAnimation?.cancel();
  playing = paused = false;
  phase = -1;
  demo.classList.remove("replaying");
  rows.forEach((row) => row.classList.remove("pending", "capturing"));
  replayLabel.textContent = "Replay run";
  replayStatus.textContent = "Failure captured. Inspect the evidence.";
  demo.dataset.replay = "complete";
}
function pauseReplay() {
  if (!playing) return;
  clearTimeout(timer);
  barAnimation?.pause();
  playing = false;
  paused = true;
  replayLabel.textContent = "Resume replay";
  replayStatus.textContent = "Replay paused";
  demo.dataset.replay = "paused";
}
function advance() {
  if (!playing) return;
  phase++;
  if (phase > 2) {
    finishReplay();
    return;
  }
  selectStep(phase);
  rows.forEach((row, i) => {
    row.classList.toggle("pending", i > phase);
    row.classList.toggle("capturing", i === phase);
  });
  replayStatus.textContent = [
    "Opening storefront…",
    "Adding to basket…",
    "Capturing the breaking point…",
  ][phase];
  barAnimation?.cancel();
  if (!reduced.matches)
    barAnimation = rows[phase]
      .querySelector(".timing-fill")
      .animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
        duration: 700,
        easing: "cubic-bezier(.16,1,.3,1)",
        fill: "forwards",
      });
  timer = setTimeout(advance, reduced.matches ? 120 : 950);
}
function startReplay() {
  if (playing) {
    pauseReplay();
    return;
  }
  if (paused) {
    playing = true;
    paused = false;
    replayLabel.textContent = "Pause replay";
    replayStatus.textContent = "Continuing replay…";
    demo.dataset.replay = "playing";
    barAnimation?.play();
    timer = setTimeout(advance, reduced.matches ? 120 : 700);
    return;
  }
  playing = true;
  phase = -1;
  demo.classList.add("replaying");
  demo.dataset.replay = "playing";
  replayLabel.textContent = "Pause replay";
  evidenceTabs.activate(0);
  advance();
}
replay.addEventListener("click", startReplay);
rows.forEach((row, index) =>
  row.addEventListener("click", () => {
    finishReplay();
    selectStep(index);
  }),
);
document.querySelectorAll("[data-scenario]").forEach((button) =>
  button.addEventListener("click", () => {
    finishReplay();
    scenario = button.dataset.scenario;
    document.querySelectorAll("[data-scenario]").forEach((other) => {
      other.classList.toggle("active", other === button);
      other.setAttribute("aria-pressed", String(other === button));
    });
    selectStep(2);
    replayStatus.textContent =
      "Example changed. Replay or inspect this failure.";
  }),
);
function tabGroup(selector, onChange) {
  const tabs = [...document.querySelectorAll(selector)];
  function activate(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    onChange(tabs[index]);
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(index));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft")
        next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        activate(next, true);
      }
    });
  });
  return { activate };
}
const evidenceTabs = tabGroup("[data-evidence]", (tab) => {
  for (const name of ["detail", "events", "dom"])
    document.getElementById(`panel-${name}`).hidden =
      tab.dataset.evidence !== name;
});
const sourceCode = document.getElementById("setup-code").textContent;
function integrationCode(library) {
  const adapter =
    library === "playwright"
      ? "instrumentPlaywrightPage"
      : "instrumentPuppeteerPage";
  return `// Add to your existing ${library === "playwright" ? "Playwright" : "Puppeteer"} script\nimport { createRunLens } from "runlens";\nimport { ${adapter} }\n  from "runlens/adapters/${library}";\n\nconst trace = createRunLens({\n  project: "checkout", mode: "debugger",\n  storage: { type: "sqlite", path: ".runlens/runlens.db" }\n});\nconst run = await trace.startRun({ name: "checkout" });\nconst instrumentation = ${adapter}(page, run);\ntry {\n  await run.step("Open storefront", () => page.goto("https://example.com"));\n  await run.end();\n} catch (error) {\n  await run.end("failed");\n  throw error;\n} finally {\n  instrumentation.detach();\n  await trace.close();\n}`;
}
let copyTimer;
const copy = document.getElementById("copy-setup");
tabGroup("[data-integration]", (tab) => {
  const type = tab.dataset.integration;
  document.querySelector(".code-footer").hidden = type !== "source";
  document.getElementById("setup-code").textContent =
    type === "source" ? sourceCode : integrationCode(type);
  document.getElementById("code-caption").textContent =
    type === "source"
      ? "Start from source"
      : "Instrument an existing browser page";
  document
    .getElementById("integration-panel")
    .setAttribute("aria-labelledby", tab.id);
  clearTimeout(copyTimer);
  copy.textContent = type === "source" ? "Copy commands" : "Copy code";
  copy.setAttribute(
    "aria-label",
    type === "source" ? "Copy setup commands" : "Copy integration code",
  );
  document.getElementById("copy-status").textContent = "";
});
copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(
      document.getElementById("setup-code").textContent,
    );
    const label = copy.textContent;
    copy.textContent = "Copied";
    document.getElementById("copy-status").textContent = "Copied to clipboard.";
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copy.textContent = label;
    }, 2400);
  } catch {
    document.getElementById("copy-status").textContent =
      "Copy was blocked by your browser. Select the code above and copy it.";
  }
});
let autoStarted = false;
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.target === demo) {
        if (entry.isIntersecting && !autoStarted && !reduced.matches) {
          autoStarted = true;
          startReplay();
        } else if (!entry.isIntersecting) pauseReplay();
      } else if (entry.isIntersecting) {
        entry.target.classList.add("flow-visible");
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15 },
);
observer.observe(demo);
observer.observe(document.querySelector(".local-diagram"));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseReplay();
});
reduced.addEventListener("change", () => {
  if (reduced.matches) {
    finishReplay();
    selectStep(selected, false);
  }
});
let scrollQueued = false;
function updateProgress() {
  scrollQueued = false;
  const distance = document.documentElement.scrollHeight - innerHeight;
  document.querySelector(".reading-progress").style.transform =
    `scaleX(${distance > 0 ? scrollY / distance : 0})`;
}
addEventListener(
  "scroll",
  () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateProgress);
    }
  },
  { passive: true },
);
addEventListener("resize", updateProgress);
selectStep(2, false);
