---
name: scope
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /scope to turn a product idea into a living, coarse scope in docs/scope/ and keep it current: plan a new product, plan the next slice, enroll one named feature, or run with no argument to reconcile after shipping and queue what is next. Seeds WHAT to build; /architect designs, /develop builds."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

Turns an idea into an ordered, coarse, living plan and keeps it honest as the product ships. Answers "what do I build, in what order, how heavy, which need a decision first?", not "how do I build this one thing?" (that is `/architect` and `/develop`).

Scope shape, coarse and small: a slim At a glance table (`# · Feature · Phase · Status`) + feature sections grouped by phase (see `scope-template.md`). Each section: heading `### N. Name` with short tags only when they matter (`needs a decision`, an approach override, a workflow tier override like `· Full`), a 1 to 2 line intent, one `Done when:` line (acceptance criteria seeds, the WHAT), checkbox steps.

Feature shape lifecycle: not yet designed → one box, its entry command. On spec capture, `/architect` fills the built ready shape: `Design it (spec)` ticked, spec linked, `Build it: /develop <feature>` with 2 to 5 milestone sub items rolled up from the spec's `## Build plan`, then `Verify it: /check verify <feature>` and `Test it: /test <feature>`. Atomic build tasks stay in the spec's `## Build plan`, never here; every box is a command or tracked milestone. Status: in the table and beside the heading; spec and code pointers once they exist. `/scope` seeds the what; `/architect` designs the how and defines milestones; `/develop` builds; `/check verify` and `/test` close; `/sync` reconciles conventions after.

