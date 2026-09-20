---
name: Meridian
description: A people-ops console on cool sage paper, where the role boundary is visible in the surface itself.
colors:
  bg: "#eff2ee"
  surface: "#ffffff"
  surface-alt: "#f3f6f2"
  nav: "#e4ebe3"
  nav-deep: "#dae3d9"
  border: "#d3ded2"
  border-strong: "#bccdbc"
  ink: "#16201a"
  ink-soft: "#4c594f"
  ink-faint: "#7c8b7e"
  ink-invert: "#f2f6f1"
  accent: "#1b4332"
  accent-mid: "#2f6b4f"
  accent-ink: "#0f2a20"
  accent-soft: "#dce8de"
  accent-wash: "#f0f6f1"
  brass: "#a6742b"
  brass-mid: "#c08f3f"
  brass-soft: "#f5ebda"
  brass-ink: "#7d5720"
  success: "#3f7d4a"
  success-soft: "#e0efe2"
  success-ink: "#2c5c34"
  warning: "#b8863a"
  warning-soft: "#f7edda"
  danger: "#a63a2e"
  danger-soft: "#f7e3e0"
  danger-ink: "#87291f"
typography:
  display:
    fontFamily: "Schibsted Grotesk Variable, Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Schibsted Grotesk Variable, Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Schibsted Grotesk Variable, Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Work Sans Variable, Work Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body-small:
    fontFamily: "Work Sans Variable, Work Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Work Sans Variable, Work Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  micro-label:
    fontFamily: "Work Sans Variable, Work Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    letterSpacing: "0.13em"
  numeric:
    fontFamily: "Work Sans Variable, Work Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    fontFeature: "'tnum' 1"
    fontVariation: "tabular-nums"
rounded:
  stripe: "0px"
  bar: "3px"
  skeleton: "4px"
  mark: "5px"
  control: "6px"
  panel: "8px"
  pill: "999px"
spacing:
  row-y: "0.625rem"
  row-x: "1.25rem"
  panel: "1.25rem"
  dialog-x: "1.5rem"
  rail-x: "0.75rem"
  gap-sm: "0.5rem"
  gap-md: "0.75rem"
  gap-lg: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink-invert}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "2.375rem"
    typography: "{typography.body-small}"
  button-primary-hover:
    backgroundColor: "{colors.accent-mid}"
    textColor: "{colors.ink-invert}"
  button-primary-active:
    backgroundColor: "{colors.accent-ink}"
    textColor: "{colors.ink-invert}"
  button-primary-disabled:
    backgroundColor: "{colors.border-strong}"
    textColor: "{colors.ink-faint}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "2.375rem"
  button-secondary-hover:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "2.375rem"
  button-ghost-hover:
    backgroundColor: "{colors.nav}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "2.375rem"
  button-danger-hover:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
  button-sm:
    height: "2rem"
    padding: "0 0.875rem"
    typography: "{typography.label}"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.5rem 0.75rem"
    typography: "{typography.body}"
  input-field-disabled:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.ink-faint}"
  input-field-sm:
    rounded: "{rounded.pill}"
    padding: "0.3125rem 0.75rem"
    typography: "{typography.body-small}"
  status-pill-approved:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success-ink}"
    rounded: "{rounded.pill}"
    padding: "0.125rem 0.625rem 0.125rem 0.375rem"
    typography: "{typography.micro-label}"
  status-pill-pending:
    backgroundColor: "{colors.brass-soft}"
    textColor: "{colors.brass-ink}"
    rounded: "{rounded.pill}"
    padding: "0.125rem 0.625rem 0.125rem 0.375rem"
  status-pill-denied:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger-ink}"
    rounded: "{rounded.pill}"
    padding: "0.125rem 0.625rem 0.125rem 0.375rem"
  status-pill-muted:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.ink-faint}"
    rounded: "{rounded.pill}"
    padding: "0.125rem 0.625rem 0.125rem 0.375rem"
  panel-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "1.25rem"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.control}"
    padding: "0.5rem 0.625rem"
    typography: "{typography.body-small}"
  nav-item-hover:
    backgroundColor: "{colors.nav-deep}"
    textColor: "{colors.ink}"
  nav-item-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink-invert}"
  nav-rail:
    backgroundColor: "{colors.nav}"
    width: "224px"
  inspector:
    backgroundColor: "{colors.surface}"
    width: "348px"
