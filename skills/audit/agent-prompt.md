# Audit Subagent Prompt Template

Main model fills this and passes it as the subagent prompt. Placeholders in ALL_CAPS.

---

You are running /audit in **PHASE** mode. Your tools are Read, Bash, Write, and Edit. Use them freely.

## Canonical context file: AGENTS.md (+ a CLAUDE.md pointer)

The durable context goes in **`AGENTS.md`** (root or `<area>/AGENTS.md`) — it's tool-agnostic, read by every agent. For each `AGENTS.md` you create, also create a **sibling `CLAUDE.md` that imports it** via Claude Code's `@` directive (Claude reads CLAUDE.md and auto-loads AGENTS.md; other tools read AGENTS.md directly). The `@AGENTS.md` resolves relative to the CLAUDE.md, so a nested CLAUDE.md imports its sibling nested AGENTS.md:

```markdown
# CLAUDE.md

This project's context for all AI tools lives in [AGENTS.md](./AGENTS.md).
Claude Code loads it via the import below:

@AGENTS.md
```

Hard rules:
- **Never overwrite an existing `AGENTS.md`.** Create it only when missing; otherwise propose additions via the diff format. Treat it as possibly authored by the user or another tool.
- **`CLAUDE.md` only ever holds the pointer** — never duplicate AGENTS.md content into it.
- **Migration** (when told `MIGRATE=yes`): copy the legacy `CLAUDE.md`'s content verbatim into a new `AGENTS.md`, then replace `CLAUDE.md` with the pointer above. Never discard curated content.
- If a `CLAUDE.md` pointer already exists and points to AGENTS.md, leave it untouched.

## Stack reconciliation (every phase that writes or audits root)

Root `AGENTS.md`'s `## Stack` is a **mirror of the architecture decision**. Before finalizing root in any phase, check `docs/adr/` for an architecture ADR (one with a `## Proposed stack` section):
- **Creating root** (greenfield, whole-repo): populate `## Stack` from that ADR if it exists — it is the source of truth, even on greenfield where no code exists yet. Otherwise derive from the code/manifest, or `<to be filled>`.
- **Auditing existing root** (gap-fill): if root's `## Stack` is missing, placeholder, or **contradicts** the architecture ADR, that's a gap/contradiction — surface it (ROOT_GAPS for missing, CONTRADICTIONS for conflict). Never silently overwrite curated stack text.

This makes the `/architect → /audit` handoff order-independent: whenever audit runs, root absorbs the decided stack.

## Build approach (every phase that writes or audits root)

Root `AGENTS.md`'s `## Build approach` is a **project-wide convention** — the default build strategy every skill reads, exactly like `## Stack`. Reason as the engineer setting the team's default: **capture** the approach as a convention, don't invent or prescribe one. Its source of truth is the **roadmap header** (the build-approach line `/roadmap` records):
- **Creating root** (greenfield, whole-repo): seed `## Build approach` from the roadmap header if one exists — a short line: the approach's name + its one-line principle. If there's no roadmap, or none is set yet, write `<TBD — set by /roadmap>` rather than guessing one.
- **Auditing existing root** (gap-fill): if root's `## Build approach` is missing while the roadmap header names one, that's a gap (ROOT_GAPS); if the two name **different** approaches, that's a contradiction (CONTRADICTIONS). Never silently overwrite a curated line.

## Phase

PHASE
<!-- one of: greenfield | whole-repo | area | gap-fill -->

## Scope / area

SCOPE_OR_AREA
<!-- "whole repo" or a specific path like "src/auth" -->

## Monorepo

MONOREPO_OR_NO
<!-- "no", or "yes — apps: web, api, …". If yes: each app/package is its own area — give each
     a nested AGENTS.md with its own stack/commands/conventions, and keep root AGENTS.md to
     monorepo-wide concerns (workspace tooling, shared conventions) only. -->

## Task context

TASK_CONTEXT_OR_NONE

## Existing root AGENTS.md

ROOT_AGENTS_MD_CONTENTS_OR_MISSING

## Existing area AGENTS.md

AREA_AGENTS_MD_CONTENTS_OR_MISSING
<!-- "MISSING" if phase is not area, or file doesn't exist -->

## Selected coding patterns (Phase 1 only)

SELECTED_PATTERNS_OR_NONE
<!-- Contents of the chosen pattern preset files, concatenated -->

## Additional standards selected (Phase 1 only)

ADDITIONAL_STANDARDS_OR_NONE
<!-- e.g. "Strict types, Conventional commits" -->

---

## Instructions by phase

---

### GREENFIELD phase

The project is new — no source files yet. Your job: create a root AGENTS.md that encodes the engineer's chosen standards so every future decision starts from the right foundation.

**Step 1 — Minimal discovery**

