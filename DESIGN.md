---
name: RunLens
description: A measured investigation instrument for browser automation runs.
colors:
  ink: "#203249"
  muted: "#526276"
  line: "#dce3ea"
  accent: "#255bd2"
  accent-wash: "#edf3ff"
  surface: "#fff"
  nav: "#182d49"
  pass: "#25715c"
  fail: "#b34a2a"
  fail-wash: "#fff3eb"
  workspace: "#eef1f4"
  text: "#243549"
  focus: "#8aacf4"
  field-line: "#cdd7e1"
  nav-text: "#becde1"
  nav-hover: "#263f5e"
  nav-active: "#e4edfc"
  nav-active-text: "#1d3b64"
  pass-wash: "#eef6f2"
  selected-failure: "#fff0e5"
  track: "#f0f3f7"
  timing-pass: "#73a897"
  timing-fail: "#cc7d5a"
  timing-running: "#759ae5"
  timing-skipped: "#9ca8b5"
  event-marker: "#243b52"
typography:
  headline:
    fontFamily: "Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "30px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  section:
    fontFamily: "Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 650
  body:
    fontFamily: "Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "normal"
  supporting:
    fontFamily: "Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 550
  measurement:
    fontFamily: "Cascadia Code, Consolas, monospace"
    fontSize: "10px"
    fontWeight: 400
  code:
    fontFamily: "Cascadia Code, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.75
rounded:
  micro: "3px"
  tag: "4px"
  state: "5px"
  control: "7px"
  field: "8px"
  evidence: "9px"
  radius: "14px"
spacing:
  tight: "4px"
  inline: "8px"
  compact: "10px"
  small: "12px"
  row: "16px"
  section: "20px"
  inspector: "22px"
  workspace: "30px"
components:
  button-follow:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  button-follow-active:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.accent}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  button-text:
    textColor: "{colors.accent}"
    padding: "9px 0"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "9px 10px"
  navigation-item:
    textColor: "{colors.nav-text}"
    rounded: "{rounded.field}"
    padding: "11px 12px"
  navigation-item-active:
    backgroundColor: "{colors.nav-active}"
    textColor: "{colors.nav-active-text}"
    rounded: "{rounded.field}"
    padding: "11px 12px"
  status-failed:
    backgroundColor: "{colors.fail-wash}"
    textColor: "{colors.fail}"
    rounded: "{rounded.state}"
    padding: "5px 7px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
  ledger-row-selected:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.ink}"
    padding: "16px 16px 15px"
  waterfall-row:
    rounded: "{rounded.state}"
    padding: "10px 7px"
---

# Design System: RunLens

## Overview

**Creative North Star: "The Investigation Instrument"**

RunLens uses the visual language of a measured browser run investigation instrument. Deep blue navigation anchors a pale steel workspace. Compact white surfaces hold runs, timing and evidence with clear boundaries. The atmosphere is calm and technical.

Selection connects the run ledger to the execution waterfall and its evidence. Blue identifies actions and selected context. Green and copper report recorded outcomes. Density supports investigation without making every datum compete for attention.

The identity uses an authored geometric vector mark and existing library icons. Product decoration contains no generated imagery. Screenshots belong to captured browser evidence and retain their real source.

**Key Characteristics:**

- Deep blue navigation and a pale steel workspace.
- Compact ledgers with a wider inspector.
- Measured timing lanes and linked evidence.
- Restrained colour with explicit status labels.
- Familiar interface type paired with precise code and timing type.

## Colors

The palette combines cool structural colours with green and copper outcome colours. The frontmatter is normative and preserves the implemented CSS values.

### Primary

- **Investigation Blue** (`accent`): actions, selected tabs, running status and focus within search.
- **Blue Wash** (`accent-wash`): selected runs, active following and running context.
- **Navigation Blue** (`nav`): the persistent navigation background.

### Secondary

- **Passed Green** (`pass`): successful outcomes and local store health.
- **Failed Copper** (`fail`): failed outcomes and error indicators.
- **Outcome Washes** (`pass-wash`, `fail-wash`): compact outcome and status containers.
- **Timing Colours** (`timing-pass`, `timing-fail`, `timing-running`, `timing-skipped`): measured waterfall bars. These lighter fills are paired with readable status icons and labels.

### Neutral

- **Pale Steel** (`workspace`): the page canvas.
- **White Surface** (`surface`): functional panels and controls.
- **Ink** (`ink`, `text`): headings and ordinary content.
- **Supporting Steel** (`muted`): supporting text, timestamps and placeholders. Use the final supporting colour from the frontmatter.
- **Structural Lines** (`line`, `field-line`): dividers and input boundaries.
- **Timing Track** (`track`): the lane behind a measured bar.
- **Event Ink** (`event-marker`): individual event markers within timing lanes.
- **Navigation States** (`nav-text`, `nav-hover`, `nav-active`, `nav-active-text`): readable navigation text with an explicit pale selected surface.
- **Focus Blue** (`focus`): visible keyboard outlines.

**The Recorded State Rule.** Use green and copper for recorded outcomes. Preserve status text or an accessible icon label alongside colour.

## Typography

**Interface Font:** Segoe UI with Helvetica, Arial and sans-serif fallbacks.

**Code and Measurement Font:** Cascadia Code with Consolas and monospace fallbacks.

The familiar interface stack keeps long run names readable. Monospace separates IDs, selectors, event payloads and timings from prose. Use tabular numbers for counters, facts and timestamps.

### Hierarchy

