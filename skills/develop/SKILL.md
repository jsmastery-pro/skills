---
name: develop
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /develop to build a feature, UI or backend, from an approved design, a page, component, API, service, or data slice. It reads the spec plus AGENTS.md, builds, and advances the scope. Open choices it settles and records in the spec; only a hard to undo decision gets one question."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Talk to the reader as `you`, warm and direct like a colleague, and present every step as a recommendation they may run or skip, never an order. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## How to pick the recommended option

<!-- RECOMMEND:START -->
A recommendation is the best option for this project, not the easiest one to build. Rank options in this order and recommend the first one that passes all of the top three:
1. **Correct**: meets every acceptance criterion and handles the failures that will really happen (bad input, network errors, retries, concurrent writes, partial failure) without losing data.
2. **Secure**: opens no hole in auth, access control, secrets, input validation, or personal data.
3. **Reliable**: proven and maintained, with known failure modes and a way to recover; still sound as the project grows on its current path.
4. **Fits the project**: its stack, its `AGENTS.md` conventions, and the people who will run it.
5. **Simple and fast**: only breaks ties between options that pass 1 to 3.

Never recommend a shortcut that fails 1 to 3 because it is quicker: a workaround, a swallowed error, a disabled check, a hardcoded value, skipped validation, or a library you cannot vouch for. If the easiest option has a known flaw, name the flaw and recommend the sound option, with its extra cost in one line. Not sure an option is sound? Say so plainly instead of recommending it.
<!-- RECOMMEND:END -->

## What this skill does

The builder: turns a spec plus project conventions into working code. Tracks: **UI** (components, pages, layouts; `ui-guide.md`), **Logical** (APIs, services, data layers, business logic, integrations; `logical-guide.md`), or both (e.g. "auth" = sign in pages plus session logic → run both). Step 0 makes sure no decision is invented silently: a hard to undo choice (an auth approach, a payment provider) gets one question; a reversible open choice gets decided, recorded in the spec, and reported.

## Asks vs acts

Builds, then reports. At most one question round per run, in Step 0 before any code: a hard to undo decision, plus the questions only the engineer can answer for this build (track, design source, assets). Never a question once the build has started. Everything else open (local details, reversible choices, a visual direction with no reference) it decides from the spec, `AGENTS.md`, and the codebase, records, and reports under **Decided for you**.

## Artifact ownership

