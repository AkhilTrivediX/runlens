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
  {
    kind: "selector_missing",
    status: "Failed step",
    message: "The checkout button could not be found.",
    selector: '[data-testid="place-order"]',
    evidence: "DOM snapshot captured",
    time: "at 00:03.200",
  },
];
document.querySelectorAll("[data-step]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-step]").forEach((other) => {
      other.classList.toggle("selected", other === button);
      other.setAttribute("aria-pressed", String(other === button));
    });
    const step = steps[Number(button.dataset.step)];
    for (const key of [
      "kind",
      "status",
      "message",
      "selector",
      "evidence",
      "time",
    ])
      document.getElementById(`detail-${key}`).textContent = step[key];
    const detail = document.querySelector(".step-detail");
    detail.classList.toggle("passed", Number(button.dataset.step) !== 2);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
      detail.animate(
        [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)" }],
        { duration: 240, easing: "cubic-bezier(.16,1,.3,1)" },
      );
  });
});
const copy = document.getElementById("copy-setup");
copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(
      document.getElementById("setup-code").textContent,
    );
    copy.textContent = "Copied";
    document.getElementById("copy-status").textContent =
      "Setup commands copied.";
    setTimeout(() => {
      copy.textContent = "Copy commands";
    }, 2400);
  } catch {
    document.getElementById("copy-status").textContent =
      "Copy was blocked by your browser. Select the commands above and copy them.";
  }
});
