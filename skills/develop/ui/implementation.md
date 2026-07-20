# UI Implementation Phases

## Font installation

Identify fonts from `design.md` `typography.*.fontFamily`. System fonts (`system-ui`, `-apple-system`): no action. Proprietary fonts: check the project for font files (`*.ttf`, `*.otf`, `*.woff2`) first; none found → substitute and inform the user:

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

A proprietary font not in this table: substitute the closest free font of the same classification (geometric sans → Jost/Poppins, grotesque/neo grotesque → Inter/Manrope, humanist sans → Source Sans, transitional/old style serif → nearest free serif) and say what you swapped. The table is a starting set, not the whole world of fonts.

**Loading:** Next.js → `next/font/google` with the `variable` option, applied to `<html>` in the root layout. Vite / other → `@import url(...)` at the top of the globals CSS, or `<link>` in the HTML entry point. Update `--font-sans` to match whatever was loaded.

---

## Asset resolution (run before Phase 1 if the UI needs imagery)

Resolve where hero images, avatars, product/gallery photos, logos, illustrations, and background media come from before building markup, so you don't hardcode broken paths or invent files.

**Step 1: Does this build need image/media assets at all?** Pure form, table, or text layout: skip this section.

**Step 2: Look for matching project assets** (your file tools): search (ignoring `node_modules`, `.git`) for directories named `assets`, `images`, `img`, `media`, or `public`; scan them for filenames plausibly matching what the UI needs (hero, avatar, logo, product, …). Also check `design.md`/the design reference for named or pictured assets.

**Step 3: If no matching assets are found, ask** (as above; never silently invent paths, emoji, or blank boxes):
- **question**: "This UI needs <list what, e.g. a hero image + 3 product photos> but I found no matching assets in the project. How should I source them?"
- **header**: "Assets"
- **options**:
  1. `I'll add the assets`: "Stop and let me drop real files in. Tell me the exact paths/filenames to reference and I'll wire them when they're added." → list the precise paths you'll expect (e.g. `public/hero.jpg`, `public/products/{1,2,3}.jpg`), then pause for the engineer.
  2. `Use placeholder service`: "Wire dynamic placeholders from a stock/placeholder service so the layout is real now; swap later." → use a reputable service (below), correct dimensions, descriptive `alt`.
  3. `Local solid/gradient placeholders`: "No external requests, use CSS gradient/blocks at the right aspect ratios as stand-ins." → design tokens, never raw hex.

The tool appends "Other" automatically.

**Placeholder services** (option 2), pick per need, exact dimensions, swappable behind a token/constant: photos → `https://picsum.photos/<w>/<h>` (Lorem Picsum) or Unsplash Source-style stock URLs by keyword for topical imagery; avatars → `https://i.pravatar.cc/<size>` or DiceBear (`https://api.dicebear.com/…`); logos/illustrations → a neutral local SVG placeholder, not a random remote logo.

Placeholder rules: real `width`/`height` (or aspect-ratio box) to avoid layout shift; meaningful `alt` describing the intended content, not "placeholder"; centralise URLs/paths in one constant or token so the swap to real assets is one edit. Note placeholders and where to replace them in the report.

---

## Placeholder data (Facade / UI shell first builds)

Applies only when the UI stands up before its data source exists: the Facade mode (build the shell, wire it later), or any slice genuinely built ahead of its backend. Under end to end / tracer bullet the data layer lands in the same slice: bind to the real source, skip this. With no real data source yet, bind the page to a clearly marked local mock module so it renders fully; don't block on the backend and don't invent a real data layer here:

- Mock data in one obvious place, e.g. `lib/<feature>.placeholder.ts` (or `mocks/`), exporting typed objects shaped like the real data the spec specifies, so the swap to the real source is a single import change.
- Cover the real states (populated list, empty list, loading, error) so those UI states are built now.
- Mark it unmistakably (a `// PLACEHOLDER: replaced by <feature>'s data-integration sub-task` header) and note it in the report.