Using your file tools, list the top couple of levels of the project (excluding `.git`), and check `docs/adr/` for numbered ADR files (`NNNN-*.md`) — did /architect already choose the stack?

Read the project's manifest if present (whatever the ecosystem uses) — note language and package manager. **If an architecture ADR exists in `docs/adr/`** (one with a `## Proposed stack` section), read it: the engineer already decided the stack via `/architect`. Use it to populate `## Stack` — do not leave placeholders or contradict it. This is the cold-start handoff: the architecture decision becomes the project's first ambient convention.

Also check `docs/roadmap/` (or `.workflow/roadmap/`) for a roadmap: its **header** may record the project's **build approach** (name + one-line principle). If it does, that's the seed for `## Build approach` — capture it verbatim as a convention. If there's no roadmap or no approach set, leave it `<TBD — set by /roadmap>`.

**Step 2 — Create root AGENTS.md**

Use the template below. Populate `## Stack` from the architecture ADR if one exists, otherwise from what you found (or `<to be filled>` if truly nothing is decided yet). Populate `## Build approach` from the roadmap header if one is set (name + one-line principle), otherwise `<TBD — set by /roadmap>`.

For `## Rules`: use the SELECTED_PATTERNS content injected above as the basis. If the engineer selected "Other" (free-text) instead of a named pattern, treat their exact text as the conventions and include it verbatim under `## Rules` — do not interpret or reformat it. Append ADDITIONAL_STANDARDS as extra bullet points at the end of `## Rules`. If nothing was found for stack, write placeholders like `<to be filled>`.

**On a monorepo**, keep this root doc to **monorepo-wide** concerns — the workspace tooling (`pnpm`/`turbo`/`nx`), shared standards, and a `## Context files` section pointing at each workspace's nested doc. The per-app stack does **not** go in root.

**Step 2b — Per-workspace nested AGENTS.md (monorepo only)**

If `MONOREPO_OR_NO` is `yes`, then for **each** workspace listed (`apps/*`, `packages/*`), read its `<workspace>/package.json` (or its manifest) with your file tools — its stack, deps, and scripts.
Even though no features are built yet, the scaffold declares the workspace's **stack and commands** — capture them so `/architect` and `/develop` can read that workspace's stack from *its* doc (they won't look in root). Write `<workspace>/AGENTS.md` using the nested template: `## Stack` from its manifest, `## Commands` from its scripts (scoped — e.g. `pnpm --filter <name> dev`), and inherit the root's `## Rules` by reference. Create the sibling `<workspace>/CLAUDE.md` pointer, and add a pointer line for each under root's `## Context files`. Skip a workspace that's an empty placeholder with no manifest.

**Step 3 — Report** (use the report format at the bottom of this file). List every per-workspace doc created.

---

### WHOLE-REPO phase

A codebase exists but no AGENTS.md. Your job: explore enough to write an accurate root AGENTS.md.

**Step 1 — Discover**

Using your file tools, list the project tree a few levels deep, skipping vendored/generated dirs (`.git`, `node_modules`, `.next`, `dist`, `build`).

Then read whichever exist:
- `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` — stack and deps
- `.github/workflows/` — CI and deploy patterns
- Main entry point (`src/index.*`, `main.*`, `app.*`, `server.*`)
- Test config (`jest.config.*`, `pytest.ini`, `vitest.config.*`)
- Any existing `AGENTS.md` files — using your file tools, find all `AGENTS.md` (excluding `.git`).
  - If nested AGENTS.md files are found (i.e. not the root): collect their paths. Add a pointer line for each under `## Context files` when writing root AGENTS.md. Format: `- [<path>](<path>) — <one-line description inferred from the file's ## Overview section>`.

**Step 2 — Extract durable knowledge**

From your reading, answer:
- What is the stack, runtime, and framework?
- What are the daily commands (install, dev, build, test)?
- What conventions are visible in the code (naming, file structure, patterns)?
- What would trip up a new developer in week one?

Discard: implementation details, TODO comments, anything that changes frequently.

**Step 3 — Create root AGENTS.md** using the template below. Keep it global and short (≤60 lines) — area-specific detail belongs in nested docs (next step), not here.

**Step 4 — Create nested AGENTS.md**

**Monorepo (`MONOREPO_OR_NO` = yes):** don't judge or deep-scan. Give **every** workspace (`apps/*`, `packages/*`) a **light stub** `AGENTS.md` **at its root** — `## Stack` + `## Commands` read from that workspace's manifest (scoped, e.g. `pnpm -F <name> …`), plus a one-line overview; create the sibling `CLAUDE.md` pointer and a root `## Context files` pointer for each. No code scan — deep conventions come later when someone runs `/audit <workspace>`. If a workspace already has a doc buried below its root (e.g. `packages/ui/src/mdx/`) and no root doc, follow the relocation rule the main agent surfaced (move up, or root-doc + linked nested). Then skip the judgment step below.

**Single repo:** identify the major areas/modules of the codebase (e.g. `src/auth`, `src/payments`, `src/api`, `src/jobs`). For **each**, decide by judgment whether it warrants its own context file:
- **Warrants nested** — the area has distinct conventions, non-obvious rules, local commands, external integrations, or gotchas a developer must know before touching it.
- **Does not** — it's a simple module with no surprises, or root already covers it. Skip it (don't create one per folder).

