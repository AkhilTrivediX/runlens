---
name: RunLens landing page
description: Marketing surface extension of the RunLens Signal Desk.
typography:
  display:
    fontFamily: '"Bricolage Grotesque", sans-serif'
    fontSize: "clamp(46px, 6.2vw, 86px)"
    fontWeight: 750
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  headline:
    fontFamily: '"Bricolage Grotesque", sans-serif'
    fontSize: "44px"
    fontWeight: 650
    lineHeight: 1.07
    letterSpacing: "-0.04em"
  introduction:
    fontFamily: '"Bricolage Grotesque", sans-serif'
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.9
rounded:
  panel: "14px"
  action: "9px"
spacing:
  hero-gap: "48px"
  section-gap: "100px"
  section: "110px"
---

# Design System: RunLens landing page

## Overview

**Creative North Star: "The Signal Desk"**

This page extends the established [RunLens design system](../../DESIGN.md). The root design system remains authoritative. Larger type and more space support product explanation before the visitor opens the compact local dashboard.

The page retains Bricolage Grotesque, violet actions, warm ground and plum instrumentation. Mint and pink communicate outcomes. Its demonstration is explicitly illustrative. The page uses type, CSS and SVG rather than generated imagery.

**Key Characteristics:**

- The existing RunLens identity with larger display type.
- A broad plum trace workspace with scenarios, replay and evidence tabs.
- Spacious sections that become a single column on smaller screens.
- Local capture explained through code and evidence.

## Colors

The palette follows the root tokens. CSS names `ground`, `plum`, `mint` and `pink` map to root tokens `workspace`, `history-plum`, `history-pass` and `history-fail`. The page also uses the unchanged root `ink`, `muted`, `line`, `accent`, `pass` and `fail` values. These primitives are inherited rather than redefined in this document.

### Primary

- **Violet:** primary actions, headline emphasis and focus context.

### Secondary

- **Plum:** the trace instrument and local operation section.
- **Mint and Pink:** labelled example outcomes and timing bars.

### Neutral

- **Warm Ground:** the page background.
- **Ink and Supporting Grey:** readable explanation and metadata.
- **White:** setup code and text on dark surfaces.

**The Recorded State Rule.** Outcome colours report stored status. Keep a visible label or accessible icon label alongside colour. The marketing demonstration states its illustrative scope.

## Typography

The locally served variable Bricolage Grotesque font and its OFL licence are copied from the dashboard. The [font notes](public/fonts/README.md) and [licence](public/fonts/OFL.txt) record the asset. The interface font supports weights 200 through 800 with `font-display: swap`.

Display and introduction tokens apply to the centred hero. The display reaches 86px through its fluid ramp. It becomes 68px at 1100px and uses `clamp(40px, 8.2vw, 60px)` at 760px. Section headings use the headline token. They become 36px at 1100px and 35px at 760px. These are the final cascade values rather than the earlier superseded hero declarations.

The trace title uses 27px type with the browser's bold heading weight. It reduces to 23px at 760px. Trace row labels use 14px on desktop and 12px below 1100px. Explanatory paragraphs use 15px or 16px with generous line height. Labels and timing values use 12px. Evidence tabs use 13px. The trace uses tabular numerals. Setup code uses the browser's available system monospace family.

## Layout

The container is centred with a maximum width of 1220px and 48px gutters. Gutters become 32px at 1100px and 20px at 760px. The hero stacks centred copy above a trace workspace that fills the available width up to 1100px. Hero copy has a 900px maximum width and its introduction has a 580px maximum width. Explanation sections retain a 1.12:1 column ratio.

The sticky header has a minimum height of 84px. A fixed violet reading progress line sits above it. The hero has 58px space above and 64px below with a 48px gap between copy and workspace. Explanation sections use approximately 110px vertical space. These values are specific to the marketing page and do not change dashboard density.

The desktop trace workspace has a 220px scenario rail beside its flexible timeline and evidence pane. At 1100px the rail becomes 190px and the pane uses tighter padding. At 760px the rail becomes a horizontal strip above the timeline. Scenario descriptions hide while all three choices remain available. The header reduces to 72px and the hero uses 40px vertical padding with a 32px gap. Evidence event rows become two columns. The demo footer stacks. The main explanation sections also stack. The compatibility strip wraps and the footer becomes multiple rows. Technical strings wrap or use horizontal scrolling within the code panel.