---

# Design System: Meridian

## Overview

**Creative North Star: "The Studio Ledger"**

Meridian looks like a well-kept paper ledger on a studio desk under daylight: cool sage-stone paper, forest-pine ink for the decisions that matter, brass for the things still waiting on someone. It is a dense, calm, three-column working surface, not a marketing page. Density is deliberate — rows sit at `py-2.5`, the type ramp tops out at 1.875rem, and there is no hero imagery anywhere inside the authenticated shell. Every pixel is either a fact, a control that narrows the facts, or the line that separates two facts.

The structural idea is tonal layering rather than cards floating on white. There are five stacked light surfaces — page (`bg`), panel (`surface`), recessed (`surface-alt`), rail (`nav`), rail-pressed (`nav-deep`) — and the shell's weight comes from the nav rail sitting on a *deeper light* layer, never a dark one. Light-first is an acceptance criterion of this product, not a default: no route, no panel, no section in the shipped build uses a dark background as its resting state, and there is no dark-mode toggle.

The palette rejects the full-width-table-on-white admin look, and deliberately avoids blueprint cyan and ivory/teal/coral. The one authored moment of motion in the product is `.settle` (620ms), the animation a leave request plays when its decision lands; everything else transitions in 150–200ms and says nothing.

**Key Characteristics:**
- Five stacked light surfaces; the nav rail is the deepest, and nothing is dark.
- Forest pine owns primary action and approval; brass owns pending; clay is reserved for denied and destructive.
- Two typefaces only, no monospace — numeric alignment comes from tabular numerals.
- Every list row is gutter-striped, so a list reads as one unbroken vertical line.
- Primary actions live at the inspector's foot; a row can never decide anything.
- Charts are hand-built SVG and HTML bars in palette colors, each with an `sr-only` data table behind it.

## Colors

A cool sage-stone paper palette with a forest-pine accent and a brass secondary; every hue in the product descends from one of those three families, including the generated avatar tints.

### Primary
- **Forest Pine** (`{colors.accent}`): primary buttons, the active nav item's fill, focus rings, caret, link text, the brand mark, and the line stroke in `ChartLine`. The color of an action that commits.
- **Pine Mid** (`{colors.accent-mid}`): primary button hover and every `tone="accent"` bar fill in `ChartBars`. This mid-tone exists so the accent has range; it is not a second accent.
- **Pine Ink** (`{colors.accent-ink}`): primary button `:active`, text on accent-soft chips, and the foreground of text selection.
- **Pine Soft** (`{colors.accent-soft}`): the selected row fill in every list, the empty-state icon halo, the focus glow on form controls, and the text-selection background.
- **Pine Wash** (`{colors.accent-wash}`): the computed-summary callout in the request-leave dialog — the lightest accent tint, for a panel that says "the system worked this out for you".

### Secondary
- **Brass** (`{colors.brass}`): the pending state, the attention series in `ChartBars` (`tone="brass"`), and the coverage-clash warning icon. Brass means *waiting on a human* — never *good*, never decorative.
- **Brass Mid** (`{colors.brass-mid}`) / **Brass Soft** (`{colors.brass-soft}`): highlighted metric accents and the pending pill's fill.
- **Brass Ink** (`{colors.brass-ink}`): the text pairing on brass-soft, used by the pending pill label and the brass avatar swatch.

### Tertiary
- **Success Green** (`{colors.success}`), **Warning Amber** (`{colors.warning}`), **Danger Clay** (`{colors.danger}`), with their `-soft` tints and darkened `-ink` text pairings: semantic only. They appear in status stripes, status pills, inline error text, destructive buttons and error banners. They are never used to make a chart prettier or a card warmer.

