# Audit Writing Guide (main thread)

You, the main thread, follow this to write the `AGENTS.md` files. ALL_CAPS placeholders are the inputs you gathered in `pre-flight` and the question rounds (listed in each phase mode file). You do the writing; the only subagent is a read only `scout` that maps a large codebase on the cheapest model.

---

You are running /audit in **PHASE** mode. Use your Read, Bash, Write, and Edit tools freely.

## Canonical context file: AGENTS.md (+ a CLAUDE.md pointer)

Durable context goes in `AGENTS.md` (root or `<area>/AGENTS.md`), tool agnostic, read by every agent. For each `AGENTS.md`, create a sibling `CLAUDE.md` importing it via Claude Code's `@` directive (other tools read AGENTS.md directly). `@AGENTS.md` resolves relative to its CLAUDE.md, so a nested CLAUDE.md imports its sibling nested AGENTS.md:

```markdown
# CLAUDE.md

This project's context for all AI tools lives in [AGENTS.md](./AGENTS.md).
Claude Code loads it via the import below:

@AGENTS.md
```

Hard rules:
- Never overwrite an existing `AGENTS.md` (possibly authored by the user or another tool). Create only when missing; otherwise propose additions via the diff format.
- `CLAUDE.md` only ever holds the pointer; never duplicate AGENTS.md content into it.
- Migration (when told `MIGRATE=yes`): copy the legacy `CLAUDE.md` content verbatim into a new `AGENTS.md`, then replace `CLAUDE.md` with the pointer above. Never discard curated content.
- A `CLAUDE.md` pointer that already points to AGENTS.md stays untouched.

## Stamp what you write, so curated content is knowable

Every `AGENTS.md` this skill creates ends with the drafted by line in the templates below, so a later run (this skill or `/sync`) can tell tool written from human written content.

- **Creating a file**: end it with the drafted by line, exactly as the template shows.
- **Gap filling a file that still carries the line**: add or fix facts surgically, leave the line in place.
- **Gap filling a file with no drafted by line**: a human took it over. Add missing facts only, never rewrite a line, route anything that would change existing prose to CONTRADICTIONS.

The stamp records provenance, not permission: it never licenses overwriting an edited line, and the "never overwrite curated prose" rule below holds either way.

## The mirrored root fields

<!-- ROOT-FIELD-CONTRACT:START (identical in /audit and /sync; edit both or neither) -->
Root `AGENTS.md` carries two mirrored fields. Each has exactly one source of truth outside the file, and no skill may invent a value for either:

- `## Stack` mirrors the architecture spec, the one under `docs/specs/` with a `## Proposed stack` section.
- `## Build approach` mirrors the scope header's build approach line, the one `/scope` records.

Three rules bind every skill that touches them. Never overwrite curated prose in either field. Fill a field only when it is missing or still a placeholder. When a field and its source disagree, flag the divergence and name the file you read the source from, rather than picking a winner.
<!-- ROOT-FIELD-CONTRACT:END -->

What `/audit` does with them (every phase that writes or audits root):

- **Creating root** (greenfield, whole-repo): populate `## Stack` from the architecture spec if it exists (source of truth, even on greenfield with no code), else the code/manifest, else `<to be filled>`. Seed `## Build approach` from the scope header if one exists (name + one line principle), else `<TBD, set by /scope>`.
- **`## Git`** (from the git integration question): write the engineer's choice as a small block, e.g. `- integration: on` / `- branch prefix: feat/` / `- commit: per-milestone`, or just `- integration: off`. Absent means off. A recorded preference, not a mirrored source of truth; `/develop` reads it to branch and commit, `/document` to gate the PR.
- **Auditing existing root** (gap-fill): either field missing or placeholder → ROOT_GAPS; either field contradicting its source → CONTRADICTIONS.

This keeps the `/architect → /audit` handoff order-independent: root absorbs the decided stack whenever audit runs.

## Phase

PHASE
<!-- one of: greenfield | whole-repo | area | gap-fill -->

## Scope / area

SCOPE_OR_AREA
<!-- "whole repo" or a specific path like "src/auth" -->

## Monorepo

MONOREPO_OR_NO
<!-- "no", or "yes, apps: web, api, …". If yes: each app/package is its own area, give each
     a nested AGENTS.md with its own stack/commands/conventions; root AGENTS.md keeps
     monorepo-wide concerns (workspace tooling, shared conventions) only. -->

## Task context

TASK_CONTEXT_OR_NONE

## Existing root AGENTS.md

ROOT_AGENTS_MD_CONTENTS_OR_MISSING
<!-- contents, or a file path for you to Read, or "MISSING" -->

## Existing area AGENTS.md

AREA_AGENTS_MD_CONTENTS_OR_MISSING
<!-- contents or a file path to Read; "MISSING" if phase is not area, or file doesn't exist -->

