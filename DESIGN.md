---
name: RunLens
description: A signal desk for browser run investigation.
colors:
  ink: "#29282d"
  muted: "#66616b"
  line: "#dedbdc"
  accent: "#6344c5"
  accent-wash: "#f0eafa"
  surface: "#fff"
  nav: "#ffffff"
  pass: "#267163"
  fail: "#b52e57"
  fail-wash: "#fceef3"
  workspace: "#f2f1ee"
  text: "#262529"
  focus: "#a98eea"
  field-line: "#d7d2db"
  filter-text: "#514b5a"
  filter-track: "#e7e3eb"
  nav-hover: "#f4f1f8"
  nav-active: "#eee7fb"
  nav-active-text: "#5435ac"
  ledger-surface: "#fbfaf8"
  ledger-selected: "#ede6fa"
  history-plum: "#332849"
  history-text: "#d3c8e3"
  history-pass: "#a8dacd"
  history-fail: "#eea4bf"
  history-running: "#c1b1f4"
  history-cancelled: "#bdb6c7"
  history-hover: "#665477"
  pass-wash: "#eef6f2"
  selected-failure: "#f9e6ef"
  track: "#f0f3f7"
  timing-pass: "#67a294"
  timing-fail: "#cb6985"
  timing-running: "#759ae5"
  timing-skipped: "#9ca8b5"
  event-marker: "#243b52"
typography:
  headline:
    fontFamily: "\"Bricolage Grotesque\", sans-serif"
    fontSize: "52px"
    fontWeight: 750
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  title:
    fontFamily: "\"Bricolage Grotesque\", sans-serif"
    fontSize: "25px"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  section:
    fontFamily: "\"Bricolage Grotesque\", sans-serif"
    fontSize: "14px"
    fontWeight: 650
  body:
    fontFamily: "\"Bricolage Grotesque\", sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "normal"
  supporting:
    fontFamily: "\"Bricolage Grotesque\", sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "\"Bricolage Grotesque\", sans-serif"
    fontSize: "11px"
    fontWeight: 550
  measurement:
    fontFamily: "\"Bricolage Grotesque\", sans-serif"
    fontSize: "11px"
    fontWeight: 400
  code:
    fontFamily: "monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.75
rounded:
  micro: "3px"
  tag: "4px"
  state: "5px"
  control: "6px"
  code: "7px"
  radius: "8px"
  evidence: "9px"
  frame: "10px"
  instrument: "11px"
spacing:
  tight: "4px"
  inline: "8px"
  compact: "10px"
  small: "12px"
  row: "18px"
  section: "20px"
  inspector: "28px"
  workspace: "36px"
components:
  button-follow:
    backgroundColor: "{colors.surface}"
    textColor: "#514958"
    rounded: "{rounded.control}"
    padding: "9px 11px"
  button-follow-active:
    backgroundColor: "{colors.nav-active}"
    textColor: "{colors.nav-active-text}"
    rounded: "{rounded.control}"
    padding: "9px 11px"
  button-text:
    textColor: "{colors.accent}"
    padding: "9px 0"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 10px"
  navigation-item-active:
    backgroundColor: "{colors.nav-active}"
    textColor: "{colors.nav-active-text}"
    rounded: "{rounded.control}"
    padding: "10px 13px"
  status-failed:
    backgroundColor: "{colors.fail-wash}"
    textColor: "{colors.fail}"
    rounded: "{rounded.state}"
    padding: "5px 7px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.frame}"
  ledger-row-selected:
    backgroundColor: "{colors.ledger-selected}"
    textColor: "{colors.ink}"
    padding: "17px 18px"
  waterfall-row:
    rounded: "{rounded.state}"
    padding: "10px 7px"
  history-instrument:
    backgroundColor: "{colors.history-plum}"
    textColor: "{colors.surface}"
    rounded: "{rounded.instrument}"
    padding: "23px 25px 18px"
---

# Design System: RunLens