### Neutral
- **Sage Paper** (`{colors.bg}`): the page and the sticky sub-header (at 85% over a backdrop blur).
- **White Panel** (`{colors.surface}`): cards, the inspector column, dialogs, form controls, the mobile inspector sheet.
- **Recessed Sage** (`{colors.surface-alt}`): row hover, the bar-chart track, quoted comments, inspector summary blocks, disabled controls.
- **Rail Sage** (`{colors.nav}`) / **Rail Pressed** (`{colors.nav-deep}`): the nav rail's own layer and its hover/pressed state; also the small inline role tags on list rows.
- **Hairline** (`{colors.border}`) / **Strong Hairline** (`{colors.border-strong}`): the default border color for every element (set globally on `*`), row dividers, field strokes, and the scrollbar thumb.
- **Ink / Ink Soft / Ink Faint** (`{colors.ink}`, `{colors.ink-soft}`, `{colors.ink-faint}`): the three-step text ramp — primary value, supporting value, metadata and column headers. **Ink Invert** (`{colors.ink-invert}`) is the only light-on-dark text in the system and exists solely for text sitting on forest pine.

### Named Rules
**The Light-Only Rule.** No route, section or panel may use a dark background as its resting state. Depth is always found by going *deeper light* (`bg` → `nav` → `nav-deep`), never darker. There is no dark mode, and nothing may be authored assuming one arrives.

**The Hue-Plus-Word-Plus-Icon Rule.** Status is never carried by color alone. Every status renders as a tinted chip holding a hue, a word, and a Lucide glyph (`Check`, `Clock`, `X`, `Minus`, `Plane`, `CircleDot`). A greyscale print of the directory must still be readable.

**The Brass-Means-Waiting Rule.** Brass is reserved for pending and for the "attention, not good" chart series. Approved is green, denied is clay, deactivated is muted grey. No fourth semantic hue may be introduced for a fifth state — add a glyph instead.

**The Owned-Palette Rule.** Generated colors, including `AvatarMark`'s deterministic tint, draw only from four owned swatches (`accent-soft`, `brass-soft`, `nav-deep`, `success-soft`). Twenty-five avatars on screen never introduce a hue the palette does not own.

## Typography

**Display Font:** Schibsted Grotesk Variable (self-hosted via `@fontsource-variable/schibsted-grotesk`, falling back to `ui-sans-serif` / `system-ui`)
**Body Font:** Work Sans Variable (self-hosted via `@fontsource-variable/work-sans`, same fallback)
**Label/Mono Font:** None. There is deliberately no monospace face in this product.

**Character:** Schibsted Grotesk gives headings a slightly condensed editorial firmness at weight 600 with `-0.015em` tracking; Work Sans underneath is open, plain and unfussy at 14px. The pairing reads as a well-set internal tool rather than a marketing site — two voices, one register apart, and no third.

### Hierarchy
- **Display** (Schibsted Grotesk 600, 1.875rem / 1.15): one per product — the login page's proposition headline. Never used inside the authenticated shell.
- **Headline** (Schibsted Grotesk 600, 1.25rem, `-0.015em`): the section title in the sticky sub-header (`Directory`, `Leave`, `Analytics`) and dialog titles.
- **Title** (Schibsted Grotesk 600, 0.9375rem): the inspector subject's name, panel headings, the brand lockup, empty-state titles, the mobile sheet header.
- **Body** (Work Sans 400, 0.875rem / 1.5): the default set on `<body>`. Row primary values sit at 0.8125rem weight 500; supporting values at 0.75rem.
- **Label** (Work Sans 500, 0.75rem): form labels, count chips, inline role tags; nav item text at 0.8125rem.
- **Micro-label** (Work Sans 500, 0.6875rem, `0.13em`, uppercase): list column headers, inspector section headings (`REASON GIVEN`, `TEAM COVERAGE`, `LEAVE BALANCE THIS YEAR`), the organisation name under the brand lockup, and the login form's `or sign in` divider.

### Named Rules
**The Two Faces Rule.** Schibsted Grotesk for `h1`–`h4` and anything set with `font-display`; Work Sans for everything else. A third family may not be added, and a monospace face specifically may not — the product carries no code, no hashes and no terminal output that would earn one.

