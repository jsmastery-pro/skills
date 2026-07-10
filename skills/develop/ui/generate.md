# UI Source: generated

## Path B: No source, establish the system, then build (design first)

This is case 4 from the guide: nothing was provided, so you establish the design system, then build to the bar. Design first, integrate second.

**Prefer a proven design skill when one is available** (Anthropic's `frontend-design` on Claude Code, Codex's frontend skill, or a design MCP): it sets the visual direction with the same craft that makes the chat app's output good. With none available, derive the system from B2. Either way the token values land in CSS and the art direction lands in `design.md`.

There are no bundled brand templates. You do not copy a design system, you derive one and prove it holds up.

### B1: Find the direction (a reference if one exists, else a mood)

Ask for a reference first; a real one beats anything you invent, and engineers often have one in mind without offering it. Use the agent's picker (`AskUserQuestion` on Claude Code), else plain text with the same options (the picker adds its own free text option; add one yourself in the fallback).

```
"Anything to steer the design?"   (header: "Direction")
  - A site or brand URL       "I'll read it and pull the real colors and type"
  - A design.md URL           "I'll fetch it, validate it, and adopt it"
  - Describe a style          "Tell me the feel and I'll derive the system"
  - Nothing, suggest one      "I'll pick a direction and derive it"   (recommended)
```

- **A screenshot or Figma after all?** Stop and route back through the guide's Step 0 (`ui/image.md` or `ui/mcp.md`). Replicating a real reference beats deriving one.
- **A site or brand URL** → fetch it (no web capability on the main thread: spawn the read only `researcher` subagent on the cheapest model). Read its CSS custom properties and computed styles, not a screenshot of it. Take the accent, the neutral ladder, the fonts, the radius. Then run the B2 checks on what you took: real sites often fail contrast, and you fix it rather than copy the failure.
- **A design.md URL** → fetch, validate it has colors and typography, adopt it, then run the B2 checks.
- **Describe a style** → their words plus the aesthetic guide below, into B2.
- **Nothing** → ask the mood, then derive.

```
"What mood should this UI have?"   (header: "Mood")
  - Dark & focused        "near black canvas, precise, technical, low chrome"
  - Light & professional  "white or off white canvas, calm, trustworthy"
  - Bold & editorial      "strong personality, high contrast, large type"
  - Custom                "describe it and I'll derive from that"
```

The mood sets four things only: canvas polarity, accent saturation, type personality, density. You derive everything else in B2.

### B2: Derive the tokens, do not recall them

Never emit a palette from memory. Derive it, then verify it, then write it. State the values in chat as you go so the engineer can push back before you touch CSS.

**1. Accent.** Choose ONE accent hue that fits the direction. Name the exact hex. A second accent is a decision, not a default; a system with one accent and a good neutral ladder looks more designed than one with three.

**2. Neutrals.** Build one lightness ladder for the whole system, from canvas to ink. Six steps, each a clear visual step from the last, all sharing a slight hue tint from the accent so the greys feel intentional rather than default:

| Token | Role | Light mode | Dark mode |
|---|---|---|---|
| `--color-canvas` | page background | lightest | darkest |
| `--color-surface` | card, panel, raised area | one step in | one step up |
| `--color-border` | hairline, divider | subtle against surface | subtle against surface |
| `--color-muted` | captions, placeholders | mid | mid |
| `--color-body` | secondary text | dark | light |
| `--color-ink` | primary text, headings | darkest | lightest |

Then the semantic pair `--color-success` and `--color-error`, and `--color-on-accent` for text sitting on the accent.

**3. Verify contrast before you write a single line of CSS.** This is the step that separates a derived system from a guessed one. Compute the WCAG ratio for each pair and state it:

- `--color-body` on `--color-canvas`: **4.5:1 minimum**
- `--color-ink` on `--color-canvas`: 4.5:1 minimum (it will pass easily; check anyway)
- `--color-muted` on `--color-canvas`: 4.5:1 if it carries meaning, 3:1 if purely decorative
- `--color-on-accent` on `--color-accent`: **4.5:1 minimum**. This is the one that usually fails.
- `--color-border` against `--color-surface`: **3:1** when the border is the only thing marking a control (an input, a button outline, a focus ring). A purely decorative divider may go lower.
- Large text (24px, or 19px bold) and icons: 3:1

Check **light and dark separately**. A ladder that passes in light frequently fails inverted. Any pair that fails: adjust that step's lightness and recompute. Do not ship a failing pair with a note; fix it. Report the final ratios in the build report.