## Elevation & Depth

Most sections use ground colour and thin dividers. Two restrained shadows lift the trace demonstration and setup code. These are marketing surface treatments. The root dashboard investigation frame keeps its existing flat treatment.

The trace shadow is `0 30px 65px -35px #33284980`. The code shadow is `0 18px 40px -30px #33284960`.

Buttons move up 2px on hover with a 0.18s transition. Step selection reveals detail over 300ms. Replay grows each timing fill over 700ms and advances the selected step every 950ms. A short pulse marks the current capture. The local capture path reveals its nodes over 750ms with staggered connectors. It runs once on viewport entry.

Autoplay uses a visibility observer with a 15% threshold and starts once while the trace workspace is visible. Leaving the viewport or hiding the document pauses playback. The visitor resumes through the replay control. Reduced motion disables autoplay, animated fills, detail reveals, capture animation, hover movement and smooth scrolling. A manually requested replay still updates the visible steps using short 120ms intervals. Changing the preference to reduced motion stops the active sequence.

**The Visible Evidence Rule.** Default failed step detail, complete timing bars and source commands remain visible without JavaScript. Enhancement adds motion and alternative evidence rather than hiding the page's starting content.

## Shapes

The main demonstration and code panels use the panel radius token. Primary actions use the action radius token. Timing lanes remain narrow with small corners. The existing geometric lens mark remains SVG.

## Components

### Buttons

Primary actions use violet with white text. They have a 50px minimum height and 14px by 22px padding. Hover darkens the violet. Text links underline on hover. Focus has a 3px violet outline with a 5px offset.

### Navigation

The horizontal header pairs the RunLens mark with text links. At 760px the explanation link hides while Quickstart and GitHub remain available. The skip link appears on keyboard focus.

### Trace Instrument

The broad plum workspace joins a scenario rail to the timeline and evidence pane. Selector missing, Network failure and Session expired change the illustrative classification, event and DOM evidence. Each scenario control exposes its selected state through `aria-pressed`.

Replay run advances navigation, click and failure with growing timing fills, selected rows and matching detail. The control changes to Pause replay while running and Resume replay while paused. Choosing a step or scenario interrupts playback. Selecting a row sets `aria-pressed`, updates matching detail and places the timing marker at that step's endpoint. Mint denotes passing steps and pink denotes the failure. The detail surface changes between outcome washes.

Step detail, Events and DOM use tabs with `aria-selected`, a single tab stop and labelled panels. Left and Right arrow keys cycle tabs. Home and End move to the first and last tab. The selected evidence tab remains available when step detail changes. The [surface contract](.impeccable/surfaces/index-html.md) owns this page's composition and purpose. These scenarios explain existing capture concepts through examples. They do not promise a cloud service or new SDK features.

### Code Panel

The white code surface separates its integration tabs, header, code and supporting information with thin dividers. Source setup, Playwright and Puppeteer tabs use the same arrow, Home and End keyboard behaviour as evidence tabs. Switching integration updates the code, caption, copy label and panel label. Copy feedback appears in a status region and copying uses the currently visible example. The command area scrolls horizontally when needed. Source commands are visible by default without JavaScript. Adapter examples instrument an existing page and do not imply that an unreleased package is already available from npm.

### Questions

Native disclosure elements use a divider row and a CSS plus indicator. Opening a question changes the indicator to a minus. Focus uses the shared visible outline.

## Do's and Don'ts

### Do:

- **Do** keep the root RunLens identity authoritative.
- **Do** scope the larger type and section spacing to this page.
- **Do** label the example trace as illustrative.
- **Do** retain keyboard focus and reduced motion support.

### Don't:

- **Don't** apply marketing spacing to the investigation dashboard.
- **Don't** present example timings as live customer data.
- **Don't** replace evidence with generated decorative imagery.
- **Don't** claim cloud accounts or customer proof that the product does not provide.