**The Tabular Numerals Rule.** Numeric alignment comes from `font-variant-numeric: tabular-nums` applied globally to `table`, `time` and `[data-numeric]` — never from a mono face and never from fixed-width spans. Any number a user compares down a column (dates, day counts, balances, rates, file sizes) must carry `data-numeric`.

**The Micro-Label Is A Header Rule.** The 0.6875rem uppercase `0.13em` treatment is a *structural label* — a column header, a section heading, a field-group name. It is never a kicker or eyebrow above a headline, and no new surface may use it to introduce one.

## Layout

The shell is a three-column rail-plus-inspector composition built on two custom properties: `--rail-w: 224px` and `--inspector-w: 348px`.

- **Rail (left, 224px).** `src/layouts/AppShell.vue`. Fixed full-height, sticky on desktop, on the `nav` layer with a hairline right border. A 62px brand lockup, the organisation micro-label, the section index, then the signed-in name and role pinned to the foot beside a sign-out control. The nav list is `px-3` with `gap-0.5`.
- **Centre (fluid, `min-w-0 flex-1`).** `src/components/WorkSurface.vue`. A sticky sub-header (`top-14` on mobile, `top-0` on desktop, `bg-bg/85` with `backdrop-blur-sm`) carrying the section title, a live count chip, an actions slot and a second row of filters; then the scrolling list.
- **Inspector (right, 348px).** A persistent third column on `surface` with a hairline left border and its own scroll, holding the selected record and its primary action.

**Responsive.** The breakpoint that matters is Tailwind's `lg` (1024px), read reactively by `useIsDesktop()` in `src/composables/useMediaQuery.ts`. Below it the rail becomes a 264px slide-in drawer behind an `ink/25` scrim under a 56px top bar, the list collapses through `sm` (640px) to two columns, and the inspector becomes a full-screen sheet (`fixed inset-0 z-40`) rather than a squeezed third column.

**Spacing rhythm.** List rows are `py-2.5 pl-4 pr-5`; column headers `py-2` on the same grid; inspector and panel sections `px-5 py-4` / `py-5`; dialogs `px-6 py-4` / `py-5`; the sub-header `px-5 pt-4 pb-3`, widening to `px-7 pt-5` at `lg`. Inline gaps step 0.5 / 0.75 / 1rem.

### Named Rules
**The One Grid Rule.** Each list view declares a single `GRID` constant (`DirectoryView.vue:46`, `LeaveView.vue:53`, `AttendanceView.vue:137`) and applies it to *both* the sticky column header and every row. Columns cannot drift apart because there is only one definition. The shape is `grid-cols-[minmax(0,1fr)_auto]`, three columns at `sm`, four with fixed trailing tracks at `lg`.

**The Inspector Foot Rule.** The primary action for a record lives at the foot of the inspector (`sticky bottom-0`, top hairline, `bg-surface`, `px-5 py-4`), never inside a row. A row's only affordance is selection. A mis-click must never be able to approve, deny or deactivate anything.

**The One Inspector Rule.** The inspector renders in exactly one place. `WorkSurface` gates the desktop column on `isDesktop` and the mobile sheet on `!isDesktop`, because hiding one with `lg:hidden` would put the same ids, the same controls and a hidden focusable form in the DOM twice.

**The Sub-Header Owns Narrowing Rule.** The section name, the live count, and every control that narrows the list live in the sticky sub-header and nowhere else. Nothing else may be added to it.

## Elevation & Depth

Meridian is a **tonally layered** system first and a shadowed one only at the edges. Structure comes from the five stacked light surfaces and from 1px hairlines: most containers are an 8px white panel with `ring-1 ring-inset ring-border` and no shadow at all (13 occurrences across the analytics, profile and login views). Shadows appear in exactly three places — the primary button's resting lift, the hoverable login account cards, and the two modal dialogs.

Every shadow is two-layer, tinted from the ink hue (`rgb(22 32 26 / …)`), and pairs a tight offset with a soft blur. There are no hard-offset, zero-blur shadows anywhere in the build, and none belong in this world.

