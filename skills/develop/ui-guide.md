# /develop: UI track guide

UI build track for `/develop`, read after the spec gate (`SKILL.md` Step 0) classifies a task as UI: components, screens, or full layouts, built to a professional bar with real design tokens and strict accessibility. Any UI platform (web, mobile, desktop): detect the platform and the UI, styling, theming, navigation, and accessibility systems the project already uses, and build with their native idioms. The bar and the phases below are the same on every platform; only the mechanics differ, and you build them the platform's way. The project's `design.md` holds the art direction (character, the build mandate, composition and component rules, and pointers to where the real tokens live); the token values themselves live in the project's own styling or theme system (CSS on web, the platform theme on mobile), never duplicated in `design.md`. Read the bar below before you build anything.

## The bar: read this first, it is the definition of done

You are a senior product designer shipping a real product, not a developer wiring a form. Every UI page must leave as a complete, professional product surface, the quality you would expect from a top product or from Claude's own chat app, never a bare minimum stub. This is not optional styling advice. It is the definition of done for a UI build.

**Design first, then integrate.** Build in two passes, so the codebase's constraints (tokens, libraries, accessibility) don't crush the design before it exists:
1. **Design the surface** (bold, complete, opinionated), as if you were shipping it standalone, to the agreed design system. Compose the whole page (`ui/implementation.md` Phase 0).
2. **Integrate it** into the codebase: installed styling library, real tokens, semantic HTML, accessibility, responsive (Phases 1 to 5).

**Disqualifiers, any one means NOT done, fix before you report:**
- a lone centered form or single input box floating on an empty page
- large dead zones, or content stranded in a narrow column with blank canvas around it
- naked / unstyled / full bleed elements (a raw black bar, an unstyled header, a default unstyled platform control)
- default only styling (one flat button, hairline default borders, system font, no considered accent, no depth)
- missing states (no empty / loading / error) or orphaned controls (a toggle or quick action with nothing around it)
- a bare functional widget where a product would ship a full surface (brand, real copy, layout, supporting content, footer)

**Prove it before you report.** Before declaring the UI done, audit the build yourself against these disqualifiers and against the page's `design.md` mandate, and fix every hit. When you have a browser or screenshot tool, render the page and look at it, and fix any visual defect you see (the only reliable way to catch a broken render like a stray black bar). Say in the report what you audited.

## Design source (route by what you were given)

1. **Figma connected (the spec says use it)** → pull the real design from Figma, build to the frames. Route: `ui/mcp.md`.
2. **Image provided (pasted in chat, not a repo file)** → replicate it pixel perfect. The image is both the look and the composition, so match it faithfully and do NOT embellish beyond it. Tokenize what you see (values into CSS, character into `design.md`) and derive the responsive and accessible behavior a single screenshot cannot show. Route: `ui/image.md`.
3. **A design system already exists** (`design.md` + tokens in CSS) → design the new page WITHIN that system, at the bar above: a full professional surface, consistent with what is already shipped. Route: `ui/existing.md`.
4. **Nothing provided** → establish the design system first (the `frontend-design` skill when available, else derive it from the rules in `ui/generate.md` B2 and verify its contrast), record it in `design.md` (character + mandate + pointers) with the tokens written to CSS, then build to the bar above, maximalist and complete. Route: `ui/generate.md`.

Cases 3 and 4 get the full chat app treatment (bold, complete, product level); case 2 gets faithful fidelity; case 1 gets Figma fidelity. Follow the source the spec recorded.

All paths converge on: component or screen → detect the platform and its systems → token sync → the implementation phases.

## How the UI build fits the project's approach

The UI build serves the project's build approach (read in `SKILL.md` Step 2), never dictates one. Shell first on placeholder data, wired later, is the Facade mode: one strategy, not the universal default. An end to end / tracer bullet slice lands the data layer in the same pass, so bind to the real source; a Journey completes the whole user path for the phase. The phases below apply under every approach; only when real data arrives differs. No recorded approach: build the UI as part of a coherent end to end slice.

---

## Portability (any OS, any agent)

Any Agent Skills client, macOS/Linux/Windows. Detection snippets (`find`, `cat | grep`, `cp`) are POSIX reference: use your agent's own cross platform file tools. Bundled files (`checklist.md`, `ui/*.md`) are paths relative to this skill's folder, read on demand: read this guide's phases as reached, not all up front. The UI build runs inline (it is interactive); heavy code exploration (finding existing components/tokens to match) goes to a read only subagent per `SKILL.md` Step 2.5. No interactive question picker: ask the prompts as plain text with the same options.

## Step 0: Where the design comes from (one decision, made once)

Check the governing spec first (`/develop` read it in Step 2). The design source is the engineer's choice, so follow what the spec recorded, never ask again, and never default to Figma just because an MCP is connected.

Route on what the spec recorded, using the *Design source* table above:
- Figma or another design MCP → `ui/mcp.md`.
- A screenshot or a pasted image → `ui/image.md`.
- An existing design system, or "extract from existing UI" → **Step 0.1**.
- A described direction, a brand or site URL, or nothing at all → `ui/generate.md` (B1 finds the direction, B2 derives and verifies the tokens into CSS and the character into `design.md`), then implement.

No spec governs this UI, or the spec is silent on the design system → fall through to the detection in Steps 0.1 to 0.3. If detection settles nothing, ask (in the `SKILL.md` Step 0 round) *"How should I get the design for this?"* with options **From Figma (its MCP)** · **From a screenshot / images** · **From the existing `design.md` / current UI** · **No design, suggest a direction** (the picker adds Other), then proceed by their pick.