## Overview

**Creative North Star: "The Signal Desk"**

RunLens is a signal desk for browser run investigation. Bricolage Grotesque gives the interface a clear product voice. A white horizontal header opens onto a warm grey workspace. Large confident headings sit above compact technical content.

The plum history instrument pairs mint and pink timing bars with recorded status. Violet carries actions and selection. The ledger and inspector share one continuous frame so runs, steps and evidence remain connected.

The identity uses an authored geometric vector mark and existing library icons. Images are real captured browser evidence and review screenshots. No generated imagery is part of the interface.

**Key Characteristics:**

- Locally served Bricolage Grotesque with a strong headline.
- White horizontal navigation and warm grey workspace.
- Plum history instrumentation with mint and pink bars.
- A continuous ledger and inspector frame.
- Measured timing with linked browser evidence.

## Colors

Warm neutrals support violet interaction and plum instrumentation. The frontmatter records the actual implementation.

### Primary

- **Violet** (`accent`): actions, selected tabs, running status and the product mark.
- **Violet Washes** (`accent-wash`, `nav-active`, `ledger-selected`): explicit selected context.

### Secondary

- **Plum Instrument** (`history-plum`): the duration history surface.
- **Mint and Pink** (`history-pass`, `history-fail`): recorded history outcomes on plum.
- **Passed Green and Failed Pink** (`pass`, `fail`): readable status labels on light surfaces.
- **Timing Fills** (`timing-pass`, `timing-fail`, `timing-running`, `timing-skipped`): measured execution bars.
- **Outcome Washes** (`pass-wash`, `fail-wash`, `selected-failure`): outcome notices and selected failed steps.

### Neutral

- **Warm Workspace** (`workspace`): page background.
- **White Surface** (`surface`, `nav`): navigation and inspector.
- **Warm Ledger** (`ledger-surface`): the joined run list.
- **Ink and Supporting Grey** (`ink`, `text`, `muted`): headings, content and metadata.
- **Filter Ink** (`filter-text`): filter labels and their counts. This is the corrected contrast value.
- **Structural Lines** (`line`, `field-line`): dividers and field boundaries.
- **Focus Violet** (`focus`): visible keyboard outlines.

**The Recorded State Rule.** Outcome colours report stored status. Keep a visible label or accessible icon label alongside colour.

## Typography

**Interface Font:** Bricolage Grotesque with a sans-serif fallback. The variable font is served locally from `/fonts/bricolage-grotesque.ttf` with weights 200 through 800 and `font-display: swap`. Its OFL licence sits beside the font.

**Code Font:** Browser monospace defaults for code and preformatted content. No named code family is declared. Durations, IDs and step indices use the interface family. Counters and timestamps use tabular numbers where declared.

### Hierarchy

- **Headline:** the headline token gives the page its identity. It reduces to 44px below 1200px, 39px below 760px and 36px below 450px.
- **Title:** the inspected run uses the title token. It reduces to 23px below 1200px and 21px below 950px. The stacked mobile inspector uses 24px below 760px and 22px below 450px.
- **Section:** execution headings use 14px. Step detail headings use 15px. Smaller panel and evidence headings use 13px.
- **Body and Supporting:** the root size is 14px. Introductory text uses the supporting token with a maximum width of 38ch on desktop.
- **Label and Measurement:** compact status and duration text uses 11px. Dense event timestamps use 10px.
- **Code:** desktop error blocks and selectors use 12px. Error blocks reduce to 11px below 760px. Technical strings wrap.

## Layout

The shell has a sticky white horizontal navigation bar (76px). The workspace has a maximum width of 1680px with 36px horizontal gutters. Wide screens at 1650px use 48px gutters and a 375px ledger.

The overview combines a heading and inline health measures on the left with the plum history instrument on the right. The default overview columns are `minmax(0, 1fr) minmax(430px, 1.15fr)` with a 32px gap. Filters sit below this area.

