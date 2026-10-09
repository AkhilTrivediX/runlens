---
name: RunLens landing page
description: Marketing surface extension of the RunLens Signal Desk.
typography:
  display:
    fontFamily: '"Bricolage Grotesque", sans-serif'
    fontSize: "clamp(44px, 4.6vw, 68px)"
    fontWeight: 750
    lineHeight: 1.04
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
  hero-gap: "46px"
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
- A plum trace demonstration with selectable steps.
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

Display and introduction tokens apply to the hero. Section headings use the headline token. The display reaches 72px at widths of 1600px or more. It becomes 48px at 1100px and uses `clamp(41px, 7.8vw, 58px)` at 760px. Section headings become 36px at 1100px and 35px at 760px.

The trace title uses 23px type with the browser's bold heading weight. Explanatory paragraphs use 15px or 16px with generous line height. Labels and timing values use 12px. The trace uses tabular numerals. Setup code uses the browser's available system monospace family.

## Layout

The container is centred with a maximum width of 1220px and 48px gutters. Gutters become 32px at 1100px and 20px at 760px. Desktop sections use two columns. The hero uses a 1:1.06 ratio. Explanation sections use a 1.12:1 ratio.

The header has a minimum height of 104px. The hero has 86px space above and 70px below. Explanation sections use approximately 110px vertical space. These values are specific to the marketing page and do not change dashboard density.

At 760px the main sections stack. The header reduces to 82px. The compatibility strip wraps and the footer becomes multiple rows. The trace remains readable within a 600px maximum width. Technical strings wrap or use horizontal scrolling within the code panel.

## Elevation & Depth

Most sections use ground colour and thin dividers. Two restrained shadows lift the trace demonstration and setup code. These are marketing surface treatments. The root dashboard investigation frame keeps its existing flat treatment.

The trace shadow is `0 26px 55px -30px #33284970`. The code shadow is `0 18px 40px -30px #33284960`.

Buttons move up 2px on hover with a 0.18s transition. Step selection reveals detail over 240ms. Reduced motion removes hover movement, animation and smooth scrolling.

## Shapes

The main demonstration and code panels use the panel radius token. Primary actions use the action radius token. Timing lanes remain narrow with small corners. The existing geometric lens mark remains SVG.

## Components

### Buttons

Primary actions use violet with white text. They have a 50px minimum height and 14px by 22px padding. Hover darkens the violet. Text links underline on hover. Focus has a 3px violet outline with a 5px offset.

### Navigation

The horizontal header pairs the RunLens mark with text links. At 760px the explanation link hides while Quickstart and GitHub remain available. The skip link appears on keyboard focus.

### Trace Instrument

Three labelled example steps share a plum panel. Selecting a row sets `aria-pressed`, updates matching evidence and places the timing marker at that step's endpoint. Mint denotes passing steps and pink denotes the failure. The detail surface also changes between outcome washes. The [surface contract](.impeccable/surfaces/index-html.md) owns this page's composition and purpose.

### Code Panel

The white code surface separates its header, commands and supporting information with thin dividers. Copy feedback appears in a status region. The command area scrolls horizontally when needed.

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