For each warranted area: write `<area>/AGENTS.md` using the nested template below, create its sibling `<area>/CLAUDE.md` pointer, and add one pointer line into root's `## Context files` via Edit:
```
- [<area>/AGENTS.md](<area>/AGENTS.md) — <one-line description>
```
This root-vs-nested split is the point: global facts in root, area-specific knowledge co-located with the area's code (where it auto-loads when that code is edited).

**Step 5 — Report** (use the report format at the bottom of this file). List every nested doc created.

---

### AREA phase

Root AGENTS.md exists. A specific area needs study. Your job: (1) check if root AGENTS.md has what it needs for this area, (2) create or update the nested AGENTS.md.

**Step 1 — Explore the area**

Using your file tools, list all files under `SCOPE_OR_AREA`.

Read:
- Key source files (entry points, main modules — not every file, use judgement)
- Test files in this area
- Any local config (tsconfig, .env.example, etc.)
- The existing root AGENTS.md (already injected above)
- The existing area AGENTS.md if present (already injected above)

**Step 2 — Gap-check root AGENTS.md**

Compare what you found in the area against root AGENTS.md. Flag a gap only if it is:
- A command that engineers working in this area need but root doesn't mention
- A stack element, runtime, or major dependency relevant to this area but absent from root
- A hard project-wide rule that the area makes visible (e.g. "all DB calls go through the repository layer")

Do NOT flag: area-specific file lists, local conventions, anything that belongs in a nested file.

Collect gaps in this format and include them in the final report under `Root gaps flagged`:

```
ROOT_GAPS:
- <exact markdown line to add> — target section: `## <section>` — reason: <one line>
```

If no gaps: `ROOT_GAPS: none`

Include the exact text to insert so the main model can apply it with Edit without paraphrasing.

**Step 3 — Nested AGENTS.md**

Decide: does this area have enough distinct conventions, constraints, or gotchas to warrant its own context file?

Warrant: the area has its own patterns, non-obvious rules, local commands, or constraints a developer needs to know before touching it.
Do not warrant: the area is a simple CRUD module with no surprises, or it is already well-covered by root AGENTS.md.

- Area AGENTS.md **missing + warranted** → create it using the nested template below; then add a pointer to root AGENTS.md:
  - If root has `## Context files` with only a placeholder comment (`<!-- ... -->`): replace the comment line with the pointer.
  - If root has `## Context files` with existing entries: append the new pointer line.
  - If root has no `## Context files` section: add the section and the pointer before `## ADRs` (or at the end if no ADRs section).
  - Use Edit tool for all root modifications.
- Area AGENTS.md **missing + not warranted** → note why in the report and skip.
- Area AGENTS.md **exists** → propose additions only (never overwrite). Use the proposed diff format below.

**Step 4 — Report** (use the report format at the bottom of this file).

---

### GAP-FILL phase

Root AGENTS.md already exists. The codebase is partially documented. Your job: audit the **whole codebase** against the existing docs and fill only what's genuinely missing — never rewrite curated content.

**Step 1 — Read what's documented**

The existing root AGENTS.md is injected above. Read every nested AGENTS.md (paths injected above) so you know what's already covered.

**Step 2 — Scan the codebase**

Using your file tools, list the project tree a few levels deep, skipping vendored/generated dirs (`.git`, `node_modules`, `.next`, `dist`, `build`).
Read the manifest(s), CI config, entry points, and a sample of each major area. Build a picture of the real stack, commands, conventions, and the major areas.

**Step 3 — Find four kinds of finding**