## Selected coding patterns (Phase 1 only)

SELECTED_PATTERNS_OR_NONE
<!-- Contents or file path(s) of the chosen pattern preset(s), or the engineer's exact "Other" text -->

## Additional standards selected (Phase 1 only)

ADDITIONAL_STANDARDS_OR_NONE
<!-- e.g. "Strict types, Conventional commits" -->

---

## Instructions by phase

---

### GREENFIELD phase

New project, possibly just scaffolded from its chosen stack (there may be a manifest and scaffold source, but no real feature code yet, and usually an architecture spec that decided the stack). Create a root AGENTS.md encoding the engineer's chosen standards.

**Step 1: Minimal discovery**

With your file tools, list the top couple of project levels (excluding `.git`); read the manifest if present (language, package manager). Check `docs/specs/` for numbered specs (`NNNN-*.md`); if an architecture spec exists (`## Proposed stack` section), read it: the stack is decided, use it for `## Stack`, no placeholders, never contradict it. Check `docs/scope/` (or `.workflow/scope/`): if the scope header records a build approach, capture it verbatim as the `## Build approach` seed; else `<TBD, set by /scope>`.

**Step 2: Create root AGENTS.md**

Use the template below. `## Stack`: spec, else findings, else `<to be filled>`. `## Build approach`: scope header, else `<TBD, set by /scope>`. `## Rules`: base on SELECTED_PATTERNS (Read it if given as a path); if "Other" free text was chosen, include it verbatim, never interpret or reformat it; append ADDITIONAL_STANDARDS as extra bullets at the end.

If `INSTALLED_SKILLS_OR_NONE` is provided, write a `## Agent skills` section (template above): ONE bullet per skill, `- [<skill>](<skills-dir>/<skill>/): `<owner>/<repo>`, <what it covers>`, so a later skill loads only the ones it needs, never a dense line of names. Detect the project's real skills directory (`.claude/skills/` on Claude Code, `.agents/skills/` on other agents, or plain `skills/`) for the link; never hardcode a Claude only path, since every tool reads this file. Keep `<owner>/<repo>` on each bullet as the tool agnostic identity. If `DECLINED_TOOLS_OR_NONE`, add a compact `Declined: <tool>, <tool>` line (nothing to load, so no location; stops a later `/audit` or `/architect` offering again it). If `MCP_SERVERS_OR_NONE`, add a compact `MCP servers: <server> (connected|recommended)` line. Project wide tech at root; area specific at that area's nested doc.

Monorepo: keep root to monorepo wide concerns (the workspace tooling, meaning the monorepo's package manager and task runner, shared standards, a `## Context files` section pointing at each workspace's nested doc); per app stack does not go in root.

**Step 2b: Per workspace nested AGENTS.md (monorepo only)**

If `MONOREPO_OR_NO` is `yes`: for each workspace (`apps/*`, `packages/*`), read its manifest. Even with no features built, the scaffold declares the workspace's stack and commands; capture them so `/architect` and `/develop` read them from the workspace's own doc (not root). Write `<workspace>/AGENTS.md` with the nested template (`## Stack` from its manifest, `## Commands` from its scripts, scoped to the workspace, e.g. a filtered dev command like `<pkgmgr> --filter <name> dev`, root `## Rules` inherited by reference), the sibling `<workspace>/CLAUDE.md` pointer, and a pointer under root's `## Context files`. Skip an empty workspace with no manifest.

**Step 3: Report** (format at the bottom); list every per workspace doc created.

---

### WHOLE-REPO phase

A codebase exists but no AGENTS.md. Explore enough to write an accurate root AGENTS.md.

**Step 1: Discover**

With your file tools, list the project tree a few levels deep, skipping vendored/generated dirs (`.git`, `node_modules`, `.next`, `dist`, `build`). Read whichever exist:
- `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod`: stack and deps
- `.github/workflows/`: CI and deploy patterns
- Main entry point (`src/index.*`, `main.*`, `app.*`, `server.*`)
- Test config (`jest.config.*`, `pytest.ini`, `vitest.config.*`)
- All existing `AGENTS.md` (excluding `.git`); for each nested one found (not the root), add a pointer line under `## Context files` when writing root: `- [<path>](<path>): <one-line description inferred from the file's ## Overview section>`.

**Step 2: Extract durable knowledge**

Stack, runtime, framework; daily commands (install, dev, build, test); conventions visible in the code (naming, file structure, patterns); what would trip up a new developer in week one. Discard implementation details, TODO comments, anything that changes frequently.

**Step 3: Create root AGENTS.md** with the template below; global and short (≤60 lines), area detail goes in nested docs (next step).

**Step 4: Create nested AGENTS.md**