One command, inferred intent (`/scope [what]`, never a subcommand):
- **plan** (default): no scope yet + a product sized idea, or asking for the next slice. Full pass: ask → decompose into coarse feature sections → order + phase → write.
- **replan**: scope exists + no argument. Opens with a short where things stand readout (git branch and ahead/behind the remote, feature counts by status, and each in-progress feature's resume point) so a bare `/scope` doubles as the "where was I, what is safe to pick up" orientation, then reconciles what shipped, surfaces plan vs reality drift (code or specs with no scope row), enrolls needs surfaced during the build, reorders, and queues the next slice. The normal living rhythm, not rare: run bare `/scope` again.
- **add**: scope exists + argument names a single feature. Enroll one coarse row (intent + order + tier + Needs spec) without planning again: `/scope <a feature>`.

## Asks vs acts

Senior product engineer, thorough across all dimensions. Same infer / ask / recommend discipline as `/architect`: INFER what the idea states (category, obvious capabilities); ASK what cannot be inferred across business, product, go to market in batched rounds (up to 4 questions per round; see Decision panels); RECOMMEND build approach, build order, the workflow tier (project default and any per feature override), which need a spec (expert calls: present them, let the engineer override).

Never pick tools: no provider, library, ORM, host, or BaaS chosen or named; that is `/architect`'s job per feature in the spec. A feature implying a tool choice is exactly `Needs spec: yes`. Keep the scope tool agnostic so it doesn't rot.

## Decision panels (every user facing choice)

Every choice is an options panel, never a neutral menu: 2 to 4 concrete options real to this product; exactly one marked `(recommended)` with a one line why (make the call, let them override). Never add your own Other option, the picker appends a free text Other automatically; offer free text yourself only in a plain text fallback with no picker. Capability first: use the agent's picker (`AskUserQuestion` on Claude Code), else the same options as plain text; batched rounds same rule, up to 4 per round.

## Artifact ownership

`docs/scope/` is the feature scope, owned by this skill; `/architect` owns `docs/specs/`. Other skills find a feature by scanning `docs/scope/` for its row. Living document: `plan`, `replan`, `add` all edit in place (reconcile and append, never a new dated file). Writes nothing else: no specs, code, or `AGENTS.md`. `docs/scope/` holds scope files only; inventories, analyses, research docs live with the spec in its `rationale.md` (owned by `/architect`).

File shape:
- Small product: one file, `docs/scope/scope.md` (At a glance table + phase grouped sections + legend).
- Large product: epic split: `docs/scope/index.md` (At a glance table across epics + one line status rollup per epic, each linking its epic file) + one file per epic named by area (`docs/scope/auth.md`, …).
- Promote on demand: start single file; when `scope.md` outgrows a comfortable scan (roughly a dozen plus features across clearly distinct areas), rename to `index.md` (keep table + per epic rollup), move each area's sections into its own `<epic>.md`. Never split it early. Names semantic (`scope.md` / `index.md` / `<epic>.md`), never numbered.
- Keep every file coarse and small; a long epic file needs finer features and tighter intent, not a build task dump.

Status lifecycle (`/scope` sets initial status; the pipeline advances it):
- New features start `planned`. Brownfield: also enroll features that are already there as `existing` (complete) or `in-progress` (partial), the only other statuses `/scope` writes.
- `/develop` advances pipeline built work (`planned` → `in-progress` → `done`); `/sync` reconciles against the diff. A feature built on an **assumed decision** (its governing spec is `Assumed`, recorded by `/develop` when the engineer chose to build before deciding) stays `in-progress` with an `assumed decision (spec NNNN)` note until `/architect` ratifies the decision; it cannot reach `done` before then.
- `done` ≠ `existing`: `done` = this pipeline built and verified it; `existing` predates the workflow; `/develop` and `/sync` never touch `existing` rows.
- `replan` may set a feature dropped from scope to `dropped`, never deletes rows; `dropped` keeps history, excluded from active counts and work; `/develop` and `/sync` skip it.

Workflow tier (one rigor dial per feature, `Vibe` · `Lean` · `Medium` · `Full`): how much process a feature warrants, replacing the older separate "weight". It is a recommendation the engineer overrides, never a forced track. There is ONE project default (recommended once, plan Step 5b, recorded on the scope header `**Workflow:**` line) and a per feature override (a tag beside the heading, e.g. `· Full`, only when a feature differs from the default; no tag = inherit). What the tier drives:
- **Design time**: higher tier → more likely `Needs spec: yes`, and the spec's cross model decision critic runs (auto at `Full`/`Medium`). `Vibe`/`Lean` features are often `Needs spec: no`.
- **After `/develop`** (the verification tail): `Vibe` = nothing (rely on `/develop`'s own build time self check); `Lean` = `/check verify`; `Medium` = `/check verify` + `/test`; `Full` = adds a fresh model `/check review` + `/document`.
- **What closes `done`** (the last required stage marks it): `Vibe` → `/develop` (build + self check); `Lean` → `/check verify`; `Medium`/`Full` → `/test`. An `Assumed` spec still blocks `done` at every tier.

`/scope` recommends the project default from the risk and size of the feature mix (Step 5b), the same signals `/architect` and `/develop` read; `/develop` reads the effective tier (feature override, else project default, else inferred) to scale the next steps it recommends, so a `Vibe` project is not told to run verify and a `Lean` project is not told to run a full review chain. Not a global playbook a feature is slotted into: it is a per project, per feature judgment.

Artifact base: `docs/` by default; if `docs/` is a published docs site (`docusaurus.config.*`, `.vitepress/`, `mkdocs.yml`, Astro Starlight, or Nextra detected), use `.workflow/` (`.workflow/scope/…`). Always follow whichever base already exists (paths here assume `docs/`).

Concurrency: shared across sessions and teammates. Read again immediately before writing; surgical edits only (append rows in order, reconcile changed cells, never rewrite the file); flag rather than clobber unexpected state; append with the next free numbers so adders don't collide.

## Reference files

- `scope-template.md`: format rules, At a glance table, per feature sections (heading + intent + Done when + checkbox tasks + pointer line), brownfield enrollment and epic split shapes, the `## /scope complete` report block. Read it when writing the scope and the report.

## Portability (any OS, any agent)

Any Agent Skills client on macOS, Linux, Windows. Detection snippets are POSIX reference; use your agent's cross platform file tools. Planning runs inline; the two subagents below (Step 1 brownfield code scan, Step 6b sourcing) are optional and capability first, degrade to inline. No interactive picker: ask every panel as plain text, same options.

## Execution

### Step 0: Infer intent & idea check

No subcommand. First check whether a scope exists under `docs/scope/` (or `.workflow/scope/` if that is the artifact base), then infer:
- Scope exists + no argument (or running again, described as "reconcile / what's next") → replan behavior (`modes/replan.md`).
- Scope exists + argument names a single feature → add behavior (`modes/add.md`).
- No scope yet + a product sized idea, or scoping the next slice (including brownfield) → plan behavior, below.

Ambiguous (a new slice vs a single feature): infer the most likely reading from scope, say which behavior you chose in the report; truly unclear → one line clarifying question.

Plan behavior, no idea given (no argument, no scope to extend): stop and ask before anything else:

"What are you building? Describe the product or the slice of it you want to plan (one or two sentences about what it does and who it's for)."

Wait for the answer; use it as the product idea.

### Step 1: Load the inferred behavior

After Step 0 infers the behavior, read exactly one mode file and follow it:

- `modes/plan.md` for plan behavior (new scope, product sized idea, or next slice planning).
- `modes/replan.md` for replan behavior (scope exists and no argument).
- `modes/add.md` for add behavior (scope exists and the argument names one feature).

Do not read the other mode files unless the inferred behavior changes. All common rules above still apply, and `scope-template.md` remains the format reference for any write/report.

## Reference

- `scope-template.md`: see Reference files above.