When the real source lands (the feature's data integration task, or the Facade wiring pass), swap the mock for the real query/action. Same principle as placeholder assets: real UI now, real data later.

---

## Implementation phases

### Phase 0: Design the full product surface (the gate, screen builds)

Pass 1 from the guide's bar: design before you integrate. A gate, not advice, on every screen (auth, dashboard, feed, pricing, profile, detail, list/search, onboarding, settings, checkout, empty state, 404). No markup until the whole surface is designed; not done until it clears the bar's disqualifiers. You are a senior product designer, not a form wirer.

**Commit the composition first, in writing.** List the sections top to bottom and the brand, copy, and content in each, in the design system's language. Ship to the ambition of a standalone product; never the bare functional widget (a lone form, an unstyled table, a raw list with no header), the exact stub the bar disqualifies.

A complete product screen carries, cohesive and branded:
- **Brand**: logo/wordmark, consistent; none → derive one from the product name, never an empty corner.
- **Context and copy**: real product specific copy (headline, supporting line, honest microcopy) from the product's purpose (`AGENTS.md`, spec intent, scope), never lorem ipsum.
- **A considered layout, not a lone box.** Compose the whole page. Calibrate to what a senior designer ships for THIS screen; the list is a sample, not a checklist:
  - **Auth**: branded card or two pane (brand/value/visual + form), secondary links, light social proof.
  - **Dashboard / feed**: app shell (header, nav, user menu), title/context, real hierarchy, a proper empty state.
  - **List / table / search**: header, filters/search, the collection with hierarchy and pagination, empty and no results states.
  - **Detail / profile**: identity header + key actions, grouped sections, related content.
  - **Landing**: hero (headline, subcopy, CTA, visual), supporting sections, footer.
  - **Settings / forms / onboarding / checkout**: grouped labelled sections with help text, clear progress/save.
  - **Any other** (pricing, 404, confirmation): same treatment, brand + context + real layout + the functional core.
- **Supporting content**: value prop/trust signals where they fit, secondary CTAs, a footer where the page type warrants.
- **The functional core**: the form/table/flow itself, done well (validation, Phase 4 states, Phase 5 accessibility).

Composition (completeness), not look, the design source decides the visual language. Nothing provided → derive a wordmark, use a tasteful visual (gradient, pattern, illustration, or a placeholder via *Asset resolution*) over blank space, write real copy from purpose. Invent tastefully, but **surface everything invented** (brand, copy, placeholder assets) in the report for correction. If `/architect`'s page design stage already settled the composition, execute that; this phase fills the gap only when it didn't. Real, not busy: every element earns its place.

### Phase 1: Semantic structure

Use the HTML element that most precisely describes the content; the element carries meaning browsers, assistive technologies, and search engines rely on.

- **Document landmarks**: exactly one `<main>` per page. `<header>`, `<footer>`, `<nav>`, `<aside>` as landmarks. More than one `<nav>`: each needs an `aria-label` (e.g. `aria-label="Primary"`, `aria-label="Footer"`).
- **Heading hierarchy**: one `<h1>` per page, always the primary page title. Never skip levels (`<h1>` → `<h3>` is wrong). Headings structure content, not visual size; control size with CSS.
- **Interactive elements**: `<button>` for any action that doesn't navigate (submit, toggle, open modal, increment); `<a href="...">` for anything that navigates. Never `<a>` without `href`, never `<div onClick>`, never `<button>` and `<a>` nested inside each other.
- **Lists**: `<ul>` / `<ol>` / `<li>` for any repeated set of items, never repeated `<div>`s. `<dl>` / `<dt>` / `<dd>` for term definition pairs (glossaries, metadata tables, key value pairs).
- **Tables**: `<table>` with `<thead>`, `<tbody>`, `<th scope="col">` (column headers), `<th scope="row">` (row headers) for tabular data. Never tables for layout.
- **Media**: `<figure>` + `<figcaption>` for captioned images, diagrams, or code blocks. `<picture>` for art direction or format fallback. SVG rules: Phase 5 "Images and media".
- **Time and data**: `<time datetime="ISO-8601">` for any date or time. `<address>` for contact information. `<data value="">` for machine readable values alongside human readable text.
- **Text semantics**: `<strong>` importance, `<em>` stress emphasis. `<del>` / `<ins>` content changes (e.g. crossed out original price). `<abbr title="...">` abbreviations on first use. `<code>` inline, `<pre><code>` blocks.
- **Expandable content**: `<details>` + `<summary>` for accordion content needing no JavaScript. `<dialog>` for modals: built in focus trapping, `showModal()`, native Escape.
- **Progress and meters**: `<progress>` for upload/task progress; `<meter>` for a scalar in a known range (battery, storage). Never a styled `<div>` for these.

**Component build type application:** *Component*: `interface Props` first, named export, no layout wrapper, no router imports. *Screen*: include `<main>`, integrate with the detected router, loading / error / empty states at top level.

---

### Phase 2: Token application

Every visual value (colour, font, size, spacing, radius, shadow, duration, easing) comes from the token file's CSS custom properties. No hardcoded hex, no hardcoded `px` duplicating a token.

Before calling the phase complete, search the changed files for hardcoded values: hex colors (e.g. `#fff`, `#1a2b3c`), `rgb(`/`hsl(` functions, raw pixel values (e.g. `: 16px`). Any match that isn't a `0`, a `1px` border with no token equivalent, or a known constant is a violation: replace with the corresponding `var(--token)`. Cross check against `design.md ## Do's and Don'ts`. Fix every violation before moving on.

---

### Phase 3: Responsive layout

- Mobile first CSS: start at the smallest viewport, layer up with `min-width` breakpoints.
- Breakpoints from `design.md ## Responsive Behavior` if specified; else `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`.
- Path A images at multiple widths: use the layout changes extracted in A0.
- Minimum touch target for any interactive element: 44×44px; reach it with padding without affecting visual size.
- Minimum body text: 16px on every viewport.
- Prefer `gap`, `grid`, `flex` over `margin` for spacing. `max-width` on the layout container, centered with `margin-inline: auto`.
- Text containers: `max-width` 60 to 75 characters (`ch` unit); never let long form text stretch full width on large viewports.

---

### Phase 4: States and motion

Every interactive element needs a visible, distinct style for:
- **Default**: base token styles
- **Hover**: `--color-surface` shift or lightened/darkened accent; never remove the cursor affordance
- **Focus visible**: 2px offset ring using `--color-accent` (`:focus-visible`, not `:focus`)
- **Active / pressed**: deeper colour shift using `accent-pressed` token if defined
- **Disabled**: `--color-muted` text and icon; `cursor: not-allowed`; `aria-disabled="true"` or native `disabled`
- **Loading**: skeleton or spinner; announce via `role="status"` or `aria-live="polite"`
- **Error**: `--color-error` border and icon; error message below the element linked via `aria-describedby`
- **Empty**: informative empty state, not blank space

Motion uses token values:
```
transition: <property> var(--duration-fast) var(--ease-out)
```
`--duration-fast` for colour/opacity; `--duration-normal` for layout shifts and reveals; `--duration-slow` for larger panel transitions.

Always include (not negotiable; some users get motion sickness):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### Phase 5: Web standards and accessibility

Not an end of build checklist; it is built into every decision in Phases 1 to 4. Review and enforce here.

**This section and `checklist.md` do different jobs.** This is the reference for HOW to build it: the patterns, the attributes, the snippets. `checklist.md` is the pass/fail gate you work through before reporting, and it owns the thresholds (contrast ratios, touch target sizes, focus ring widths). Read them there rather than restating them here, and check light and dark mode separately against them.

#### Keyboard navigation

Every interactive element reachable and operable by keyboard alone. Tab order follows the visual reading order; never use `tabindex` greater than `0` (it breaks the natural order).

Composite widgets follow the ARIA Authoring Practices Guide patterns:
- **Tabs**: Arrow keys move between tabs; Tab moves into the active panel
- **Dropdown menus**: Arrow keys navigate items; Escape closes; Enter/Space select
- **Modal / dialog**: focus traps inside; Escape closes; focus returns to the trigger on close
- **Accordion**: Enter/Space toggles the panel; focus stays on the `<button>`
- **Listbox / combobox**: Arrow keys navigate options; Enter selects

Modals: on open, focus the first focusable element inside (or the dialog `<h2>` if no input); on close, return focus to the opener.

Skip navigation link as the first focusable element on the page:
```html
<a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>
```
Use the project's visually hidden utility class (create one if none exists).

#### Screen reader semantics

Native HTML element before ARIA; ARIA supplements HTML, never replaces it. When needed:
- `aria-label`: no visible text label (icon only buttons)
- `aria-labelledby`: the label is a visible element (point to its `id`)
- `aria-describedby`: supplemental descriptions (input hint text, error message, tooltip)
- `aria-expanded`: on dropdown/accordion/nav menu triggers; toggles `true`/`false`
- `aria-selected`: tab and listbox options
- `aria-checked`: custom checkboxes and radio buttons
- `aria-disabled`: visually disabled but kept in the tab order (e.g. a tooltip bearing button)
- `aria-hidden="true"`: decorative icons, SVGs, anything that adds noise for screen reader users
- `aria-live="polite"`: regions updating without reload (search results, cart total, notification count)
- `aria-live="assertive"`: only critical time sensitive announcements (session timeout warning)
- `role="alert"`: errors that must announce immediately on injection
- `role="status"`: not urgent status updates (saved, loading complete)

Common component patterns:
- **Toast / notification**: `role="alert"` for errors, `role="status"` for success; inject into a persistent live region already in the DOM (injecting container and message together suppresses announcement in some readers)
- **Breadcrumb**: `<nav aria-label="Breadcrumb"><ol>` with `aria-current="page"` on the last item
- **Modal**: `<dialog aria-labelledby="dialog-title">` or `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- **Progress bar**: `<progress>`, or `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext` for human readable value
- **Tabs**: `role="tablist"` container, `role="tab"` + `aria-selected` per tab, `role="tabpanel"` + `aria-labelledby` per panel
- **Tooltip**: `role="tooltip"` on the tooltip; `aria-describedby` on the trigger pointing to it; never interactive content inside a tooltip

#### Images and media

- Meaningful images: `alt` describing content and purpose, not "image of…". A logo: `alt="Acme"`. A chart: `alt="Bar chart showing monthly revenue growth of 24% from Q1 to Q4"`.
- Decorative images: `alt=""` (empty string, not omitted).
- Complex diagrams/infographics: brief `alt` + longer description in adjacent text or `<figure><figcaption>`.
- Decorative SVG icons: `aria-hidden="true"`, no `<title>`. Meaningful SVG: `role="img"` + `aria-label="..."` or an internal `<title>` referenced by `aria-labelledby`.

#### Document structure

- `<html lang="en">`: set the correct language; inline `lang` for phrases in another language
- `<title>`: unique and descriptive per page; apps: `Page Name: App Name`
- One `<main>` per page with `id="main-content"` for the skip link
- `<link rel="canonical">` for pages reachable at multiple URLs

#### Visually hidden content

For content available to screen readers but not visible:
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
Never `display: none` or `visibility: hidden` for this; those hide from assistive technology too.

#### Logical properties for layout direction

Use CSS logical properties, not physical, so layouts work for RTL without overrides: `margin-inline-start` not `margin-left`; `padding-inline` not `padding-left`/`padding-right`; `inset-inline-start` not `left`; `border-inline-start` not `border-left`; `text-align: start` not `text-align: left`.

---

### Phase 6: Audit your own work before you report (the enforcement)

The build is not done until you have checked it. Ambition in prose is not enough; this is the step that catches a build that quietly fell back to bare minimum.

- **Audit against the bar's disqualifiers** (guide top) and this page's `design.md` mandate: lone form, dead space, naked or unstyled elements, default only styling, missing states, orphaned controls, a widget where a full surface was owed. Any hit → fix it, do not report around it.
- **Look at it, if you can.** With a browser or screenshot tool, render the page (a desktop and one mobile width) and actually look. Fix any visual defect you see: a stray unstyled bar, broken spacing, a blank half page, a collapsed element. This is the only reliable catch for a render defect the code did not reveal.
- **Report the audit.** State what you checked, and if you rendered it, what you saw and fixed.

---

## Report

```
## /develop complete (UI)

**Build type**: Component | Screen
**Stack**: Next.js | Vite | Nuxt | SvelteKit | Plain HTML
**Styling**: <tailwind | shadcn | css-modules | styled-components | plain css>
**Dark mode strategy**: .dark class | @media | both
**Icon library**: <library name> | none (install needed)
**Path**: Design.md (existing) | A (image) | A (multi: <what each image represented>) | B (derived: <mood> | url: <url> | custom: "<style>")
**design.md**: pre-existing | created | fetched from <url>
**Token conflicts**: none | <list, verify manually before next run>
**Token file**: created | updated | unchanged (<path>)
**Fonts**: <family> via <method> | <proprietary> to <substitute> | system
**Assets**: project files | placeholders (<service>, swap at <where>) | none needed
**Surface composed**: bare component | full product surface (brand, copy, layout, footer) | per spec composition
**Self-audit**: disqualifiers checked (none found | fixed: <list>) · rendered and looked (yes: <what you saw/fixed> | no browser tool)
**Invented (for review, swap when you have the real thing)**: <brand name/wordmark · tagline/headline · body copy · placeholder assets>, or "none (all provided)"
**Built**: <name> (<file paths>)
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