Monorepo (`MONOREPO_OR_NO` = yes): don't judge or deep scan. Every workspace (`apps/*`, `packages/*`) gets a light stub `AGENTS.md` at its root (`## Stack` + `## Commands` from its manifest, scoped, e.g. `<pkgmgr> -F <name> …`, plus a one line overview), the sibling `CLAUDE.md` pointer, and a root `## Context files` pointer. Deep conventions come later via `/audit <workspace>`. A doc buried below a workspace root with no root doc: follow the relocation rule the main agent surfaced. Skip the judgment step below.

Single repo: identify the major areas/modules (e.g. `src/auth`, `src/payments`, `src/api`); judge each. Warrants a nested doc: distinct conventions, not obvious rules, local commands, external integrations, or gotchas a developer must know before touching it. Does not: a simple module with no surprises, or root already covers it (skip; never one per folder). For each warranted area: write `<area>/AGENTS.md` with the nested template, its sibling `<area>/CLAUDE.md` pointer, and one pointer line in root's `## Context files` via Edit:
```
- [<area>/AGENTS.md](<area>/AGENTS.md): <one-line description>
```
Global facts in root; area knowledge kept alongside the area's code (it loads automatically when that code is edited).

**Step 5: Report** (format at the bottom); list every nested doc created.

---

### AREA phase

Root AGENTS.md exists. Job: (1) check whether root AGENTS.md has what this area needs, (2) create or update the nested AGENTS.md.

**Step 1: Explore the area**

With your file tools, list all files under `SCOPE_OR_AREA`. Read: key source files (entry points, main modules, not every file, use judgement); test files in this area; any local config (tsconfig, .env.example, etc.); the existing root and area AGENTS.md (provided above; Read them if given as paths).

**Step 2: Gap check root AGENTS.md**

Flag a gap only if it is: a command engineers working in this area need but root doesn't mention; a stack element, runtime, or major dependency relevant to this area but absent from root; a hard project wide rule the area makes visible (e.g. "all DB calls go through the repository layer"). Do NOT flag area specific file lists, local conventions, or anything that belongs in a nested file.

Collect gaps in this format for the final report under `Root gaps flagged`:

```
ROOT_GAPS:
- <exact markdown line to add>, target section: `## <section>`, reason: <one line>
```

If no gaps: `ROOT_GAPS: none`. Keep the exact text to insert so you can apply it with Edit without paraphrasing.

**Step 3: Nested AGENTS.md**

Warrant (own patterns, not obvious rules, local commands, or constraints a developer needs to know first) vs not (a simple CRUD module with no surprises, or already well covered by root AGENTS.md).

- Missing + warranted → create with the nested template, then add a pointer to root AGENTS.md (all root modifications via Edit): `## Context files` holding only a placeholder comment (`<!-- ... -->`) → replace the comment line with the pointer; existing entries → append the pointer line; section absent → add the section and pointer before `## specs` (or at the end if no specs section).
- Missing + not warranted → note why in the report and skip.
- Exists → propose additions only (never overwrite), via the diff format below.

**Step 4: Report** (format at the bottom).

---

### GAP-FILL phase

Root AGENTS.md already exists; the codebase is partially documented. Audit the whole codebase against the existing docs and fill only what's genuinely missing; never rewrite curated content.

**Step 1: Read what's documented**

Read the existing root AGENTS.md (provided above; Read it if given as a path) and every nested AGENTS.md (paths provided above).

**Step 2: Scan the codebase**

With your file tools, list the project tree a few levels deep, skipping vendored/generated dirs (`.git`, `node_modules`, `.next`, `dist`, `build`). Read the manifest(s), CI config, entry points, and a sample of each major area; build a picture of the real stack, commands, conventions, and major areas.

**Step 3: Find four kinds of finding**

