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

A proprietary font not in this table: substitute the closest free font of the same classification (geometric sans → Jost/Poppins, grotesque/neo grotesque → Inter/Manrope, humanist sans → Source Sans, transitional/old style serif → nearest free serif) and say what you swapped.

**Loading:** load the family through the platform's font mechanism (its font loader or bundler on web, its font registration/asset system elsewhere), then point the type token (e.g. `--font-sans`) at what loaded.

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

**Placeholder assets** (option 2), pick per need, correct dimensions, swappable behind one token/constant: use placeholder sources appropriate to the platform (on web, a reputable placeholder or stock photo/avatar service; elsewhere, bundled placeholder assets or the platform's asset catalog). For logos/illustrations use a neutral local placeholder, never a random remote logo.

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

Build from the platform's semantic, accessible primitives: for each piece of content use the element or component that most precisely describes it, because that meaning is what assistive tech relies on, not a generic container styled to look right.

- **Landmarks and hierarchy**: one primary content region and one primary title per screen; a correct heading/section order that never skips levels; structure comes from semantics, visual size from styling.
- **Action vs navigation**: use the platform's real action primitive for anything that acts (submit, toggle, open) and its real navigation primitive for anything that navigates; never fake one with a styled tap target.
- **Content primitives**: use the platform's list, table, media, time/date, and disclosure (accordion, modal) primitives for those content types rather than repeated generic containers.

(On web this is semantic HTML: one `<main>` and one `<h1>`, `<button>` vs `<a href>`, `<ul>`/`<ol>`, `<table>` with headers and scope, `<figure>`, `<time>`, `<details>`/`<dialog>`, `<progress>`/`<meter>`; other platforms have their equivalents.)

**Component build type application:** *Component*: props contract first, exported the codebase's way, no layout wrapper, no navigation imports. *Screen*: include the primary content region, integrate with the platform's navigation system, loading / error / empty states at top level.

---

### Phase 2: Token application

Every visual value (colour, font, size, spacing, radius, shadow, duration, easing) comes from a token in the project's styling/theme system. No raw literal that duplicates a token.

Before calling the phase complete, search the changed files for hardcoded values (raw colours, raw sizes) that duplicate a token. Any match that isn't a genuine one off constant is a violation: replace it with the matching token reference. Cross check against `design.md ## Do's and Don'ts`. Fix every violation before moving on.

---

### Phase 3: Responsive layout

Adapt the layout to the container/screen size using the platform's layout system.

- Start from the smallest size and layer up. Use the breakpoints/size classes in `design.md ## Responsive Behavior` if specified.
- Path A images at multiple widths: use the layout changes extracted in A0.
- Minimum touch target for any interactive element: about 44 by 44 (points/px); reach it with padding without changing the visual size.
- Keep body text readable (about 16px equivalent) at every size.
- Prefer the platform's layout primitives (grid, stack, flex) over manual margins; constrain the content container's width and center it.
- Constrain long form text line length (about 60 to 75 characters); never let it stretch full width on large screens.

---

### Phase 4: States and motion

Every interactive element needs a visible, distinct treatment for each state its platform supports:
- **Default**: base token styles.
- **Hover** (where a pointer exists): a token driven shift; keep the affordance.
- **Focus visible**: a clear focus ring/indicator using an accent token, on keyboard/assistive focus.
- **Active / pressed**: a deeper token shift.
- **Disabled**: muted token styles, and expose the disabled state through the platform's accessibility API.
- **Loading**: skeleton or spinner, and announce it through the platform's live region/status mechanism.
- **Error**: an error token treatment with the message tied to the field through the accessibility API.
- **Empty**: an informative empty state, never blank space.

Motion uses token durations/easings (fast for colour/opacity, normal for layout reveals, slower for large panels). Always respect the platform's reduced motion setting and cut or minimise motion when it is on; some users get motion sickness.

---

### Phase 5: Accessibility (platform native)

Not an end of build checklist; it is built into every decision in Phases 1 to 4. Review and enforce here, checking light and dark themes separately.

**This section and `checklist.md` do different jobs.** This is the reference for HOW to build it; `checklist.md` is the pass/fail gate you work through before reporting, and it owns the thresholds (contrast ratios, touch target sizes, focus indicator). Read them there rather than restating them here.

Build accessibility with the platform's own semantic primitives and accessibility API. The requirements are the same on every platform; the mechanics are the platform's (on web that is ARIA over semantic HTML; mobile toolkits expose the same ideas through their own accessibility properties):

- **Operable without a pointer.** Every interactive element is reachable and operable by keyboard (web/desktop) or the platform's assistive navigation (mobile), in reading order. Composite widgets (tabs, menus, dialogs, accordions, listboxes) follow the platform's accessibility guidance for that pattern. Opening an overlay moves focus into it and returns focus to the trigger on close; offer a skip to content affordance where the platform has one.
- **Name, role, state.** Prefer native accessible primitives; supplement with the accessibility API only to fill gaps: an accessible name for a control with no visible label (an icon only button), a description for hint/error text, the expanded/selected/checked/disabled state of a control, and live announcements for dynamic updates at the right urgency (alert for errors, status for non urgent). Hide decorative elements from assistive tech.
- **Images and media.** A meaningful image carries a description of its content and purpose; a decorative one is hidden from assistive tech; a complex visual gets a longer description nearby.
- **Content hidden but announced.** Expose content to assistive tech that is not shown visually using the platform's visually hidden mechanism, never one that also hides it from assistive tech.
- **Screen metadata and direction.** Set the platform's per screen metadata (language, a unique descriptive title/label), and support right to left layouts using the platform's direction aware layout, not hardcoded left/right.

---

### Phase 6: Audit your own work before you report (the enforcement)

The build is not done until you have checked it. This step catches a build that quietly fell back to bare minimum.

- **Audit against the bar's disqualifiers** (guide top) and this page's `design.md` mandate: lone form, dead space, naked or unstyled elements, default only styling, missing states, orphaned controls, a widget where a full surface was owed. Any hit → fix it, do not report around it.
- **Look at it, if you can.** Render it and actually look, on whatever the platform gives you (a browser or screenshot on web, a simulator/preview on mobile), at a couple of representative sizes. Fix any visual defect you see: a stray unstyled bar, broken spacing, a blank half screen, a collapsed element. This is the only reliable catch for a render defect the code did not reveal.
- **Report the audit.** State what you checked, and if you rendered it, what you saw and fixed.

---

## Report

Lead with the headline, then Next, then a Heads up only if there is one (per `docs/conventions.md`). Everything else is in the files. Template:

```
**Built <name> (<file paths>) · <full product surface | component>, WCAG AA, self check passed.**
Next: /check verify <feature>
Heads up: invented for you to review, swap for the real thing · <brand/wordmark · tagline · copy · placeholder assets>.   (omit the whole line if nothing was invented)
```

Say it plainly if the self check found and fixed a defect, or if a token/asset issue needs a manual look; otherwise do not list the passing checks (semantic HTML, keyboard, screen reader, tokens are the guide's bar, not a report field). The design source, stack, fonts, and token file are recorded in `design.md` and the code, not here. `/test` reads the acceptance criteria and `verify.md`, so it needs no "what to verify" list in this summary.

---