- Writes app code (plus CSS/tokens for UI).
- Scope (`docs/scope/`): only the Step 4 touches (feature status → `in-progress`, milestone sub boxes, `Build it` box, code pointer). Asks to close `done` only at `Prototype` (it is the closing skill there); at `Alpha`/`Beta`/`GA` it never asks, never ticks `Verify it` or `Test it`, and just names the next step. Never creates files in `docs/scope/` (scopes only; analysis/research is `/architect`'s, in the spec's `rationale.md`).
- Never deliberates a decision in depth (that is `/architect`); never restructures root `AGENTS.md` (that's `/audit`); new area conventions go via `/sync` afterwards.
- Spec writes, only these: append `## Build decisions` lines, tick `## Build plan` tasks, add a missing `Reference mockup` line for a mockup validated in `/architect` (`flow/build.md` Step 3), and create an `Assumed` spec when the feature has none (Step 0). Never other spec content, never the `**Status**:` line of an existing spec.
- Artifact base: `docs/` by default, `.workflow/` if `docs/` is a published docs site. Read from whichever exists (paths here assume `docs/`).
- Shared scope: read it again right before ticking, edit only the specific checkbox, status, or pointer line (never rewrite the file); feature not as expected (already `done`, reworked) → flag, don't overwrite.

---

## Portability (any OS, any agent)

Any Agent Skills client, macOS/Linux/Windows. Detection snippets are POSIX reference; use your agent's own cross platform file tools. Builds inline on the main thread (Step 3); the only subagents are a read only `scout` that explores code (Step 2.5) and a read only `researcher` for a doc check (Step 2.6, degrading to building from knowledge without web capability), both on the cheapest model. Bundled guides (`ui-guide.md`, `logical-guide.md`, `checklist.md`) and the build flow after the gate (`flow/build.md`) are paths relative to this skill's folder; the main thread reads them. No interactive question picker → ask the prompts as plain text with the same options.

## Execution

### Before you build: the project must already exist (except the scaffold task)

Exception: if this IS the scaffold sub task of the Stack and architecture foundation feature (prompt says `scaffold`, or the step initializes the project from the stack spec), creating the project IS the job. Read the ARCHITECTURE spec's `## Proposed stack`; run the framework's own project initializer for the stack the spec names; install base dependencies (framework, core runtime, only what the first slice needs); lay out directories; confirm a dev server or build runs. **Keep the repo the initializer creates (never discard it when relocating the project); if it made none and git integration is on, `git init`.** Scaffold steps derive from the stack decision (a decision spec has no build plan). Install just in time: NOT every library the spec names (email, monitoring, and so on); each later feature installs its own when built; only cross cutting tooling (lint, format, type strictness) comes early, via `/audit` + the tooling task. Then proceed.

Otherwise `/develop` builds into an existing project. No skeleton (no `package.json`/`pyproject.toml`/`go.mod`/manifest, no source tree) and not the scaffold task → stop:

> No project found to build into. Run the scaffold step first (the Stack and architecture feature's scaffold sub task, per your architecture spec), then run `/develop` again.

A project exists (even a bare scaffold) → proceed.

### Before you build: freshness & collaboration (don't build on stale state or over a teammate)

Before mutating anything (skip silently if solo, offline, or not using git): `git fetch` quietly; base = `main`, else `master`; behind count (`git rev-list --count HEAD..origin/<base>`); uncommitted work (`git status --short`).

- Behind (count > 0) → stop and warn: "You're N commits behind `origin/$BASE`. A teammate may have already changed or shipped this. Pull first, then run again."
- Uncommitted work in the area you'll touch → warn: "You have uncommitted changes here. Commit or stash first so this build doesn't tangle with them." Let them proceed if they insist.
- Feature `in-progress` in the scope AND its code area (pointer line's path) has recent commits by another author (`git log --format='%an' -- <area>`) → warn: "*<feature>* looks like it's partway through the build by someone else. Coordinate before continuing it." Confirm before proceeding.

Warnings, not hard blocks, but surface them.

**Git integration:** if the nearest `AGENTS.md` `## Git` says `integration: on`, read `flow/git.md` and follow it (branch before building, commit as milestones land); absent or `off` → do no active git.

### Step 0: The spec gate (always first)

Read only what this feature needs, never the whole `docs/` tree: its one scope file and its one governing spec (single file, or umbrella `index.md` plus the one child speccing this sub task). No other features' rows, scope files, workspaces, or unrelated specs.

**Locate, in order:**
1. **This feature's scope file (only that one).** Monorepo → `docs/scope/<workspace>/` for the task's package. Pick the file (`scope.md`, or the matching `<epic>.md` in a split) from the At a glance table alone; read just this feature's section. Tagged `needs a decision` with no spec pointer → a hard to undo open decision (the scope already judged it owed). Malformed → flag and ask, don't guess.
2. **The governing spec via the feature's `spec` pointer**, build spec sections only (`flow/build.md`, Step 2 item 1), plus its `## Build decisions`. No pointer → targeted look in `docs/specs/<workspace>/` for one matching this feature, never a blanket read.
3. The **nearest** `AGENTS.md` (workspace/area): it may already capture a decision synced from an earlier feature.

**Find open decisions with the input coverage test** (mechanical, not introspection; a build model rationalizes a real decision as "just wiring"): enumerate every value this build must produce, compute, or display (from the acceptance criteria and the spec's design). For each, does the spec, `design.md`, or the nearest `AGENTS.md` name its source (an input, a DB column, a derivation, a prior decision)? An unnamed source is an open decision. So is anything you would have to invent: a provider, library, integration, data model, or cross cutting pattern; a whole page's design system, composition, or asset strategy (unless `design.md` and a page spec pin them); a feature's behavior. A **local detail** is ONLY a choice among options the named sources already permit (loop style, a name, which helper): just build it. The moment a choice determines a value's source, or a behavior an acceptance criterion constrains, it is a decision however small it looks.

**False negatives are the failure mode.** Unsure whether a choice is a decision → treat it as one (record it). Unsure whether it is reversible → treat it as hard to undo (ask). Wrongly calling something local or reversible is how a real decision slips through.

**Sort each open decision, then act. One question round per run (below).**
- **Reversible** (the default): a value's source, a business rule or behavior detail, a UI composition or visual direction, a library behind one module; anything a later change can redo without a data migration and that touches no money, auth, or security boundary. Don't stop, don't ask: pick by *How to pick the recommended option* (never the easier but weaker choice), record it (below), build, and list it under **Decided for you** in the report so the engineer can overrule it.
- **Hard to undo**: the auth or session model, a payment or billing provider, the primary datastore, a data model other features will build on, a destructive migration, the source of a value that gets stored (a wrong source means repairing saved data), a security or compliance boundary. Ask once, all of them in one panel (single select; `AskUserQuestion` on Claude Code):
  - **question**: "Building `<feature>` needs a decision that is hard to undo: `<choice>`. I'd pick `<option>` (<one line why>). Go with it?"
  - **header**: "decision"
  - **options**: `Go with your pick (recommended)` → record it, build · `Design it first` → end with `/architect <feature>: <the decision>`, no build. The picker's Other lets the engineer name a different choice → record that, build.

No open decision → no decision question.

**One round for everything open, before any code.** Run the cheap detection that tells which other questions this build needs: the track (`flow/build.md` Step 1), and for a UI track the design source and component or page checks (`ui-guide.md` Steps 0 to 0.5) and the asset check (`ui/implementation.md` *Asset resolution* Steps 1 and 2), detection only. Put every question they leave open in the same round as the hard to undo decision, each exactly as its file defines it (up to 4 per call; a second call only if more remain). Then build without stopping. If something unforeseen turns up mid build, settle it by the rules above: reversible → decide, record, report; hard to undo → stop at a safe point and ask, the one exception.

**Record every decision before building on it** (never only in chat):
- Governing spec exists → append to its `## Build decisions` section (create it at the end if absent), one line each: `- <decision>: <choice> (<why, one clause>) · <decided by: /develop, or the engineer when picked in the Step 0 question> · <date>`.
- No spec → create `$SPEC_DIR/NNNN-<slug>.md` (`docs/specs/`, or `docs/specs/<workspace>/` in a monorepo; next free `NNNN`) and point the feature's scope `spec` line at it:

```markdown
# NNNN · <feature>

**Status**: Assumed
**Date**: <today>

## Requirements
<acceptance criteria seeds from the scope Done when, if any>

## Build decisions
- <decision>: <choice> (<why, one clause>) · <decided by: /develop, or the engineer when picked in the Step 0 question> · <date>

## Code area
<the paths this build touches>
```

`Assumed` means decided during the build, without a design conversation. It is a complete record, not debt: no skill nags about it and it never blocks `done`. `/architect` revisits it only when the engineer asks.

### Build flow (Steps 1-4)

Once the gate clears (nothing open, or every open decision recorded), read `flow/build.md` and follow its Steps 1-4: classify the track, load the decision and conventions, explore, optional doc check, build, then update the scope and report. Do not read `flow/build.md` when the gate ends the run (`Design it first`).

---

## Reference files

- Build flow after the gate (Steps 1-4): `flow/build.md`
- UI build track: `ui-guide.md`
- Logical build track: `logical-guide.md`
- Accessibility checklist (UI track, Phase 5): `checklist.md`
- Project design system (UI track): `./design.md`