### Shadow Vocabulary
- **Raise** (`box-shadow: 0 1px 2px rgb(22 32 26 / 0.06), 0 2px 6px rgb(22 32 26 / 0.04)`): the primary button at rest, and a card that becomes liftable on hover.
- **Panel** (`box-shadow: 0 2px 4px rgb(22 32 26 / 0.05), 0 8px 20px rgb(22 32 26 / 0.07)`): for a detached panel that must read above the page.
- **Pop** (`box-shadow: 0 4px 10px rgb(22 32 26 / 0.09), 0 16px 36px rgb(22 32 26 / 0.12)`): the two `<dialog>` elements, over an `ink/30` backdrop with a 2px backdrop blur.

### Named Rules
**The Hairline-Before-Shadow Rule.** A container earns separation from a 1px inset ring and a surface change first. A shadow is added only when the element genuinely floats above the page — a modal, or a card that lifts on hover. Panels sitting in the page flow stay flat.

**The Soft-Blur Rule.** Every shadow carries an offset *and* a blur, tinted from the ink hue. A hard offset shadow with no blur belongs to a neobrutalist world and is foreign to this one.

## Shapes

Three radii carry the product, and the choice between them is meaning, not taste.

- **Panels — 8px** (`--radius-panel`, used as `rounded-panel`): cards, dialogs, inspector summary blocks, login account buttons, callouts. Gently softened rectangles.
- **Controls — 6px**: inputs, selects, textareas, nav items, inline error banners — tighter than a panel so a control reads as *inside* the thing it sits in. The brand mark uses 5px, chart bars 3px, skeleton blocks 4px.
- **Interactive pills — 999px**: every button, every status pill, every avatar, the count chip, inline role tags, icon buttons, and the compact `.field-sm` filter controls in the sticky sub-header.
- **Status stripes — 0px, always.**

Borders are universally 1px `{colors.border}`, set globally on `*, *::before, *::after`, drawn either as a `border-*` edge or as `ring-1 ring-inset` when the element clips its children. Lists use `divide-y divide-border` rather than per-row borders.

### Named Rules
**The Continuous Stripe Rule.** Every list row carries its status stripe as `absolute inset-y-0 left-0 w-[3px]` with **no border radius and no inset**. Because it bleeds to both row edges unrounded, consecutive rows of the same status join into one unbroken vertical line down the gutter — the line the product is named for. Rounding it, insetting it, or changing its width breaks the signature.

**The Pill-For-Action Rule.** If it can be clicked, or if it labels a state, it is a full pill. If it contains content, it is 8px. Nothing in this system is a sharp-cornered rectangle except the gutter stripe.

## Components

### Buttons
`src/components/AppButton.vue` — four variants, two sizes, one shape. Confident but quiet: no uppercase, no letter-spacing, weight 500.
- **Shape:** full pill (999px). `md` = 2.375rem tall / `px-4` / 0.8125rem; `sm` = 2rem / `px-3.5` / 0.75rem.
- **Primary:** forest-pine fill, inverted ink, `shadow-raise`; hover to pine mid, active to pine ink; disabled falls to `border-strong` with faint ink and no shadow.
- **Secondary:** white with `ring-1 ring-inset ring-border-strong`; hover tints to `surface-alt` and darkens the ring to `ink-faint`; active to `nav`.
- **Ghost:** transparent with soft ink; hover fills `nav`.
- **Danger:** white with a clay ring (`#e5bdb7`) and clay text; hover fills `danger-soft`. Destructive actions are outlined, never filled — a filled red button is louder than any action in this product deserves.
- **Focus:** `outline-2 outline-offset-2` in forest pine, on `:focus-visible` only.
- **Loading:** a spinning `LoaderCircle` at 15px takes the leading slot and the button sets `aria-busy`; the label never disappears.