## Step 0.1: Check for existing design.md

File search for `design.md` within about 3 levels of the project root, ignoring `node_modules`, `.git`, `.claude`. Found: validate; a real one has a `character` and a `## Build mandate` (art direction) and points at the CSS for tokens. Empty, or only a stub: treat as not found and warn the user. (An older `design.md` that still carries inline `colors:` / `typography:` value blocks is still valid; treat the CSS as authoritative for values.)

Found and valid → **Design.md path**, skip Steps 1 onward.
Not found → **Step 0.2 (brownfield check)**.

---

## Step 0.2: Brownfield check (no design.md, but is there existing UI?)

Before generating a fresh design system, check for an existing visual language to match; a new one over an existing app clashes with what's shipped. Search the project (ignoring dependency dirs) for:
- Styling, token, or theme files: wherever this platform keeps them (a CSS/token/theme file on web, the theme or style module on mobile or desktop).
- Component directories: the existing component or screen tree.

Found (brownfield): ask in the `SKILL.md` Step 0 round, via your agent's interactive option picker (`AskUserQuestion` on Claude Code) or plain text options with the same choices:
- **question**: "There's no `design.md`, but this project already has UI. How should I get the design system?"
- **header**: "Design system"
- **options**:
  1. `Extract from existing code`: "Recommended, capture the design direction from the current tokens/components into `design.md`, pointing at the existing CSS tokens, so new UI matches what's shipped." → **Step 0.3**.
  2. `Use a reference`: "I'll give a screenshot, a `design.md` URL, or a site to work from." → **Step 1**.
  3. `Match a specific file`: "Build to mirror an existing component/page I name; I'll point you at it." → read that file's styles, treat them as the local source of truth.

No existing UI (greenfield) → **Step 0.5**.

### Step 0.3: Capture the design direction from existing code

The project's styling or theme system already holds the token values (the source of truth); do not copy them into `design.md`. Read the token/theme files and 3 to 5 representative components/screens to read the *system*, then write `design.md` as art direction (per `ui/generate.md` B2's schema): `source: extracted-from-code`, the character you observe, the composition and component patterns the app already uses, the build mandate, and a pointer to where the tokens live. Inconsistent codebase: note the dominant patterns and the variance. Show a short summary, confirm before building, then implement to the direction with that styling/theme system as the token source of truth.

---

## Step 0.5: Component or screen?

Determines prop API design, routing integration, file placement.

| Prompt contains | Build type |
|---|---|
| "screen", "page", "layout", "route", "dashboard", "view" | **Screen** |
| "component", "button", "card", "input", "modal", "badge", "dropdown", "toggle", "chip" | **Component** |
| Ambiguous | Ask |

If ambiguous, ask in the `SKILL.md` Step 0 round:
```
"Is this a reusable component or a full page?"
  - Reusable component: isolated, takes props, no routing
  - Full page / screen: owns layout, integrates with router
```

**Component rules** (apply throughout all phases): define its props/inputs contract before any markup; export it from its own file the way this codebase does; no navigation imports and no screen level data fetching inside the component; if the project uses a component workbench (stories, previews), add its file alongside; file naming matches the convention of existing components.

**Screen rules** (apply throughout all phases): integrate with the platform's navigation system (its router or navigator); include loading, error, and empty states at screen level; wrap with the existing layout/shell component if the project has one.

---

## Detect the platform and what it is built with

Before building, read what the project already uses, from its manifest, config, and existing UI code, then build in that idiom. Never impose a specific tool or framework; use what is installed, the way it is meant to be used. Detect:

- **Platform and UI framework**: web, native mobile, cross platform mobile, or desktop, and the UI toolkit in use. It drives navigation integration, layout primitives, and image and font handling.
- **Styling and theming system**: how this project expresses styles and design tokens (a CSS framework, CSS modules with custom properties, or CSS in JS on web; the platform's stylesheet or theme system on mobile and desktop). Build styles its way, and put token values there, not in `design.md`.
- **Navigation system**: integrate a screen with the project's router or navigator.
- **Light and dark theme mechanism**: the project's way of switching themes (a class or media query on web; the platform appearance API elsewhere). Support both themes as a first class state, never an afterthought.
- **Icon set**: use whatever icon system is installed; never emoji or placeholder art. Size icons from a spacing token. Hide decorative icons from assistive tech; give a standalone interactive icon an accessible label.

Nothing installed yet for one of these: pick the platform's conventional, current best fit, note the choice in the report, and do not freeze a product name here.

---

## Step 1: Load the selected UI path

Based on the checks above, read exactly one source file:

- `ui/mcp.md` when Figma or another design MCP is the source.
- `ui/image.md` when a screenshot or image is the source.
- `ui/existing.md` when an existing `design.md` or current UI is the source.
- `ui/generate.md` when there is no source: it finds a direction, then derives and verifies the system.

After the selected source has resolved tokens, assets, and design direction, read `ui/implementation.md` and follow it through the implementation phases and report. Do not read the other source files unless the source changes.

## Reference files

- Accessibility checklist: `checklist.md`
- Project design system: `./design.md` (art direction and the build mandate; token values live in the platform styling/theme system)
- UI source routes: `ui/mcp.md`, `ui/image.md`, `ui/existing.md`, `ui/generate.md`
- UI implementation phases and report: `ui/implementation.md`
