# UI Source: existing

## Design.md path: existing design system

Case 3: the project already has a design system. Two complementary sources: `design.md` holds the art direction (character, the build mandate, composition and component rules) and the CSS / tailwind config holds the token VALUES (the single source of truth). Read both. Never invent a value; take colors, fonts, spacing, radius, shadows, and motion from the CSS tokens, and any unspecified value from the nearest specified token.

**Build the new page WITHIN the system, at the bar.** A new page in an existing system is still a full professional product surface (the guide's bar, and `ui/implementation.md` Phase 0), never a bare form: as complete and considered as the pages already shipped, and visually consistent with them. Design first (compose the whole surface in the system's language), then integrate.

**Naming note:** `colors.primary` and `colors.accent` are synonyms for the brand accent. Older systems use `primary`; derived systems use `accent`. Treat them identically.

### DS1: Read the direction and the tokens

Read `design.md` in full: character, the build mandate, composition patterns, and every rule in `## Component & usage rules` (do's and don'ts). Then read the real token values from the CSS token file (`globals.css` / tailwind config) it points to: colors (light + dark), typography, spacing, radius, shadows, motion. The CSS is the source of truth for values; `design.md` is the source of truth for direction. (If an older `design.md` still carries inline token values, treat the CSS as authoritative where they disagree, and note it in the report.)

### DS2: Confirm token coverage

Run stack, styling, and dark mode detection. If the page needs a token the CSS does not have yet, add it in the system's language (derive from the nearest existing token, follow the `design.md` rules), never a one off hardcoded value. Never silently overwrite an existing token; a genuine conflict → list it in the report, let the engineer decide.

### DS3: Implement

Run the implementation phases (`ui/implementation.md`): Phase 0 composes the full surface in the existing system, Phases 1 to 5 integrate it, Phase 6 audits the build against the bar. `design.md` governs direction, the CSS tokens govern values.

---