### Chips — Status Pills
`src/components/StatusPill.vue`, the system's most-repeated element.
- **Style:** full pill, `pl-1.5 pr-2.5 py-0.5` (asymmetric, because the glyph needs less lead-in than the word), 0.6875rem weight 500, soft tint fill, a 1px inset ring one step darker, and a darkened text ink for contrast.
- **Variants:** `chip` (default) and `bare` — `bare` drops the fill and ring inside an already-tinted row while keeping hue, word and icon.
- **Six states:** approved (`Check`, success), pending (`Clock`, brass), denied (`X`, danger), active (`CircleDot`, success), on-leave (`Plane`, brass), deactivated (`Minus`, muted). Icons are 12px at stroke-width 2.5.

### Cards / Containers
- **Corner Style:** 8px (`rounded-panel`).
- **Background:** `{colors.surface}`, on the `{colors.bg}` page.
- **Border:** `ring-1 ring-inset ring-border`. **Shadow Strategy:** none by default — see The Hairline-Before-Shadow Rule.
- **Internal Padding:** `p-5`. Sectioned panels use a `px-5 py-3.5` header with a bottom hairline, then `divide-y divide-border` body rows.

### Inputs / Fields
One vocabulary in `src/style.css`, shared by `.field-input`, `.field-select` and `.field-textarea`, so a control never looks different on two screens.
- **Style:** white fill, 1px `border-strong` stroke, 6px radius, `0.5rem 0.75rem` padding, 0.875rem / 1.4.
- **Hover:** stroke darkens to `ink-faint`. **Focus:** stroke goes forest pine plus a 3px `accent-soft` glow, and the default outline is suppressed.
- **Error:** `[aria-invalid="true"]` turns the stroke clay and the focus glow `danger-soft`; `FormField.vue` renders the message below with a `CircleAlert` glyph and `role="alert"`.
- **Disabled:** `surface-alt` fill, faint ink, `not-allowed`.
- **Select:** the native affordance is kept, but the chevron is redrawn as an inline data-URI SVG in `ink-soft` so it matches the Lucide icon family instead of shipping the platform glyph.
- **`.field-sm`:** the compact filter variant — tighter padding, 0.8125rem, full pill radius. Filters read as pills; form fields read as fields.
- **Labels:** 0.75rem weight 500 in `ink-soft`, with an explicit `Optional` marker on non-required fields rather than an asterisk on required ones.

### Navigation
`src/layouts/AppShell.vue`.
- **Style:** the 224px rail on the `nav` layer with a hairline right border. Items are 6px-radius rows, `px-2.5 py-2`, 0.8125rem, with a 16px Lucide icon.
- **Default:** `ink-soft` text at stroke-width 1.8. **Hover:** `nav-deep` fill, full ink. **Active:** forest-pine fill, inverted ink, weight 500, stroke-width 2.1, and `aria-current="page"`.
- Nav labels are honest about the row set: the same route reads `Directory` for an admin and `My team` for a manager.
- **Mobile:** a 56px top bar on the `nav` layer with a hamburger and the signed-in avatar; the rail slides in at 264px over an `ink/25` scrim in 200ms ease-out and closes on every route change.
- **Skip link:** an `sr-only` link that becomes a fixed forest-pine pill at top-left on focus.

### Signature Component — The Striped List Row
The defining pattern, built identically in `DirectoryView.vue`, `LeaveView.vue` and `AttendanceView.vue`. A full-width `<button>` on the shared `GRID`, `relative`, `py-2.5 pl-4 pr-5`, carrying:
1. the 3px full-bleed gutter stripe coloured by status;
2. a decorative `AvatarMark` plus a two-line identity block (name at 0.8125rem / 500, supporting line at 0.75rem `ink-faint`);
3. middle columns that appear progressively at `sm` and `lg`, numeric ones carrying `data-numeric`;
4. a `StatusPill` justified to the end.

Selection is `bg-accent-soft` with `aria-pressed`; hover is `bg-surface-alt`; focus is a 2px inset forest-pine outline. Rows are separated by `divide-y divide-border`, never by their own borders. A row whose decision just landed additionally carries `.settle`.