**4. Type.** One sans for the whole system unless the direction demands a display face; then two, never three. Use a modular scale rather than picked numbers, so the sizes relate to each other:

- Base 16px. Ratio 1.200 (minor third) for product UI, 1.250 for marketing, 1.333 for editorial.
- Line height 1.5 for body, 1.2 for display sizes. Tighter as size grows, never the reverse.
- Weights: three at most (regular, medium, bold). Letter spacing negative only above about 32px.

**5. Space.** A 4px base unit, an 8px rhythm. Every gap, pad, and margin is a multiple. Section spacing is its own larger step, not a random number.

**6. Radius and motion.** Three steps each, no more. Radius: small (inputs, buttons), medium (cards), full (pills, avatars). Motion: instant (about 80ms), base (about 160ms), slow (about 240ms), with one standard ease and one spring. Zero radius and zero motion are valid choices for a brutalist direction; say so deliberately.

**7. Write the values into the project's CSS** (`app/globals.css` / `src/styles/tokens.css`, plus the tailwind config if used), per B3. That file is the single source of truth for colors, typography, spacing, radius, shadows, and motion.

**8. Write `design.md` as ART DIRECTION only**, never a copy of the token values, those live in CSS:

```yaml
---
name: <style>-design-system
source: derived              # or url:<url> | skill:frontend-design
character: "<2 to 3 sentences: the visual personality and mood>"
tokens: "real values live in app/globals.css (and tailwind config); read them there, never duplicated here"
contrast: "<the ratios you verified, e.g. body 7.1:1 light / 8.4:1 dark; on-accent 5.2:1>"
---

## Build mandate
You are a senior product designer. Every page ships as a complete, professional product surface: brand, real product specific copy, a considered layout with hierarchy, all states (empty, loading, error), supporting content, and a footer where the page warrants one. Maximalist, never a lone form on an empty page. Full disqualifier list: the UI guide's bar.

## Character & direction
<what makes this system distinct: the mood, the personality, the one or two moves that define it>

## Composition patterns
<how pages are assembled here: app shell, section rhythm, how auth / landing / list / detail pages lay out>

## Component & usage rules (do's and don'ts)
<accent usage (primary actions only, never decoration), elevation (hairline borders vs shadows), spacing rhythm, button and card conventions>

## Responsive & accessibility direction
<any project specific direction beyond the implementation defaults>
---
```

**Aesthetic guide** (a described style seeds the direction; you still derive and verify the values):
- **Cyberpunk**: near black canvas, neon cyan or magenta accent, 0 to 2px radius, mono font, dense spacing, fast motion (80ms), harsh easing
- **Brutalist**: pure black and white, 0px radius, thick borders, oversized type, zero motion
- **Glassmorphism**: frosted canvas, translucent surfaces, 16 to 24px radius, slow transitions (200 to 400ms), gentle spring
- **Notion style**: off white canvas, a serif display with a sans UI, 3px radius, generous `line-height`, fast subtle motion (100ms)
- **Apple consumer**: white canvas, system font stack, 10 to 20px radius, spring motion (200 to 350ms)
- **Named brand**: use that brand's documented colors and fonts, then verify contrast as above; substitute proprietary fonts (see font installation)

Fill every design.md section with real, specific direction. No placeholders, and no token value dumps (values live in CSS).

### B3: Create CSS token file

Create `app/globals.css`, `src/styles/tokens.css`, or add to an existing globals file. Define CSS custom properties for:
- All colors (light): `--color-canvas`, `--color-surface`, `--color-ink`, `--color-body`, `--color-muted`, `--color-accent`, `--color-on-accent`, `--color-border`, `--color-success`, `--color-error`
- Icon sizes: `--icon-sm: 16px`, `--icon-md: 20px`, `--icon-lg: 24px`
- Typography: `--font-sans`, size scale (`--text-xs` through `--text-4xl`), weight scale
- Spacing: `--space-xxs` through `--space-section`
- Radius: `--radius-sm` through `--radius-full`
- Motion: `--duration-instant` through `--duration-slow`, `--ease-standard`, `--ease-out`, `--ease-spring`

Apply dark overrides via the detected strategy (`.dark {}` or `@media (prefers-color-scheme: dark)`); only override tokens that differ in dark mode. If Tailwind is in use, also extend `tailwind.config.ts` under `theme.extend` with all token values, wiring color tokens via `var(--color-*)` so dark mode works automatically.

---