- **(a) Global facts missing from root** — a daily command, stack element, project-wide rule, or the **build approach** (present in the roadmap header but absent from root) that's true but not recorded in root AGENTS.md. Return each as a `ROOT_GAPS` line (exact markdown + target section) — do NOT edit root yourself; the main model applies these with permission.
- **(b) Undocumented areas** — a major area with distinct conventions/gotchas that has **no** nested AGENTS.md. Create the nested doc (nested template + sibling CLAUDE.md pointer) and add its root pointer line via Edit. (This is safe to do directly — you're creating, not overwriting.)
- **(c) Stale/incomplete nested docs** — an existing nested AGENTS.md missing something now true of its area. Return as `PROPOSED_ADDITIONS` — do NOT edit it yourself.
- **(d) Contradictions** — a doc states something the codebase or its governing records **disprove**: the documented test runner or framework isn't the one the project actually uses; root's `## Stack` conflicts with the architecture ADR; root's `## Build approach` names a different strategy than the roadmap header; a documented command no longer exists. This is worse than a gap — the docs are actively wrong. **Do NOT auto-fix** (the line may be curated). Return each as a `CONTRADICTIONS` entry naming the doc, what it says, and what the code/ADR/roadmap actually shows. The main model surfaces these to the human to resolve.

Be conservative: only flag findings you're confident about and that are durable. When unsure, leave it. Do not flag implementation detail, TODOs, or anything that churns.

**Step 4 — Report** (use the report format at the bottom of this file). Put (a) under `Root gaps flagged`, (c) under `Proposed`, (d) under `Contradictions`, and list (b) — the nested docs you created — under `Written`.

---

## Root AGENTS.md template

=== ROOT AGENTS.md TEMPLATE START ===
# <Project name>

## Stack

- **Language / Runtime**: <e.g. TypeScript, Node 20>
- **Framework**: <e.g. Next.js 14, Express>
- **Key dependencies**: <3–5 most important>
- **Package manager**: <npm / pnpm / yarn / pip / cargo>

## Build approach

<The project's default build strategy — a short line: name + one-line principle. A project-wide
 convention every skill reads (like the stack). Seeded from the roadmap header; `<TBD — set by
 /roadmap>` if none is set yet. The approach is one of:
 - **Tracer Bullet** — vertical end-to-end slices, thin but complete through every layer
 - **Skateboard** — ship the thinnest usable whole, then grow it
 - **Facade** — UI-first shell, then wire the real behavior behind it (prototype-led)
 - **Journey** — build the full user path, one phase at a time>

## Commands

```bash
# Install
<command>

# Dev server
<command>

# Build
<command>

# Test
<command>
```

## ADRs

Stored in `docs/adr/`. Format: `docs/adr/NNNN-title.md`.

## Rules

<Conventions that apply everywhere — from pattern presets and/or discovered from code.
  For greenfield: paste the selected pattern conventions here.
  For whole-repo: extract what you observe in the code.
  Keep this to 5–10 bullet points max.>

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->

=== ROOT AGENTS.md TEMPLATE END ===

---

## Nested AGENTS.md template

```markdown
# <Area name>

## Overview

<2–3 sentences: what this area does and why it exists>

## Key files

| File | Owns |
|---|---|
| <path> | <what it does — one line> |

## Commands

<Local commands if different from root — omit section if identical>

## Conventions

<Bullet list of area-specific conventions, constraints, and non-obvious rules>

## Gotchas

<Non-obvious invariants that would trip a developer — omit section if none>

## Related ADRs

<Links once ADRs exist — omit section if none yet>
```

---

## Proposed diff format (when a file already exists)

Do not overwrite. Output this block and stop:

```
PROPOSED_ADDITIONS for <file path>:

Under `## <section>`, add:

<exact markdown to insert>

Reason: <one line>
```

Only propose what is absent and genuinely useful. Do not rewrite existing content.

---

## Report format (end of every phase)

```
## /audit complete

**Phase**: <greenfield | whole-repo | area | gap-fill>
**Scope**: <what was explored>

**Discovered**:
- <finding>
- <finding>

**Written**:
- <file path> — <created | pointer added | updated>

**Root gaps flagged** (area / gap-fill phases):
<ROOT_GAPS output or "none">

**Proposed** (existing files):
<PROPOSED_ADDITIONS block or "none">

**Contradictions** (gap-fill phase — docs the code disproves; for a human to resolve):
<CONTRADICTIONS entries or "none">
```

---

## Rules you must not break

- Text output: output ONLY the report block at the end. No running commentary, no intermediate messages like "I found X" while exploring. All findings go in the report. File writes via tool calls (Write, Edit) are expected and correct — this rule applies to text output only.
- ROOT_GAPS must be included in the report under `Root gaps flagged` — do not output them mid-stream. Include the exact markdown text to insert so the main model can apply it without paraphrasing.
- Do not create a nested AGENTS.md unless the area genuinely warrants it.
- Root AGENTS.md must stay under ~60 lines. Cut ruthlessly.
- Never overwrite an existing AGENTS.md — propose additions only via the diff format.
- Do not create ADRs. Do not write plans. Stay in your lane.
- Proposed additions must be additions only — no rewrites of existing sections.
- When the engineer selected "Other" for architecture style, use their free-text verbatim in `## Rules`. Do not interpret or paraphrase it.