### Signature Component — The Inspector
`PersonInspector.vue`, `LeaveInspector.vue`. A 348px `surface` column in three parts: a header block (avatar, name, title, status pill, then an 8px `surface-alt` summary block holding the record's headline fact); a scrolling body of micro-label-headed sections separated by hairlines; and a sticky foot carrying the optional comment field and the primary/destructive action pair. The empty state is a centred faint icon plus a sentence naming what *will* appear here — never a blank column.

### Charts
`src/components/charts/ChartBars.vue`, `ChartLine.vue`. Hand-built; there is deliberately no chart library.
- **Bars** are HTML, not SVG: horizontal, `h-6`, 3px radius, on a `surface-alt` track, filled `accent-mid` (or `brass` for an attention series), with the label read along the axis it is written on and the value right-aligned at `w-10` with `data-numeric`. Width animates over 500ms ease-out.
- **Line** is SVG on a fixed viewBox with `vector-effect="non-scaling-stroke"`: a 2px forest-pine stroke, a vertical accent gradient area fill, `surface`-filled dots with pine rings, hairline gridlines in `{colors.border}`, and a live 1rem-tall readout row beneath.
- Both wrap in a `<figure>` with an `sr-only` `<figcaption>` and a full `sr-only` `<table>` of the same data.

### States — Skeletons and Empty Blocks
- **`SkeletonRows.vue`** mirrors real row geometry (gutter bar, avatar circle, two text lines at pseudo-random widths, a trailing pill) so nothing jumps when data lands. The `.skeleton` shimmer runs a 90° `surface-alt → nav → surface-alt` gradient at 220% width over 1.35s.
- **`StateBlock.vue`** carries three kinds — `empty` (`Inbox`), `no-results` (`SearchX`), `error` (`TriangleAlert`) — each a 2.75rem accent-soft (or danger-soft) halo, a title, a teaching sentence, and an optional action. Empty states explain what will appear and how to get there; they never just say "nothing here".

## Do's and Don'ts

### Do:
- **Do** keep every new surface light; reach for `nav` / `nav-deep` when you need weight, never a dark fill.
- **Do** give every list row a 3px full-bleed gutter stripe (`absolute inset-y-0 left-0 w-[3px]`, unrounded) coloured by that row's status.
- **Do** define one `GRID` constant per list view and apply it to both the column header and the rows.
- **Do** put the primary action at the foot of the inspector, and give a row no affordance other than selection.
- **Do** pair every status with a hue, a word and a Lucide glyph.
- **Do** mark every comparable number with `data-numeric` so tabular numerals apply.
- **Do** use `.field-input` / `.field-select` / `.field-textarea` for every control, and `.field-sm` for filters in the sticky sub-header.
- **Do** render a conditional pane in exactly one place, gated on `useIsDesktop()`, rather than duplicating it and hiding one copy.
- **Do** ship charts as hand-built SVG or HTML bars in palette colors, with an `sr-only` data table behind them.
- **Do** build empty, loading and error states that mirror the real geometry and teach the interface.

### Don't:
- **Don't** add a dark mode, a dark section, or a dark-background hero. Light-first is an acceptance criterion.
- **Don't** introduce a monospace face for numbers, codes or IDs; `tabular-nums` is the answer.
- **Don't** add a third type family, or use the uppercase micro-label as a kicker or eyebrow above a headline.
- **Don't** round, inset, or resize the gutter stripe; the continuous line is the signature.
- **Don't** put an Approve, Deny, Delete or Deactivate control inside a list row.
- **Don't** signal a state with color alone, and don't add a fourth semantic hue for a fifth state — add a glyph.
- **Don't** use brass for anything that means "good", or any semantic color for decoration.
- **Don't** ship a hard offset, zero-blur shadow; every shadow in this world carries an ink-tinted blur.
- **Don't** fill a destructive button; danger is an outlined variant on white.
- **Don't** add a chart library, an icon font, or a runtime webfont request — fonts are self-hosted via `@fontsource` at build time and icons are Lucide SVG components.
- **Don't** put anything in the sticky sub-header except the section name, the live count, and the controls that narrow the list.