- (a) Global facts missing from root: a daily command, stack element, project wide rule, or the build approach (in the scope header but absent from root) that's true but unrecorded. Collect each as a `ROOT_GAPS` line (exact markdown + target section); apply only with the engineer's permission (the gap handling step in `modes/gapfill.md`), never silently, since a root line may be curated.
- (b) Undocumented areas: a major area with distinct conventions/gotchas and no nested AGENTS.md. Create the nested doc (nested template + sibling CLAUDE.md pointer) and add its root pointer line via Edit (safe to do directly: creating, not overwriting).
- (c) Stale/incomplete nested docs: an existing nested AGENTS.md missing something now true of its area. Return as `PROPOSED_ADDITIONS`; do NOT edit it yourself.
- (d) Contradictions: a doc states something the codebase or its governing records disprove (documented test runner or framework isn't the one used; `## Stack` conflicts with the architecture spec; `## Build approach` differs from the scope header; a documented command no longer exists). Worse than a gap: the docs are actively wrong. Collect each as a `CONTRADICTIONS` entry naming the doc, what it says, and what the code/spec/scope actually shows; surface to the human, never fix automatically (the line may be curated).

Be conservative: flag only durable findings you're confident about; when unsure, leave it. Do not flag implementation detail, TODOs, or anything that churns.

**Step 4: Report** (format at the bottom). Put (a) under `Root gaps flagged`, (c) under `Proposed`, (d) under `Contradictions`, and list (b), the nested docs you created, under `Written`.

---

## Root AGENTS.md template

=== ROOT AGENTS.md TEMPLATE START ===
# <Project name>

## Stack

- **Language / Runtime**: <e.g. TypeScript, Node 20>
- **Framework**: <e.g. Next.js 14, Express>
- **Key dependencies**: <3 to 5 most important>
- **Package manager**: <npm / pnpm / yarn / pip / cargo>

## Build approach

<The project's default build strategy, a short line: name + one line principle. A project wide
 convention every skill reads (like the stack). Seeded from the scope header; `<TBD, set by
 /scope>` if none is set yet. The approach is one of:
 - **Tracer Bullet**, vertical end to end slices, thin but complete through every layer
 - **Skateboard**, ship the thinnest usable whole, then grow it
 - **Facade**, UI first shell, then wire the real behavior behind it (prototype led)
 - **Journey**, build the full user path, one phase at a time>

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

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

<Conventions that apply everywhere, from pattern presets and/or discovered from code.
  For greenfield: paste the selected pattern conventions here.
  For whole-repo: extract what you observe in the code.
  Keep this to 5 to 10 bullet points max.>

## Agent skills

<Installed Agent Skills carrying this project's tool conventions, ONE bullet each (rules in
  greenfield Step 2), omit the section if none. Only project wide skills here; an area specific
  skill goes in that area's nested AGENTS.md.>
- [<skill>](<skills-dir>/<skill>/): `<owner>/<repo>`, <one line: what it governs>

<Then, only if present, a compact line each (a declined tool has nothing to load, and an MCP
  server is a connected service with no local file, so both stay lines, not bullets):
  `Declined: <tool>, <tool>` (offered before, not wanted; keep so a later /audit or /architect
  does not offer it again) · `MCP servers: <server> (connected), <server> (recommended)`>

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._

=== ROOT AGENTS.md TEMPLATE END ===

---

## Nested AGENTS.md template

```markdown
# <Area name>

## Overview

<2 to 3 sentences: what this area does and why it exists>

## Key files

| File | Owns |
|---|---|
| <path> | <what it does, one line> |

## Commands

<Local commands if different from root, omit section if identical>

## Conventions

<Bullet list of area-specific conventions, constraints, and non-obvious rules>

## Gotchas

<Non-obvious invariants that would trip a developer, omit section if none>

## Agent skills

<Area specific skills, same bullet format as root, omit if none:
  - [<skill>](<skills-dir>/<skill>/): `<owner>/<repo>`, <what it governs for this area>
  A declined tool or MCP server stays a compact `Declined:` / `MCP servers:` line, as in root.>

## Related specs

<Links once specs exist, omit section if none yet>

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
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

Lead with what was written and the next step; list only what needs the engineer (per `docs/conventions.md`). The AGENTS.md contents are in the files, not the chat. Template:

```
## /audit complete · <greenfield | whole-repo | area | gap-fill>

**Wrote <AGENTS.md files: created / updated / pointer added>, capturing <stack · conventions · tooling · git setting>.**
Next: <the first unticked scope box, usually `/develop tooling`, or `/develop <first feature>`>
Heads up (need you):
- Root gap: <ROOT_GAPS, one line each>   (area / gap-fill only)
- Proposed additions to an existing file, apply? <PROPOSED_ADDITIONS, one line each>
- Contradiction, docs the code disproves, resolve: <CONTRADICTIONS, one line each>
```

Drop any Heads up bullet with no items, and the whole block if there are none.

---

## Rules you must not break

- Write the `AGENTS.md` files with your file tools; don't paste their full contents back into the chat. When the phase is done, produce the report block at the end as your working summary for the relay.
- ROOT_GAPS goes under `Root gaps flagged` in that summary. Keep the exact markdown text to insert so you apply it (with the engineer's permission) without paraphrasing.
- Do not create a nested AGENTS.md unless the area genuinely warrants it.
- Root AGENTS.md must stay under ~60 lines. Cut ruthlessly.
- Never overwrite an existing AGENTS.md, propose additions only via the diff format.
- Do not create specs. Do not write plans. Stay in your lane.
- Proposed additions must be additions only, no rewrites of existing sections.
- When the engineer selected "Other" for architecture style, use their free text verbatim in `## Rules`. Do not interpret or paraphrase it.
