---
name: audit
compatibility: Built for Claude Code — uses subagents, model selection, and interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Task, AskUserQuestion
description: "Use this skill to bootstrap a project's AI context — the AGENTS.md files every later skill reads. Run /audit at the start of a greenfield project (it asks your coding standards and seeds root AGENTS.md), on an existing codebase with no or partial docs (it scans and writes root + nested AGENTS.md, adding only what's missing), or on one named area (e.g. /audit src/auth). Writes tool-agnostic AGENTS.md plus a thin CLAUDE.md pointer; never overwrites curated content. Not for ADRs (/architect), post-change upkeep (/sync), or the roadmap (/roadmap)."
---

## What this skill does

The context-bootstrapper. It gives every later skill (and every AI tool) an accurate picture of the project by writing the `AGENTS.md` files — and it handles all three starting points:

- **Greenfield** (no code yet): asks the engineer for the coding standards and conventions, and **seeds the root `AGENTS.md`** from the answers — including the project's **build approach** (name + one-line principle) read from the roadmap header if `/roadmap` set one — so the very first `/develop` already has ambient conventions to build to. (This is the cold-start fix: without it, the foundational stack/standards/build-approach decision has nowhere to land.)
- **Brownfield, undocumented** (code, no `AGENTS.md`): scans the whole project, then **writes the root `AGENTS.md` AND creates nested `<area>/AGENTS.md` files** — using judgment about what is global (→ root) versus area-specific (→ nested).
- **Brownfield, partially documented** (code + some `AGENTS.md` already): checks the existing root and nested docs **against the whole codebase** and **adds only what's missing** — new global facts, and nested docs for undocumented areas — never clobbering curated content.

Does not create ADRs (/architect owns those). Does not maintain files after changes (/sync owns that). Does not write the feature roadmap (/roadmap owns `docs/roadmap/`).

## Context-file convention (AGENTS.md is canonical)

These skills work across all AI tools, so the durable context lives in the **tool-agnostic `AGENTS.md`** (root and nested) — every agent (Codex, Cursor, Claude Code, …) reads it. `CLAUDE.md` is **only a one-line pointer** to its sibling `AGENTS.md`, so Claude Code (which reads `CLAUDE.md`) is forwarded to the shared content. Content is never duplicated across the two.

Rules this skill obeys:
- **Write knowledge into `AGENTS.md`.** Create it when missing. **Never overwrite or clobber an existing `AGENTS.md`** — it may be authored by the user or another tool; gap-fill conservatively (with permission) instead.
- **Maintain `CLAUDE.md` as a pointer only.** Its entire body imports the sibling AGENTS.md via Claude Code's `@` import, so Claude auto-loads the canonical content (other tools read AGENTS.md directly):
  ```
  # CLAUDE.md

  This project's context for all AI tools lives in [AGENTS.md](./AGENTS.md).
  Claude Code loads it via the import below:

  @AGENTS.md
  ```
- **Migrate legacy content.** If a content-ful `CLAUDE.md` exists but no `AGENTS.md`, ask permission, then move its content into a new `AGENTS.md` and replace `CLAUDE.md` with the pointer. Never silently discard curated content.
- The same root/nested rules apply to `AGENTS.md` as previously applied to `CLAUDE.md` (root is short and global; nested only for meaningful areas with real conventions).

## Scope

From the argument or task description:

| Input | Phase triggered |
|---|---|
| No argument, **ambiguous** (scaffolded but no git history) | Phase 0 — ask new-vs-existing, then route |
| No argument, **new project** (no/boilerplate code, no AGENTS.md) | Phase 1 — greenfield setup (ask standards → seed root) |
| No argument, **established codebase**, no root AGENTS.md | Phase 2 — whole-repo scan (create root **+ judged nested**) |
| Path or area name (e.g. `auth`, `src/payments`) | Phase 3 — area scan |
| No argument, codebase exists, root AGENTS.md **already exists** | Phase 4 — gap-fill (audit codebase vs existing docs, add what's missing) |

The choice is made from **several signals** (source count, git history, manifests), not a file count alone — see Pre-flight. A content-ful legacy `CLAUDE.md` with no `AGENTS.md` is migrated, then treated as Phase 4.

## Acts vs asks

- Phase 1: asks coding-standards questions via MCQ before creating root AGENTS.md.
- Phase 2: acts immediately, no questions — writes root and creates the nested docs it judges warranted.
- Phase 3: acts to explore; asks permission before modifying an existing root AGENTS.md, and before migrating a legacy CLAUDE.md.
- Phase 4: acts to explore the whole codebase; **asks permission before applying additions to the existing root AGENTS.md** (nested-doc creation for undocumented areas it reports first, then applies on confirmation).

## Artifact ownership

| File | Rule |
|---|---|
| Root `AGENTS.md` | The content. Create if missing (Phase 1, 2). Gap-fill with permission if it exists (Phase 3, 4). **Never overwrite.** |
| Root `CLAUDE.md` | Pointer only. Create the forward-to-`AGENTS.md` pointer if missing; migrate its content into `AGENTS.md` (with permission) if it's a legacy content-ful file. |
| `<area>/AGENTS.md` | The content for that area. Create if missing and the area warrants it (Phase 2, 3, 4 — by judgment). Propose additions if it exists; never overwrite. |
| `<area>/CLAUDE.md` | Pointer only, forwarding to `<area>/AGENTS.md`. |

When creating a nested `AGENTS.md`, add exactly one pointer line to root `AGENTS.md` under `## Context files`:
```
- [<area>/AGENTS.md](<area>/AGENTS.md) — <one-line description>
```

Never create a nested AGENTS.md for every subfolder — only where distinct conventions exist.

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows:
- **Commands**: `git` is the only required CLI and behaves the same on every OS. Other shell snippets (file counts, `find`, `[ -f ]`) are POSIX **reference**, not literal scripts — use your agent's own cross-platform file tools (search/glob, read, write) to list and count source files and check existence instead.
- **Bundled files**: the pattern presets (`patterns/*.md`) and `agent-prompt.md` are referenced by paths relative to this skill's folder; the main agent reads them and injects the needed text **into the subagent prompt** — subagents can't resolve skill-relative paths.
- **No subagent / interactive-question support?** The spawn-a-subagent steps assume a subagent capability, and the multiple-choice steps assume an interactive picker (use whatever your agent provides — a subagent capability, per-step model selection, an options picker — and fall back only where it doesn't). On a tool without them: do the subagent's work inline yourself (use a cheaper model where the step calls for one), and ask any multiple-choice question as plain text with the same options.

## Execution

### Pre-flight (main model does this before anything else)

**Don't decide on a file count alone** — a scaffold inflates it, an unfamiliar language zeroes it out. Gather several signals:

1. **Context files.** Using your file tools, check for a root `AGENTS.md` / `CLAUDE.md`: AGENTS.md present → `ROOT_EXISTS`; a content-ful CLAUDE.md only → `ROOT_LEGACY`; neither → `ROOT_MISSING`.

2. **Source count.** Using your file tools, count the project's source files across the common ecosystems (extensions like `.ts/.tsx/.js/.jsx/.py/.go/.rs/.java/.rb/.swift/.kt/.php/.cs/.dart/.ex/.exs/.scala/.c/.cpp/.h/.lua/.clj`), excluding vendored/generated dirs (`node_modules`, `.git`, `dist`, `build`) and config files (`*.config.*`).

3. **Established-project signals.** Run `git log --oneline` to gauge commit-history depth. Using your file tools, check for a real manifest (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `composer.json`, `*.csproj`, `pubspec.yaml`, `mix.exs`, `Gemfile`).

4. **Monorepo signal.** Using your file tools, check for workspace markers (`pnpm-workspace.yaml`, `turbo.json`, or a `"workspaces"` field in `package.json`) and for any `apps/*/package.json` or `packages/*/package.json` near the root.

**Pick the phase. Two questions, in order: (1) is there real code to scan? (source files OR a manifest) (2) if yes, is it built (git history) or just scaffolded (no history)?**

| Condition | Phase |
|---|---|
| Area path given as argument | Phase 3 (area scan) |
| `ROOT_EXISTS` (or `ROOT_LEGACY` after migration) | Phase 4 (gap-fill) |
| `ROOT_MISSING`, **no source files AND no manifest** | Phase 1 (greenfield) — nothing to scan, even if `docs/`/ADR/roadmap commits exist |
| `ROOT_MISSING`, has code (source ≥ 10 **or** a manifest), **≥ 2 commits** | Phase 2 (whole-repo) — real work happened, any language |
| `ROOT_MISSING`, has code (source ≥ 10 **or** a manifest), **≤ 1 commit** | **Phase 0 (ask)** — looks scaffolded; can't tell new from existing |

Why this order (both learned from dry-running it):
- **Doc commits inflate history.** On greenfield, `/roadmap` and `/architect` commit a roadmap and an ADR *before* any code — so "≥2 commits → established" would misroute a code-less project to Phase 2 and skip the standards questions. Gating greenfield on **no source AND no manifest** ignores doc commits.
- **File count alone misreads a scaffold.** A fresh framework scaffold has 10+ files but **one** commit — git history is what separates it from a built codebase, and history works for languages the source scan doesn't recognize. A shallow clone / squash-merge repo showing ≤1 commit falls to Phase 0, where one question resolves it safely.

**Monorepo (`MONOREPO=yes`) — root + a light stub per workspace, deepen on demand.** Each workspace (`apps/*`, `packages/*`) is a first-class area, and its **primary doc lives at the workspace root** (`packages/api/AGENTS.md`), never buried deeper.

- **A whole-repo run (no path arg)** does *not* deep-scan every workspace — on a big monorepo that's too expensive and premature. Instead: write the **repo-root `AGENTS.md`** (monorepo-wide: tooling, shared conventions) **plus a *light stub* `AGENTS.md` for every workspace** — its `## Stack` + `## Commands` read straight from that workspace's manifest (scoped, e.g. `pnpm -F <name> …`), no code scan — and a root `## Context files` pointer to each. This is cheap and gives `/architect`/`/develop` every workspace's stack immediately.
- **Deepen on demand.** The full conventions/gotchas/key-files scan for a workspace happens when the engineer runs **`/audit packages/api`** (Phase 3, area scan) — or the first time they build there — filling out that one workspace's doc. Don't do all of them upfront.
- **Deeper docs are sub-nested and linked.** If a spot *inside* a workspace warrants its own doc (`packages/ui/src/mdx/`), create it **in addition to** the workspace-root doc (`packages/ui/AGENTS.md`) and add a pointer to it from the workspace-root doc — the same root→nested pattern, one level down.
- **Pre-existing deep `CLAUDE.md`/`AGENTS.md`.** If a doc already exists *buried* in a workspace (e.g. `packages/ui/src/mdx/CLAUDE.md`) but the workspace **root has none**, don't just leave it there. **Ask**: "`packages/ui` has a context file at `src/mdx/` but none at its root. Move it up to `packages/ui/AGENTS.md`, or keep it as a nested doc under a new `packages/ui/AGENTS.md`?" On *move* → relocate it to the workspace root. On *keep nested* → create the workspace-root `AGENTS.md` **and** keep the deep one, linking the deep one from the root doc. Migrate legacy `CLAUDE.md` content per the convention above.

Note `MONOREPO=yes` + the workspace list in the subagent prompt.

---

**Legacy migration (any phase):** if detection returned `ROOT_LEGACY` (content-ful root `CLAUDE.md`, no `AGENTS.md`), before proceeding ask permission to migrate: "I found a `CLAUDE.md` with project context but no `AGENTS.md`. I'll move its content into a new `AGENTS.md` (so all tools read it) and replace `CLAUDE.md` with a pointer. Proceed?" On yes: the subagent copies the content verbatim into `AGENTS.md`, then replaces `CLAUDE.md` with the pointer. **After migration, `AGENTS.md` now exists → continue as Phase 4 (gap-fill)** to fill anything the legacy file lacked. On no: leave both untouched and continue without migrating. The same applies to any nested `<area>/CLAUDE.md`.

### Phase 0 — Classify (only when pre-flight is ambiguous)

Don't guess. Ask once — present these as your agent's interactive option picker (`AskUserQuestion` on Claude Code) — or as plain-text options with the same choices if it has none:
- **question**: "I can't tell if this is a new project or an existing codebase — <state why: e.g. 'a manifest exists but I see no source in a language I recognise', or 'files look like untouched scaffolding'>. Which is it?"
- **header**: "Project state"
- **options**:
  1. `New project` — "I'll ask for your coding standards and seed the context." → **Phase 1** (read the manifest/scaffold for the stack; still ask standards).
  2. `Existing codebase` — "I'll scan what's here and document it." → **Phase 2**.

Then route to the chosen phase.

### Phase 1 — Greenfield setup

**Trigger**: pre-flight classified **clearly greenfield**, or Phase 0 → `New project`.

**Step 1 — Ask coding patterns** (main model asks, as above):

Question 1 — Architecture style (single-select):
- Read `patterns/clean-architecture.md` for label/description
- Read `patterns/functional.md`
- Read `patterns/domain-driven.md`
- Read `patterns/solid-oop.md`
- Present all four as options

Question 2 — Additional standards (multi-select):
- `Strict types` — No `any`/untyped code; exhaustive type coverage
- `Test-driven` — Tests written before or alongside implementation
- `Conventional commits` — `feat:`, `fix:`, `chore:` prefix on all commits
- `Documented APIs` — JSDoc/docstrings required on all public interfaces

**Step 2 — Inject selected pattern content**:
- If a named pattern was selected: the main model already read all four files in Step 1 — do not re-read. Use the full content of the matching file as `SELECTED_PATTERNS`.
- If "Other" was selected (free-text input): no pattern files were read in Step 1. Use the engineer's exact typed text as `SELECTED_PATTERNS` — pass it directly, no file to read.

**Step 3 — Spawn a subagent** with:
- `model`: a strong model (e.g. `sonnet`/`opus` on Claude Code)
- `description: "Audit: greenfield setup — create root AGENTS.md + CLAUDE.md pointer"`
- Tools: `Read`, `Bash`, `Write`
- `prompt`: filled `agent-prompt.md` template with `PHASE=greenfield`, `SELECTED_PATTERNS=<file contents>`, `ADDITIONAL_STANDARDS=<selections>`, and **`MONOREPO_OR_NO`** (`yes — apps: web, api, …` if detected). The subagent writes root `AGENTS.md` + its `CLAUDE.md` pointer — seeding `## Build approach` from the roadmap header if one is set (else `<TBD — set by /roadmap>`) — **and, if `MONOREPO=yes`, a nested `AGENTS.md` (+ pointer) per workspace** seeded from each scaffold's manifest, with the root pointers baked in.

---

### Phase 2 — Whole-repo scan (root + judged nested)

**Trigger**: pre-flight classified **clearly established**, or Phase 0 → `Existing codebase`.

The subagent doesn't just write root — it **identifies the major areas with distinct conventions** (e.g. `src/auth`, `src/payments`, `src/api`) and creates a nested `AGENTS.md` for each that warrants one, deciding by judgment what is global (→ root) vs area-specific (→ nested). Root stays short; area detail lives nested.

**Spawn a subagent** with:
- `model`: a strong model
- `description: "Audit: whole-repo scan — root + nested AGENTS.md"`
- Tools: `Read`, `Bash`, `Write`, `Edit` (`Edit` to add nested pointers into the root it just wrote)
- `prompt`: filled `agent-prompt.md` with `PHASE=whole-repo`, AGENTS.md noted as MISSING. The subagent writes root `AGENTS.md`, creates each warranted nested `<area>/AGENTS.md` (+ its `CLAUDE.md` pointer), and adds one pointer line per nested doc into root's `## Context files`.

---

### Phase 3 — Area scan

**Trigger**: a path or area name was given (e.g. `/audit src/auth`).

**Pre-flight additionally**:
1. Using your file tools, check whether the area path exists.
   If it does not exist: stop immediately. Tell the engineer: "Path `<area>` not found. Check the path and try again." Do not spawn a subagent.
2. Read root `AGENTS.md` (the canonical file).
   - If root AGENTS.md is **missing** (and no legacy CLAUDE.md to migrate): run Phase 2 fully first (spawn whole-repo subagent, wait for it to write root AGENTS.md + CLAUDE.md pointer), then continue with Phase 3.
   - If only a legacy root `CLAUDE.md` exists: run the legacy migration above first.
   - If root AGENTS.md **exists**: proceed directly.
3. Check if `<area>/AGENTS.md` exists — note present or missing.

**Spawn a subagent** with:
- `model`: a strong model
- `description: "Audit: area scan — <area>"`
- Tools: `Read`, `Bash`, `Write`, `Edit`
- `prompt`: filled `agent-prompt.md` with `PHASE=area`, `AREA=<path>`, root and nested `AGENTS.md` contents injected. The subagent writes the area's content to `<area>/AGENTS.md` and creates `<area>/CLAUDE.md` as a pointer.

Note: the subagent adds the nested `AGENTS.md` pointer line to root `AGENTS.md` using the **Edit** tool — it does not re-create root AGENTS.md.

**After the subagent runs**, parse the report for the `Root gaps flagged` section:
- If `ROOT_GAPS: none` → relay the full report, done.
- If gaps exist → ask (as above):
  - Question: "I found things in `<area>` not reflected in root AGENTS.md. What should I do?"
  - Option 1: `Add them now` — description: "I'll apply the additions immediately"
  - Option 2: `Show me the diff` — description: "Print exactly what would change; I'll apply it manually"
  - Option 3: `Skip for now` — description: "Leave root AGENTS.md as-is"

  - If `Add them now`: parse the subagent report — locate the `ROOT_GAPS:` block and extract each line starting with `- `. Each line contains the exact markdown to insert and the target section (`— target section: ## <section>`). Apply one **Edit** tool call per gap into root `AGENTS.md`. Do not paraphrase.
  - If `Show me the diff`: print each addition as a fenced markdown block with the target section labelled. Do not write.
  - If `Skip for now`: do nothing.

Relay the full report after the choice is applied.

---

### Phase 4 — Gap-fill (root AGENTS.md already exists)

**Trigger**: no area argument, codebase exists, AND root AGENTS.md **already exists** (including right after a legacy `CLAUDE.md` migration). The project is partially documented — audit the whole codebase against what's written and fill the holes, conservatively.

**Pre-flight additionally**:
1. Read root `AGENTS.md` (inject its contents).
2. Using your file tools, list all nested `AGENTS.md` paths (excluding `node_modules` and `.git`) — inject the list.

**Spawn a subagent** with:
- `model`: a strong model
- `description: "Audit: gap-fill — codebase vs existing docs"`
- Tools: `Read`, `Bash`, `Write`, `Edit`
- `prompt`: filled `agent-prompt.md` with `PHASE=gap-fill`, root AGENTS.md contents + nested paths injected. The subagent scans the codebase and finds three kinds of gap: (a) **global facts missing from root** (a command, stack element, or project-wide rule) → returns as `ROOT_GAPS` proposals; (b) **areas with distinct conventions but no nested doc** → creates the nested doc (+ pointer); (c) **existing nested docs missing something** → returns as `PROPOSED_ADDITIONS`. It never overwrites curated content.

**After the subagent runs**, handle proposals before applying:
- Nested docs it created for clearly-undocumented areas → already written; list them in the relay.
- `ROOT_GAPS` and `PROPOSED_ADDITIONS` to existing files → ask (as above) (`Add them now` / `Show me the diff` / `Skip for now`), exactly as in Phase 3, then apply with `Edit` (verbatim, no paraphrase) on `Add them now`.
- `CONTRADICTIONS` (docs the code disproves) → **surface to the engineer, do not auto-fix** — these touch possibly-curated lines. Relay each as "`<doc>` says *X*, but the code/ADR shows *Y*" and let them decide (correct it, or update the code). Never silently overwrite.

---

### After all phases

**If the subagent errored or wrote no `AGENTS.md`** when it should have (the file is missing/empty), report the failure and offer to re-run — don't relay success it didn't produce. Otherwise relay the subagent's report:
- What was discovered (2–4 bullets)
- What was written (file paths)
- What was proposed or skipped (if existing files were found)

## Pattern presets

See `patterns/` for the four coding style presets used in Phase 1.

## Subagent prompt template

See `agent-prompt.md`.
