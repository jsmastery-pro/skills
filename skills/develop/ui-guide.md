# /develop — UI track guide

The UI build track for `/develop`. The main agent reads this after the ADR gate (Step 0 in `SKILL.md`) classifies a task as UI: components, pages, or full layouts using semantic HTML, design tokens, and strict accessibility. Works on any web stack (Next.js, Vite, Nuxt, Svelte, plain HTML). If the project has a `design.md` at the root, it is the single source of truth. With a screenshot, replicate pixel-perfectly; without one, pick from a curated template, a `design.md` URL, or a described style.

## What this track does

Three entry points — checked in order:

1. **Existing `design.md`** — reads it and acts as a professional frontend engineer, implementing strictly to that system.
2. **Image provided** — extracts tokens from the image and replicates pixel-perfectly.
3. **No image, no `design.md`** — guides through template selection or custom style generation, creates `design.md`, then implements.

All paths: **component-or-screen → stack detection → styling library → dark mode → token sync → font → five phases**.

## How the UI build fits the project's approach

The UI build **serves the project's build approach** (read in `SKILL.md` Step 2) — it doesn't dictate one. Standing the UI shell up first on placeholder data and wiring it later is the **Facade** mode: one strategy among several, **not** the universal default. Under an end-to-end / tracer-bullet slice the UI is built as part of a coherent slice whose data layer lands in the same pass, so it binds to the real source; under a Journey it completes the whole user path for the phase. Act as a professional frontend engineer: read the recorded approach and build the UI to fit it. The phases below (semantic structure → tokens → responsive → states → accessibility) apply whichever approach is in play — only *when the real data arrives* differs. If no approach is recorded, build the UI as part of the coherent end-to-end slice.

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows. The detection snippets (`find`, `cat | grep`, `cp`) are POSIX **reference**, not literal scripts — don't assume those utilities exist. Use your agent's own cross-platform file tools to find files, read `package.json`/config, and copy a template to `design.md`. Bundled files (`templates/*.md`, `checklist.md`) are referenced by paths relative to this skill's folder and read by the main agent **on demand** — load only the **one** chosen template (its full file only after selection), not all of them, and read this guide's phases as you reach them rather than front-loading everything. The UI build itself runs inline (it's interactive); heavy *code* exploration — finding existing components/tokens to match — is offloaded to a read-only subagent per `SKILL.md` Step 2.5. This skill writes app code/CSS, which is inherently cross-platform. If your tool has no interactive-question picker, ask the multiple-choice prompts as plain text with the same options.

## Step 0 — Did the ADR already decide the design system?

**Check the governing ADR first** (`/develop` read it in Step 2). If it already settled the **design direction** — a named template, "extract from existing UI", a described style, or page composition — **execute that decision; do not re-ask.** `/architect` already grilled the engineer on this; re-running the picker below would ask the same questions twice. Create `design.md` from the ADR's decision (e.g. "use the Raycast template" → copy that template; "extract from existing UI" → run the Step 0.2 extraction), then proceed to implementation.

Only if **no ADR governs this UI**, or the ADR is **silent on the design system**, fall through to the detection below.

## Step 0.0 — Check for existing design.md

Using your file-search tool, look for a `design.md` within about 3 levels of the project root, ignoring `node_modules`, `.git`, and `.claude`.

**Found** — validate before using: must have at least a `colors:` block and a `typography:` block. If either is missing or the file is empty, treat as **not found** and warn the user.

**Found and valid** → **Design.md path**. Skip Steps 1 onward.
**Not found** → **Step 0.1 (brownfield check)**.

---

## Step 0.1 — Brownfield check (no design.md, but is there existing UI?)

Before generating a fresh design system, find out if the project **already has a visual language** you must match. Generating a new one on top of an existing app produces UI that clashes with what's shipped.

Using your file-search tool (ignoring `node_modules`), look for signs a design language already exists:
- Styling/token files: `globals.css`, `tokens.css`, `theme.*`, `tailwind.config.*`.
- Component directories: a `components/` tree or a `ui` directory.

**If existing UI/styles are found (brownfield) — ask before proceeding** — present these as your agent's interactive option picker (`AskUserQuestion` on Claude Code) — or as plain-text options with the same choices if it has none:
- **question**: "There's no `design.md`, but this project already has UI. How should I get the design system?"
- **header**: "Design system"
- **options**:
  1. `Extract from existing code` — "Recommended — reverse-engineer `design.md` from the current tokens/components so new UI matches what's shipped." → go to **Step 0.2**.
  2. `Use a reference` — "I'll give a screenshot or a `design.md` URL, or pick a template." → go to **Step 1**.
  3. `Match a specific file` — "Build to mirror an existing component/page I name; I'll point you at it." → read that file's styles and treat them as the local source of truth.

**If no existing UI is found (greenfield)** → **Step 0.5**.

### Step 0.2 — Extract design.md from existing code

Read the token files and 3–5 representative components/pages. Recover the real system into a `design.md` (same schema as a generated one): colors (light + dark if present), typography (families, scale, weights), spacing scale, radii, shadows, motion, and the conventions visible in components. Pull values from CSS variables / Tailwind config — do not invent. Where the codebase is inconsistent, pick the dominant value and note the variance. Write `./design.md`, show the engineer a short summary, and confirm before building. Then proceed to implementation with it as the source of truth.

---

## Step 0.5 — Component or screen?

Determines prop API design, routing integration, and file placement.

| Prompt contains | Build type |
|---|---|
| "screen", "page", "layout", "route", "dashboard", "view" | **Screen** |
| "component", "button", "card", "input", "modal", "badge", "dropdown", "toggle", "chip" | **Component** |
| Ambiguous | Ask |

If ambiguous, ask (as above):
```
"Is this a reusable component or a full page?"
  - Reusable component — isolated, takes props, no routing
  - Full page / screen — owns layout, integrates with router
```

**Component rules** — apply throughout all phases:
- Define the `interface Props` before any markup
- Named export from its own file
- No router imports, no page-level data fetching inside the component
- Check for Storybook (`*.stories.*`) — if found, create a story file alongside
- File naming: scan existing components to match the project's convention

**Screen rules** — apply throughout all phases:
- Integrate with the detected router (Next.js App Router, Vite React Router, Nuxt, SvelteKit)
- Include loading, error, and empty states at page level
- Wrap with existing layout component if the project has one

---

## Stack detection

Using your file-search tool (ignoring `node_modules`), look near the project root for a framework config file (`next.config.*`, `vite.config.*`, `nuxt.config.*`, `svelte.config.*`). Then read `package.json` and check its dependencies for `next`, `vite`, `nuxt`, `svelte`, or `astro`.

Identifies the framework. Affects routing integration, image primitives, and font loading method.

---

## Styling library, dark mode, and icon detection

Using your file-search and read tools (ignoring `node_modules`):
- **Styling** — read `package.json` and check dependencies for `@shadcn`, `@radix-ui`, `@mui`, `antd`, `@chakra-ui`, `@mantine`, `styled-components`, `@emotion`, or `tailwindcss`. Also look for a `components/ui` directory (shadcn) and for any `*.module.css` / `*.module.scss` files.
- **Dark mode strategy** — check `package.json` for `next-themes`, and search any `tailwind.config.*` for a `darkMode` setting.
- **Icon library** — check `package.json` dependencies for `lucide-react`, `@heroicons`, `phosphor-react`, `@phosphor-icons`, `react-icons`, or `@tabler/icons`.

**Styling decision:**

| Detected | Approach |
|---|---|
| `components/ui/` (shadcn) | Use shadcn primitives with `cn()` + Tailwind token classes |
| `tailwindcss` only | Utility classes only — no `style={}` props |
| `*.module.css` | One `.module.css` per component |
| `styled-components` / `@emotion` | Tagged template literals referencing CSS variables |
| Nothing | Semantic HTML + external CSS referencing CSS custom properties |

These are the common cases, **not an exhaustive list**. If `package.json` shows a styling library not named here (UnoCSS, Panda, vanilla-extract, Stylex, …), use it and follow *its* idiom — the rule is "use what's installed, the way it's meant to be used," never "only these."

**Dark mode strategy:**

| Detected | Approach |
|---|---|
| `next-themes` in package.json | `.dark {}` class only — no `@media` as primary |
| `darkMode: 'class'` in tailwind config | `.dark {}` class only |
| `darkMode: 'media'` in tailwind config | `@media (prefers-color-scheme: dark)` |
| Nothing detected | Both: `@media` query + `.dark {}` fallback |

**Icon library:** Use whatever is installed. If nothing is installed, note it in the report rather than using emoji or placeholder SVGs.

Icon sizing rule: always reference a spacing token for the icon size, never hardcode. Decorative icons get `aria-hidden="true"`. Standalone interactive icons get a visually-hidden label or `aria-label` on the wrapping button.

---

## Design.md path — existing design system

You are a **professional frontend engineer** on this project. Every colour, font family, spacing value, radius, shadow, and motion curve must come from `design.md`. You do not invent values. If something is unspecified, derive it from the nearest specified token.

**Naming note:** `colors.primary` and `colors.accent` are synonyms for the brand accent colour in this skill. Template files use `primary`; generated files use `accent`. Treat them identically when reading or writing.

**Component spec resolution:** The `## Components` section in `design.md` uses `{token.path}` references (e.g. `{colors.accent}`, `{rounded.md}`). Resolve these to the actual token value when generating CSS. Do not paste the reference literal into code.

### DS1 — Read design.md

Read the full file. Extract:
- Color palette (light + dark variants if `colors-dark:` is present)
- Typography: families, scale, weights, line-heights, letter-spacing
- Spacing scale and section rhythm
- Border radius per element type
- Shadows / elevation approach
- Motion: durations and easing curves (default to `200ms ease-out` if absent)
- Component specs from the `## Components` section
- Every rule in `## Do's and Don'ts`

### DS2 — Sync token files

Run stack, styling, and dark mode detection. Find existing token files:

Using your file-search tool (ignoring `node_modules`), find existing token files: `globals.css`, `tokens.css`, or `tailwind.config.*`.

Compare existing token values against `design.md`. Add absent tokens freely. If conflicts exist between the token file and `design.md`, **do not silently overwrite** — list them in the report and let the engineer decide.

### DS3 — Implement

Proceed to implementation phases with the design.md as sole source of truth.

---

## Step 1 — Image vs no image

**Image attached** → **Path A**.
**No image** → **Path B**.

---

## Path A — Pixel-perfect from image

### A0 — Multiple images?

If more than one image is attached, identify what each represents before analysis:
- **Same UI at different widths** → responsive breakpoints — extract layout changes per width, feed into Phase 3
- **Same UI in different states** → default/hover/active/error — extract the visual diff per state, feed into Phase 4
- **One light + one dark** → extract `colors:` from the light image and `colors-dark:` from the dark image

Then run A1 on the primary (default/light) image.

### A1 — Extract tokens from the image

Extract exactly what is visible. Do not fabricate values.

- **Colors**: canvas, surface(s), ink, body, muted, accent, accent-pressed, border, semantic colors — exact hex, not approximations
- **Typography**: family name if recognizable, size scale anchored to body = 16px, weights, line-heights, letter-spacing
- **Spacing**: use 4px base unit — pad, gap, section rhythm, max-width
- **Geometry**: radius per element type, border widths, shadows (`x y blur spread color/opacity`), gradients, backdrop blur
- **Motion**: infer from context — micro-interactions (~100ms), standard (~200ms), reveals (~350ms), easing character
- **Mode**: light or dark, contrast level, sharpness

### A2 — Token schema

Produce a YAML token schema using `accent` (not `primary`) as the canonical accent colour name. Include `colors-dark:` if the design has or implies a dark mode.

### A3 — Token file conflict check

Find existing token files. If conflicts exist between current values and the image, stop and list them before writing. Offer: `update` / `extend` / `skip`.

---

## Path B — No image, no design.md

### B1 — Present options

Read only the **frontmatter (first 30 lines)** of each template for the picker — not the full file:
```
templates/stripe.md    (lines 1–30)
templates/posthog.md   (lines 1–30)
templates/nike.md      (lines 1–30)
templates/supabase.md  (lines 1–30)
templates/raycast.md   (lines 1–30)
```
Read the full selected file in B2, after the user chooses.

Ask (as above) — question 1:
```
"What mood should this UI have?"
  - Dark & focused       → near-black, precise, technical (Raycast)
  - Light & professional → white/off-white, trustworthy (Stripe or Supabase)
  - Bold & editorial     → strong personality (PostHog or Nike)
  - Custom               → describe a style, brand, or paste a design.md URL
```

Then ask (as above) — question 2 (only for Light or Bold):
```
  Light: Stripe vs Supabase
  Bold:  PostHog vs Nike
  Dark:  auto-select Raycast
```

### B2 — Acquire the design system

**Template selected** → read the full file, then copy it to `./design.md` (use your write tool — read `templates/<name>.md` and write its contents to `design.md`; don't rely on `cp`).

**URL provided** → fetch, validate it has `colors:` and `typography:`, save as `./design.md`.

**Style description** → generate `./design.md` using this schema:

```yaml
---
version: alpha
name: <style>-design-system
description: "<2–3 sentence character summary>"

colors:
  accent: ""
  on-accent: ""
  canvas: ""
  surface: ""
  ink: ""
  body: ""
  muted: ""
  hairline: ""
  success: ""
  error: ""

colors-dark:
  accent: ""
  on-accent: ""
  canvas: ""
  surface: ""
  ink: ""
  body: ""
  muted: ""
  hairline: ""

typography:
  body-md:    { fontFamily: "", fontSize: "16px", fontWeight: 400, lineHeight: 1.5 }
  heading-lg: { fontFamily: "", fontSize: "24px", fontWeight: 600, lineHeight: 1.2 }
  button-md:  { fontFamily: "", fontSize: "14px", fontWeight: 500 }

rounded:
  xs: ""  sm: ""  md: ""  lg: ""  xl: ""  full: "9999px"

spacing:
  xxs: "2px"  xs: "4px"  sm: "8px"  md: "12px"  lg: "16px"
  xl: "24px"  2xl: "32px"  section: "48px"

motion:
  duration-instant: "0ms"
  duration-fast: ""
  duration-normal: ""
  duration-slow: ""
  easing-standard: ""
  easing-out: ""
  easing-spring: ""

components:
  <key components with {token.path} references>
---

## Overview
## Colors
## Typography
## Layout
## Elevation & Depth
## Shapes
## Components
## Do's and Don'ts
  ### Do
  ### Don't
## Responsive Behavior
```

Aesthetic guide:
- **Cyberpunk**: near-black canvas, neon cyan/magenta accent, 0–2px radius, mono font, dense spacing, fast motion (80ms), harsh easing
- **Brutalist**: pure black/white, 0px radius, thick borders, oversized type, zero motion (all durations 0ms)
- **Glassmorphism**: frosted canvas, translucent surfaces, 16–24px radius, slow transitions (200–400ms), gentle spring
- **Notion-like**: off-white canvas, Georgia display + Inter UI, 3px radius, generous line-height, fast subtle motion (100ms)
- **Apple consumer**: white canvas, system font stack, 10–20px radius, spring motion (200–350ms)
- **Named brand**: use that brand's documented colours/fonts; substitute proprietary fonts (see font installation)

Fill every field. No placeholders.

### B3 — Create CSS token file

Create `app/globals.css`, `src/styles/tokens.css`, or add to an existing globals file.

Define CSS custom properties for:
- All colors (light): `--color-canvas`, `--color-surface`, `--color-ink`, `--color-body`, `--color-muted`, `--color-accent`, `--color-on-accent`, `--color-border`, `--color-success`, `--color-error`
- Icon sizes: `--icon-sm: 16px`, `--icon-md: 20px`, `--icon-lg: 24px`
- Typography: `--font-sans`, size scale (`--text-xs` through `--text-4xl`), weight scale
- Spacing: `--space-xxs` through `--space-section`
- Radius: `--radius-sm` through `--radius-full`
- Motion: `--duration-instant` through `--duration-slow`, `--ease-standard`, `--ease-out`, `--ease-spring`

Apply dark color overrides using the detected strategy (`.dark {}` class or `@media (prefers-color-scheme: dark)`). Only override tokens that differ in dark mode.

If Tailwind is in use, also extend `tailwind.config.ts` under `theme.extend` with all token values. Wire color tokens via `var(--color-*)` references so dark mode works automatically.

---

## Font installation

Identify fonts from `design.md` `typography.*.fontFamily`.

**System fonts** (`system-ui`, `-apple-system`): no action needed.

**Proprietary fonts** — check for font files (`*.ttf`, `*.otf`, `*.woff2`) in the project first. If none found, substitute and inform the user:

| Proprietary | Substitute |
|---|---|
| Futura / Futura ND | Jost |
| Circular | DM Sans |
| Helvetica Now | Inter |
| Söhne / Graphik | Inter |
| GT Walsheim | Nunito |
| Canela | Playfair Display |
| Tiempos | Libre Baskerville |
| SF Pro | Inter |

For a proprietary font **not in this table**, substitute the closest free font of the **same classification** — geometric sans → Jost/Poppins, grotesque/neo-grotesque → Inter/Manrope, humanist sans → Source Sans, transitional/old-style serif → the nearest free serif — and tell the user what you swapped. The table is a starting set, not the whole world of fonts.

**Loading:**
- **Next.js**: `next/font/google` with the `variable` option, applied to `<html>` in the root layout
- **Vite / other**: `@import url(...)` at the top of the globals CSS file, or `<link>` in the HTML entry point

Update the `--font-sans` token to match whatever was loaded.

---

## Asset resolution (run before Phase 1 if the UI needs imagery)

Many UIs need real visual content — hero images, avatars, product/gallery photos, logos, illustrations, background media. Resolve where these come from **before** building markup, so you don't hardcode broken paths or invent files.

**Step 1 — Does this build need image/media assets at all?** If it's a pure form, table, or text layout, skip this section.

**Step 2 — Look for matching project assets** (use your file tools): search (ignoring `node_modules` and `.git`) for asset directories named `assets`, `images`, `img`, `media`, or `public`; then scan those dirs for files whose names plausibly match what the UI needs (hero, avatar, logo, product, …).
Also check `design.md`/the design reference for named or pictured assets.

**Step 3 — If no matching assets are found, ask** (as above; do **not** silently invent paths, emoji, or blank boxes):
- **question**: "This UI needs <list what — e.g. a hero image + 3 product photos> but I found no matching assets in the project. How should I source them?"
- **header**: "Assets"
- **options**:
  1. `I'll add the assets` — "Stop and let me drop real files in. Tell me the exact paths/filenames to reference and I'll wire them when they're added." → list the precise paths you'll expect (e.g. `public/hero.jpg`, `public/products/{1,2,3}.jpg`), then pause for the engineer.
  2. `Use placeholder service` — "Wire dynamic placeholders from a stock/placeholder service so the layout is real now; swap later." → use a reputable service (below), with correct dimensions and descriptive `alt`.
  3. `Local solid/gradient placeholders` — "No external requests — use CSS gradient/blocks at the right aspect ratios as stand-ins." → use design tokens, never raw hex.

The tool appends "Other" automatically.

**Placeholder services** (option 2) — pick per need, request exact dimensions, keep them swappable behind a token/constant:
- **Photos**: `https://picsum.photos/<w>/<h>` (Lorem Picsum), or Unsplash Source-style stock URLs by keyword for topical imagery.
- **Avatars**: `https://i.pravatar.cc/<size>` or DiceBear (`https://api.dicebear.com/…`).
- **Logos/illustrations**: a neutral local SVG placeholder rather than a random remote logo.

Rules for placeholders: real `width`/`height` (or aspect-ratio box) to avoid layout shift; meaningful `alt` describing the *intended* content, not "placeholder"; centralise the URLs/paths in one constant or token so a later swap to real assets is one edit. Note in the report that placeholders are in use and where to replace them.

---

## Placeholder data (Facade / UI-shell-first builds)

This applies **only when the build approach stands the UI up before its data source exists** — the **Facade** mode (build the shell, wire it later), or any slice where the page is genuinely built ahead of its backend. Under an end-to-end / tracer-bullet approach the data layer lands in the *same* slice, so bind the page to the **real** source and skip this. When there is no real data source yet, bind the page to a **clearly-marked local mock module** so it renders fully — don't block on the backend and don't invent a real data layer here:

- Put mock data in one obvious place, e.g. `lib/<feature>.placeholder.ts` (or `mocks/`), exporting typed objects shaped like the real data the ADR specifies — so swapping to the real source later is a single import change.
- Cover the real states with the mock: a populated list, an empty list, a loading and an error case, so those UI states are actually built now.
- Mark it unmistakably (a `// PLACEHOLDER — replaced by <feature>'s data-integration sub-task` header) and note it in the report.

When the real data source lands — the feature's **data-integration** sub-task, or the wiring pass of a Facade — swap the mock for the real query/action. Same principle as placeholder assets: render real UI now, wire real data later.

---

## Implementation phases

### Phase 1 — Semantic structure

Build with the HTML element that most precisely describes the content. The element choice is not a styling decision — it carries meaning that browsers, assistive technologies, and search engines rely on.

**Document landmarks** — every page must have exactly one `<main>`. Use `<header>`, `<footer>`, `<nav>`, `<aside>` as landmarks. `<nav>` must have an `aria-label` if more than one appears on the page (e.g. `aria-label="Primary"` and `aria-label="Footer"`).

**Heading hierarchy** — one `<h1>` per page, always the primary page title. Never skip levels (`<h1>` → `<h3>` is wrong). Use headings to structure content, not for visual size — control size with CSS.

**Interactive elements**:
- `<button>` for any action that does not navigate (submit, toggle, open modal, increment)
- `<a href="...">` for any action that navigates somewhere — never `<a>` without `href`, never `<div onClick>`
- `<button>` and `<a>` must never be nested inside each other

**Lists** — use `<ul>` / `<ol>` / `<li>` for any repeated set of items. Do not render lists as repeated `<div>`s. Use `<dl>` / `<dt>` / `<dd>` for term–definition pairs (glossaries, metadata tables, key–value pairs).

**Tables** — use `<table>` with `<thead>`, `<tbody>`, `<th scope="col">` (column headers) and `<th scope="row">` (row headers) for tabular data. Never use tables for layout.

**Media** — `<figure>` + `<figcaption>` for images, diagrams, or code blocks with captions. `<picture>` for art direction or format fallback. SVG icons used decoratively must have `aria-hidden="true"` and no title; SVG used as meaningful content needs `role="img"` and `aria-label`.

**Time and data** — `<time datetime="ISO-8601">` for any date or time. `<address>` for contact information. `<data value="">` for machine-readable values alongside human-readable text.

**Text semantics** — `<strong>` for importance, `<em>` for stress emphasis. `<del>` / `<ins>` for content changes (e.g. crossed-out original price). `<abbr title="...">` for abbreviations on first use. `<code>` for inline code, `<pre><code>` for blocks.

**Expandable content** — `<details>` + `<summary>` for accordion-style content that doesn't need JavaScript. Use `<dialog>` for modals — it provides built-in focus trapping, `showModal()`, and native Escape handling.

**Progress and meters** — `<progress>` for upload/task progress. `<meter>` for a scalar value within a known range (battery level, storage used). Never use a styled `<div>` for these.

**Component build type application:**
- *Component*: define `interface Props` first; named export; no layout wrapper, no router imports
- *Screen*: include `<main>`, integrate with the detected router, include loading / error / empty states at top level

---

### Phase 2 — Token application

Every visual value — colour, font, size, spacing, radius, shadow, duration, easing — comes from the CSS custom properties defined in the token file. No hardcoded hex codes, no hardcoded `px` values that duplicate a token.

Before calling the phase complete, use your search tool to scan the changed files for hardcoded values: hex colors (e.g. `#fff`, `#1a2b3c`), `rgb(`/`hsl(` color functions, and raw pixel values (e.g. `: 16px`).

Any match that isn't a `0`, a `1px` border that has no token equivalent, or a known constant is a violation. Replace with the corresponding `var(--token)`.

Cross-check against `design.md ## Do's and Don'ts`. Fix any violation before moving on.

---

### Phase 3 — Responsive layout

Mobile-first CSS. Start with the smallest viewport, layer up with `min-width` breakpoints.

Use breakpoints from `design.md ## Responsive Behavior` if specified. Otherwise default to `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`.

If Path A supplied multiple images at different widths, use the layout changes extracted in A0.

Minimum touch target for any interactive element: 44×44px. Use padding to reach this without affecting visual size.

Minimum body text: 16px. Never go below this on any viewport.

Prefer `gap`, `grid`, and `flex` over `margin` for spacing between elements. Use `max-width` on the layout container, centered with `margin-inline: auto`.

For text containers: `max-width` of 60–75 characters (`ch` unit) for readability. Do not let long-form text stretch full-width on large viewports.

---

### Phase 4 — States and motion

Every interactive element must have a visible, distinct style for:
- **Default** — base token styles
- **Hover** — `--color-surface` shift or lightened/darkened accent; never remove the cursor affordance
- **Focus-visible** — 2px offset ring using `--color-accent` (`:focus-visible`, not `:focus`)
- **Active / pressed** — deeper colour shift using `accent-pressed` token if defined
- **Disabled** — `--color-muted` for text and icon; `cursor: not-allowed`; `aria-disabled="true"` or native `disabled`
- **Loading** — skeleton placeholder or spinner; announce via `role="status"` or `aria-live="polite"`
- **Error** — `--color-error` border and icon; error message below the element linked via `aria-describedby`
- **Empty** — informative empty state, not a blank space

Apply motion using the token values:
```
transition: <property> var(--duration-fast) var(--ease-out)
```
Use `--duration-fast` for colour and opacity changes. `--duration-normal` for layout shifts and reveals. `--duration-slow` for larger panel transitions.

Always include:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
This is non-negotiable — some users get motion sickness from animations.

---

### Phase 5 — Web standards and accessibility

This phase is not a checklist to run at the end — it is built into every decision in Phases 1–4. Review and enforce here.

#### WCAG colour contrast

Normal text (under 18px regular or 14px bold): **4.5:1 minimum** against its background.
Large text and bold text: **3:1 minimum**.
UI components (button borders, input borders, focus rings, icons): **3:1 minimum** against adjacent colour.
Do not rely on colour alone to communicate state, error, or category — always pair colour with a text label, icon, or pattern.
Check both light and dark mode separately.

#### Keyboard navigation

Every interactive element must be reachable and operable by keyboard alone, in a logical reading order that matches the visual layout.

Tab order must follow the visual reading order. Never use `tabindex` values greater than `0` — they break the natural order.

Composite widgets follow established keyboard interaction patterns (ARIA Authoring Practices Guide):
- **Tabs**: Arrow keys move between tabs; Tab moves into the active panel
- **Dropdown menus**: Arrow keys navigate items; Escape closes; Enter/Space select
- **Modal / dialog**: Focus traps inside; Escape closes; focus returns to the trigger on close
- **Accordion**: Enter/Space toggles the panel; focus stays on the `<button>`
- **Listbox / combobox**: Arrow keys navigate options; Enter selects

For modals: when opening, move focus to the first focusable element inside (or the dialog `<h2>` if no input). When closing, return focus to the element that opened the modal.

Add a skip navigation link as the first focusable element in the page:
```html
<a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>
```
Use the project's visually-hidden utility class (or create one if none exists).

#### Screen reader semantics

Use the native HTML element before reaching for ARIA. ARIA supplements HTML — it does not replace it.

When ARIA is needed:
- `aria-label` — when there is no visible text label (icon-only buttons)
- `aria-labelledby` — when the label is a visible element on the page (point to its `id`)
- `aria-describedby` — for supplemental descriptions: hint text below an input, an error message, a tooltip
- `aria-expanded` — on the trigger for dropdowns, accordions, nav menus; toggles `true`/`false`
- `aria-selected` — on tab and listbox options
- `aria-checked` — on custom checkboxes and radio buttons
- `aria-disabled` — on elements that are visually disabled but must remain in the tab order (e.g. a tooltip-bearing button)
- `aria-hidden="true"` — on decorative icons, SVGs, and any element that adds noise for screen reader users
- `aria-live="polite"` — on regions that update dynamically without page reload (search results, cart total, notification count)
- `aria-live="assertive"` — only for critical time-sensitive announcements (session timeout warning)
- `role="alert"` — for error messages that must be announced immediately on injection
- `role="status"` — for non-urgent status updates (saved, loading complete)

Common component patterns:
- **Toast / notification**: `role="alert"` for errors; `role="status"` for success; inject into a persistent live region already in the DOM (injecting both the container and the message at once suppresses announcement in some readers)
- **Breadcrumb**: `<nav aria-label="Breadcrumb"><ol>` with `aria-current="page"` on the last item
- **Modal**: `<dialog aria-labelledby="dialog-title">` or `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- **Progress bar**: `<progress>` element, or `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext` for human-readable value
- **Tabs**: `role="tablist"` on the container, `role="tab"` + `aria-selected` on each tab, `role="tabpanel"` + `aria-labelledby` on each panel
- **Tooltip**: `role="tooltip"` on the tooltip element; `aria-describedby` on the trigger pointing to it; never put interactive content inside a tooltip

#### Images and media

Meaningful images: `alt` attribute describing the content and purpose, not "image of…". A logo: `alt="Acme"`. A chart: `alt="Bar chart showing monthly revenue growth of 24% from Q1 to Q4"`.
Decorative images: `alt=""` (empty string, not omitted). Screen readers skip them.
Complex diagrams / infographics: brief `alt` + a longer description in adjacent text or `<figure><figcaption>`.
SVG icons (decorative): `aria-hidden="true"`, no `<title>`.
SVG used as meaningful content: `role="img"` + `aria-label="..."` or an internal `<title>` referenced by `aria-labelledby`.

#### Document structure

- `<html lang="en">` — set the correct language; use inline `lang` for any phrase in a different language
- `<title>` — unique and descriptive per page; for apps: `Page Name — App Name`
- One `<main>` per page; give it `id="main-content"` for the skip link
- `<link rel="canonical">` for pages that may be accessed at multiple URLs

#### Visually hidden content

For content that must be available to screen readers but not visible:
```css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}
```
Never use `display: none` or `visibility: hidden` for this — those hide from assistive technology too.

#### Logical properties for layout direction

Use CSS logical properties instead of physical ones so layouts work correctly for RTL languages without extra overrides:
- `margin-inline-start` not `margin-left`
- `padding-inline` not `padding-left` / `padding-right`
- `inset-inline-start` not `left`
- `border-inline-start` not `border-left`
- `text-align: start` not `text-align: left`

---

## Report

```
## /develop complete (UI)

**Build type**: Component | Screen
**Stack**: Next.js | Vite | Nuxt | SvelteKit | Plain HTML
**Styling**: <tailwind | shadcn | css-modules | styled-components | plain css>
**Dark mode strategy**: .dark class | @media | both
**Icon library**: <library name> | none — install needed
**Path**: Design.md (existing) | A (image) | A (multi: <what each image represented>) | B (template: <name> | url: <url> | custom: "<style>")
**design.md**: pre-existing | created | fetched from <url>
**Token conflicts**: none | <list — verify manually before next run>
**Token file**: created | updated | unchanged — <path>
**Fonts**: <family> via <method> | <proprietary> → <substitute> | system
**Assets**: project files | placeholders (<service> — swap at <where>) | none needed
**Built**: <name> — <file paths>
**Token adherence**: all sourced from design.md | <deviations>
**Accessibility**: WCAG AA passed | <items deferred>
**Semantic HTML**: correct elements used | <issues noted>
**Keyboard**: fully navigable | <gaps>
**Screen reader**: announced correctly | <gaps>
**What /test should verify**:
- <observable behaviour>
- Keyboard-only navigation through all interactive elements
- VoiceOver / NVDA announces interactive elements and live regions correctly
- Dark mode rendering
- Reduced-motion mode (all transitions suppressed)
```

---

## Reference files

- Accessibility checklist: `checklist.md`
- Design templates: `templates/`
- Project design system: `./design.md`