Ledger and inspector share a white frame with no gap. The default ledger is 330px wide. Its warm surface and right divider define the pane without a separate rounded card. Inspector padding is 28px. Ledger rows scroll after 890px.

At 1250px status filters wrap onto a full width row. At 1200px gutters become 24px, overview columns become equal and the ledger becomes 300px. At 950px the ledger becomes 270px. Waterfall tracks move below labels and step evidence stacks.

At 760px the overview and investigation stack. The history instrument moves below the health measures. Navigation is 65px tall. Gutters become 18px and the ledger scroll cap becomes 315px. Waterfall lanes return beside labels when space permits. At 450px gutters become 14px and timing tracks move below labels again. Earlier 420px adaptations also narrow search and project fields and stack artifact cards.

## Elevation & Depth

Depth comes from surface colour and borders. The investigation frame, navigation and filters have no shadows. The plum instrument provides the strongest tonal contrast. Selected status filters are white within their muted track.

**The Continuous Frame Rule.** Keep ledger and inspector joined. Use a divider and surface tone to define their roles.

Controls transition background, text and border colours over 0.18s with ease timing. The refresh icon rotates over 1s with linear timing. Reduced motion disables transitions and animation.

## Shapes

Controls use compact corners from the control token. The joined investigation frame uses the frame token. The plum instrument uses the instrument token. Small statuses use the state token. Reliability panels retain the radius token.

The brand mark is a white geometric lens inside a violet square with rounded corners and a small rotation. Thin dividers, restrained line icons and narrow timing bars support the instrument language.

## Components

### Buttons

Following uses a white outlined control. Active following uses the selected navigation wash with violet text. Text actions underline on hover. Icon buttons remain compact squares. Keyboard focus uses a 3px outline with a 3px offset. Disabled buttons have 0.55 opacity.

### Inputs / Fields

Search and project selection use white fields with warm borders and compact corners. Search has a 40px minimum height and a 360px maximum width on desktop. Focus within uses a violet border and the existing pale blue outline (2px). Placeholder text uses the muted token.

### Navigation

Horizontal navigation pairs icons and text. Selected items use a violet wash and dark violet text. Hover uses a quiet tinted background. Count badges use a small violet fill. The local workspace label hides below 1200px. Mobile hides counts and reduces documentation to its icon.

### Chips

Status labels pair semantic colour with icons and readable names. The inspector adds a wash behind status. Filters share a muted track with a white selected segment. Both filter labels and counts use the corrected filter-text token.

### Cards / Containers

The investigation frame joins a warm ledger and white inspector. Reliability sections remain independent bordered panels. Outcome notices use compact tinted containers. Evidence cards clip real screenshots with their crops aligned to the top.

### History Instrument

The plum surface holds a title, outcome legend, duration bars and timestamps. Mint marks passed runs and pink marks failed runs. Running and cancelled states use their separate light fills. Hover and selection highlight the full bar lane. A white dot marks the selected run. Values come from stored timings.

### Execution Waterfall and Evidence

Step identity, measured time lane and duration form each row. Offsets and widths come from recorded timing. Event markers use the same axis. Selection exposes the matching selector, error, screenshot and events. Failed selected steps use a pink wash. Event expansion reveals readable JSON with a rotating chevron.

## Do's and Don'ts

### Do:

- **Do** use the local Bricolage Grotesque font for the interface.
- **Do** use violet for actions and selected context.
- **Do** pair outcome colour with visible or accessible status labels.
- **Do** preserve recorded timing and linked step evidence.
- **Do** keep the ledger and inspector visually connected.
- **Do** honour keyboard focus and reduced motion.

### Don't:

- **Don't** restore the blue sidebar or previous system font stack.
- **Don't** add decorative shadows to the investigation frame.
- **Don't** replace recorded artifacts with decorative imagery.
- **Don't** make filter labels or counts lighter than the filter-text token.
- **Don't** claim a specific code font that the CSS does not load.
