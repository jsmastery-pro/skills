---
name: develop
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /develop to build a feature, UI or backend, from an approved design, a page, component, API, service, or data slice. If something load bearing is undecided and no spec records it, it stops and routes you to /architect; otherwise it reads the spec plus AGENTS.md, builds, and advances the scope."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

The builder: turns a spec plus project conventions into working code. Tracks: **UI** (components, pages, layouts; `ui-guide.md`), **Logical** (APIs, services, data layers, business logic, integrations; `logical-guide.md`), or both (e.g. "auth" = sign in pages plus session logic → run both). Step 0 gates on the spec so load bearing choices (an auth approach, a payment provider) are decided in `/architect`, not silently invented partway through the build.

## Asks vs acts

Gates, then acts: no upfront question rounds like `/architect`. Read the decision, build, ask only what the design left open (the visual direction when no reference was given; a business rule the spec didn't settle). Infer from the spec, `AGENTS.md`, and codebase; ask only what can't be inferred; recommend local implementation choices.

## Artifact ownership

- Writes app code (plus CSS/tokens for UI).
- Scope (`docs/scope/`): only the Step 4 touches (feature status → `in-progress`, milestone sub boxes, `Build it` box, code pointer). Marks a feature `done` only at the `Vibe` workflow tier (build plus its own self check; the engineer opted out of separate verification), and even then never while an `Assumed` spec is unratified; at `Lean`/`Medium`/`Full` it leaves the feature `in-progress` for `/check verify` and `/test` to close, and never ticks `Verify it` or `Test it`. Never creates files in `docs/scope/` (scopes only; analysis/research is `/architect`'s, in the spec's `rationale.md`).
- Never writes spec content or deliberates a decision (flags the need, defers to `/architect`); never restructures root `AGENTS.md` (that's `/audit`); new area conventions go via `/sync` afterwards. **One narrow exception:** on `Build now, record it as an assumed spec` (Step 0), `/develop` may *create* a spec, but only in `Status: Assumed`, and only the assumption record fields (owed decision, assumption built on, authorized by, code area, requirements seeds). It never writes rationale and never advances an `Assumed` spec past that state; `/architect` owns clearing it. This is the only spec `/develop` creates.
- One spec touch on an existing spec: the `**Status**:` line (umbrella decision → the `index.md`'s, never a child's), plus filling the feature's spec pointer line. Build start: `Proposed` → `In Progress`; build lands (feature → `done`): `In Progress` → `Accepted` (a spec is not `Accepted` until its feature ships). Never edit spec content, only that line, surgically: read it again right before writing; unexpected state (already `Accepted`, `Superseded`) → flag, don't clobber. **Never move a spec out of `Assumed`** (that is ratification, `/architect`'s job): an `Assumed` spec stays `Assumed` through the build even while the feature is `in-progress`, so it can never reach `Accepted` until `/architect` ratifies it. This is what blocks `done`.
- Artifact base: `docs/` by default, `.workflow/` if `docs/` is a published docs site. Read from whichever exists (paths here assume `docs/`).
- Shared scope: read it again right before ticking, edit only the specific checkbox, status, or pointer line (never rewrite the file); feature not as expected (already `done`, reworked) → flag, don't overwrite. The freshness check guards against rebuilding what a teammate shipped.

---

## Portability (any OS, any agent)

Any Agent Skills client, macOS/Linux/Windows. Detection snippets are POSIX reference; use your agent's own cross platform file tools. Builds inline on the main thread (Step 3); the only subagents are a read only `scout` that explores code (Step 2.5) and a read only `researcher` for a doc check (Step 2.6, degrading to building from knowledge without web capability), both on the cheapest model. Bundled guides (`ui-guide.md`, `logical-guide.md`, `checklist.md`) and the build flow after the gate (`flow/build.md`) are paths relative to this skill's folder; the main thread reads them. No interactive question picker → ask the prompts as plain text with the same options.

## Execution

### Before you build: the project must already exist (except the scaffold task)

Exception: if this IS the scaffold sub task of the Stack and architecture foundation feature (prompt says `scaffold`, or the step initializes the project from the stack spec), creating the project IS the job. Read the ARCHITECTURE spec's `## Proposed stack`; run the framework's own init (`create-next-app`, `cargo new`, etc. per that stack); install base dependencies (framework, core runtime, only what the first slice needs); lay out directories; confirm a dev server or build runs. Scaffold steps derive from the stack decision (a decision spec has no build plan). Install just in time: NOT every library the spec names (email, monitoring, and so on); each later feature installs its own when built; only cross cutting tooling (lint, format, type strictness) comes early, via `/audit` + the tooling task. Then proceed.

Otherwise `/develop` builds into an existing project. No skeleton (no `package.json`/`pyproject.toml`/`go.mod`/manifest, no source tree) and not the scaffold task → stop:

> No project found to build into. Run the scaffold step first (the Stack and architecture feature's scaffold sub task, per your architecture spec), then run `/develop` again.

A project exists (even a bare scaffold) → proceed.

### Before you build: freshness & collaboration (don't build on stale state or over a teammate)

Before mutating anything (skip silently if solo, offline, or not using git): `git fetch` quietly; base = `main`, else `master`; behind count (`git rev-list --count HEAD..origin/<base>`); uncommitted work (`git status --short`).

- Behind (count > 0) → stop and warn: "You're N commits behind `origin/$BASE`. A teammate may have already changed or shipped this. Pull first, then run again."
- Uncommitted work in the area you'll touch → warn: "You have uncommitted changes here. Commit or stash first so this build doesn't tangle with them." Let them proceed if they insist.
- Feature `in-progress` in the scope AND its code area (pointer line's path) has recent commits by another author (`git log --format='%an' -- <area>`) → warn: "*<feature>* looks like it's partway through the build by someone else. Coordinate before continuing it." Confirm before proceeding.

Warnings, not hard blocks, but surface them.

### Step 0: The spec gate (always first)

Is a decision owed and unrecorded? Do NOT judge this by introspection ("do I feel like I'm inventing something?"), the build model rationalizes a real decision as "just wiring" and waves it through (spec 0002). Use a positive **input coverage** test, which is mechanical and harder to talk yourself out of:

> **Enumerate every value this build must produce, compute, or display (from the acceptance criteria and the spec's design). For each, does the spec name where it comes from (an input, a DB column, a derivation from a named value, a prior decision)? Any required value with no named source is an owed decision.**

If any source is unnamed, stop and route to the gate (`/architect`, or record an `Assumed` spec; `/develop` implements decisions, it doesn't make them). A decision is also owed when you'd have to invent:

- **A provider, library, integration, data model, or cross cutting pattern** (e.g. auth provider, DB/ORM, caching strategy).
- **A whole UI page or screen**: its design system (`design.md` there? if not, which direction?), sections/composition, component inventory, asset strategy (no screenshot, no repo images → e.g. an online source). Owed unless a `design.md` AND a page level spec pin these down.
- **A feature's behavior** (search, a wizard: "what exactly should it do?" is open; `/architect` asks those questions). Owed unless a spec defines it.

**What "local implementation detail" actually means (the narrow exception):** ONLY a choice among options the spec's named sources already permit, a loop style, a variable name, which helper to call. The moment a choice **determines a value's source, or a behavior an acceptance criterion constrains**, it is load bearing by definition, however small it looks. Deriving "the user's today from the timezone on their last read row" is not a local detail: it picks the source of a value an AC constrains, so it is owed. NOT owed for genuine pure implementation: a small bug fix, a component matching an existing `design.md`, wiring pieces whose sources the spec already names, a copy tweak, anything an existing spec/`design.md`/`AGENTS.md` fully governs.

Don't hardcode to page names or to any one example (timezone is an illustration of the pattern, not a rule); apply the input coverage test to whatever was asked. False negatives are the failure mode, building a real decision without noticing: when a required value's source is unnamed, or you are unsure, treat as owed and ask (panel below).

Read only what this feature needs, never the whole `docs/` tree: its one scope file and its one governing spec (single file, or umbrella `index.md` plus the one child speccing this sub task). No other features' rows, scope files, workspaces, or unrelated specs.

**Check, in order:**
1. **Locate this feature's scope file (only that one).** Monorepo → `docs/scope/<workspace>/` for the task's package. Pick the file (`scope.md`, or the matching `<epic>.md` in a split) from the At a glance table alone; read just this feature's section. `needs a decision` with no spec pointer yet → decision owed and missing. Malformed → flag and ask, don't guess.
2. **Open the governing spec via the feature's `spec` pointer**, reading only its build spec sections as defined in the build flow (`flow/build.md`), Step 2 item 1. Found → it's the spec; proceed. No pointer and no linked spec → targeted look in `docs/specs/<workspace>/` for one matching this feature's scope, never a blanket read.
3. The **nearest** `AGENTS.md` (workspace/area) may already capture the decision, synced from an earlier feature (e.g. "the auth provider is already chosen") → proceed without a new spec.

Decision owed and unrecorded → don't guess, don't silently stop. Ask (single select; `AskUserQuestion` on Claude Code):

- **question**: "This looks like it needs an architecture decision first: `<name the specific load-bearing choice, e.g. 'which auth provider + session model'>`. How do you want to handle it?"
- **header**: "spec first?"
- **options**:
  1. `Architect it first`: "Recommended. Capture the decision in a spec before building, so the build has a spec." → **end here** with the handoff below. Do not build.
  2. `No, not needed`: "I've judged there's no real decision here; build directly." → proceed to the build flow (`flow/build.md`).
  3. `Build now, record it as an assumed spec`: "Build it, but write the assumption down first so the decision lives in the repo, not just this chat. The feature can't be marked `done` until `/architect` ratifies it." → write an `Assumed` spec (below), then proceed to the build flow (`flow/build.md`), leaving the feature `in-progress` with an `assumed decision (spec NNNN)` note in the scope (`docs/scope/`).

The tool appends "Other" as a free text option automatically.

On `Build now, record it as an assumed spec`, write a minimal `Assumed` spec **before** building (this is the one narrow spec write `/develop` owns; see Artifact ownership). Resolve `$SPEC_DIR` the way `/architect` does (single repo → `docs/specs/`; monorepo workspace → `docs/specs/<workspace>/`), take the next free `NNNN`, and write `$SPEC_DIR/NNNN-<slug>.md`:

```markdown
# NNNN · <feature>

**Status**: Assumed
**Date**: <today>
**Authorized by**: <engineer>, during /develop

## Owed decision
<the specific load bearing choice that was not made>

## Assumption built on
<the concrete assumption this build will use>

## Code area
<the paths this build will touch>

## Requirements
<acceptance criteria seeds carried from the scope Done when, if any>

## Ratify
This decision was recorded by /develop, not deliberated. Run `/architect <feature>`
to deliberate and ratify it. The feature cannot be marked `done` until then.
```

Point the feature's scope `spec` line at this file. The assumption is now durable: it survives `/clear`, teammates read it, and a later `/develop` builds against it instead of guessing again. You still cannot mark the feature `done` (see the done gate in `flow/build.md`, Step 4).

On `Architect it first`, end with:

> Run this next, then come back to `/develop`:
> ```
> /architect <feature>: <the specific decision to settle>
> ```
> Once the spec exists, run `/develop <task>` again and I'll build to it.

No decision owed (pure implementation) → skip the question, proceed.

### Build flow (Steps 1-4)

Once the gate clears (no decision owed, or the engineer chose `No, not needed` / `Build now, record it as an assumed spec`), read `flow/build.md` and follow its Steps 1-4: classify the track, load the decision and conventions, explore, optional doc check, build, then update the scope and report. Do not read `flow/build.md` when the gate ends the run (`Architect it first`, no build).

---

## Reference files

- Build flow after the gate (Steps 1-4): `flow/build.md`
- UI build track: `ui-guide.md`
- Logical build track: `logical-guide.md`
- Accessibility checklist (UI track, Phase 5): `checklist.md`
- Project design system (UI track): `./design.md`