- **Headline:** the page heading uses the headline token. It reduces to 26px below 1000px, 25px below 760px and 23px below 420px.
- **Title:** the inspected run title uses the title token. It reduces to 19px below 760px.
- **Section:** compact panel and step headings use the section token. The general h2 default is 15px.
- **Body:** the root interface size uses the body token. Content rows and controls mainly use 12px or 13px.
- **Supporting:** introductory text uses the supporting token. Dense metadata generally uses 10px or 11px.
- **Label:** status labels use the label token. Case stays natural.
- **Measurement and Code:** durations use the measurement token. Error blocks use the code token. Selectors use the same family with a line height of 1.7.

**The Evidence Type Rule.** Keep IDs, selectors, payloads and measured durations in the implemented monospace stack. Allow long technical values to wrap.

## Layout

The desktop shell is a grid with a sticky navigation rail (218px) and a flexible workspace. The workspace has a maximum width of 1900px with 30px horizontal gutters. At 1650px and above the gutters become 45px. The ledger becomes 390px wide.

The investigation area uses a narrower ledger and a wider inspector. Its default columns are `minmax(285px, 0.36fr) minmax(0, 0.64fr)` with a 19px gap. Panels align at the top. The ledger scrolls internally after 756px of rows. Inspector sections use 22px horizontal padding.

At 1250px and below the rail is 185px wide. Gutters become 22px. Filters wrap with the status controls on a separate full width row. At 1000px and below the rail is 155px wide. Evidence stacks within the narrower inspector and waterfall timing tracks move below labels.

At 760px and below navigation becomes a horizontal top bar. The investigation columns stack with a ledger capped at 320px. Gutters become 18px. Waterfall lanes return beside step labels when space permits. At 420px and below gutters become 14px. Waterfall tracks sit under labels and evidence cards use one column.

Spacing is purpose based. Small inline gaps separate icons and labels. Larger spacing separates investigation sections. Preserve compact rows and readable wrapping rather than imposing a new uniform scale.

## Elevation & Depth

Depth comes from white surfaces on the pale steel canvas with thin structural borders. Large panels stay flat. A small shadow (`0 1px 3px #17334b14`) lifts the selected status filter from its shared track. Focus uses outlines rather than shadows.

**The Flat Panel Rule.** Keep ledger, inspector and reliability panels flat. Use borders and tonal selection to establish context.

State transitions change background, text and border colours over 0.18s with ease timing. The refresh indicator rotates over 1s with linear timing. Reduced motion disables transitions and animation.

## Shapes

Functional panels use the radius token. Fields and navigation items use the field token. Small controls use the control token. Status labels and waterfall rows use the state token. Evidence cards use the evidence token. Tiny badges and timing lanes use the micro and tag tokens.

The brand mark combines corner brackets, a central circle and short axial strokes. Use the authored vector geometry. Existing interface icons use restrained line strokes. Dividers and one pixel boundaries provide structure without decoration.

## Components

### Buttons

Following is a compact outlined control with the button-follow token. Its active state uses the button-follow-active token with a blue border. Text actions use button-text with an underline on hover. Icon buttons are small square controls (30px) with gently curved corners.

Hover generally changes the text to Investigation Blue. Keyboard focus uses a visible outline (3px) with a 3px offset. Disabled buttons reduce opacity to 0.55 and use a waiting cursor.

### Inputs / Fields

Search uses a white field with a structural border and the input-search token. Focus within changes the border to Investigation Blue and adds a 2px pale blue outline. Placeholder text uses Supporting Steel. The project selector matches the search field with an inset chevron and native select behaviour.

### Chips

Status labels combine a labelled icon with semantic text colour. The inspector adds a compact wash behind the status. Count badges use small neutral fills with tabular numbers. Status filters share a pale track. The selected filter becomes white with the small elevation shadow.

### Cards / Containers

Ledger, inspector and reliability panels use the panel token with a one pixel Structural Line border. Headers, bodies and footers are separated with dividers. Outcome notices use the matching state wash. Evidence cards have clipped previews and a border that turns blue on hover.

### Navigation

Navigation sits on Navigation Blue. The selected item uses a pale blue surface with dark blue text. Hover lightens the dark surface. Items pair icons with text and optional counts. Mobile keeps the brand and primary navigation across the top. Project navigation and footer information are hidden at that breakpoint.

### Run Ledger

Run rows pair status, name, project, timing and duration in a compact hierarchy. The selected row uses Blue Wash with a one pixel blue edge on the right. Hover uses a quiet neutral wash. Long run names wrap. Mobile hides the secondary workflow line while keeping status and duration visible.

### Execution Waterfall

Each row links step identity, a timing lane and duration. Bar offset and width come from recorded timing. Event markers share the same time axis. Selection reveals the matching selector, error, captured evidence and events. Failed selected steps use the selected-failure wash. Responsive layouts keep the timing lane visible below its label when the inspector is narrow.

### Linked Evidence and Events

Evidence uses real artifact previews with captions and links. Preview crops align to the top of the captured page. Event rows expose time and type first. Expanding an event reveals its summary and readable JSON payload. The chevron rotates when expanded. Preserve the surrounding run and step context.

## Do's and Don'ts

### Do:

- **Do** use blue to make selected context and available actions clear.
- **Do** keep outcome colour tied to recorded status with visible or accessible labels.
- **Do** retain measured waterfall timing and the connection between steps and evidence.
- **Do** wrap long technical values and preserve the implemented type families.
- **Do** use flat white panels with quiet borders on the steel workspace.
- **Do** honour visible focus and reduced motion behaviour.

### Don't:

- **Don't** add decorative shadows to the main investigation panels.
- **Don't** replace recorded artifacts with decorative or generated imagery.
- **Don't** use outcome colour without a status label or accessible icon label.
- **Don't** make supporting text paler than the final muted token.
- **Don't** separate step evidence from the selected execution context.
