---
name: status
compatibility: Built for Claude Code — reads git and workflow artifacts. Installs on any Agent Skills client.
allowed-tools: Bash, Read, Grep, Glob
description: "Use this skill to orient yourself — where things stand and what's safe to pick up — across a paused session or a team. Run /status when resuming ('where was I?', 'what's left?', 'catch me up'), joining a shared repo ('what's in progress?', 'am I behind?'), or before starting to avoid colliding with a teammate. Reads git state, the feature roadmap, and ADRs; reports what's done, what's in-progress with its resume point, and collaboration hazards (behind the remote, a feature someone else is mid-build on). Read-only."
---

## What this skill does

**Your role:** the lead giving a returning teammate a straight "here's where we are" briefing. You read the durable signals, not vibes, and you report only what you can see — you never touch the work, only orient the person about to. A good briefing frames progress in the team's *own* terms: it tells them not just how many features are done, but where they are along the path the team chose to build.

The "you are here" view. Work spans sessions and teammates, so before picking anything up you need to know: what state is the repo in, what's already in flight, and where it's safe to start. `/status` answers that from the durable artifacts and git — no memory of the last session required.

It reports:
1. **Git state** — branch, uncommitted/staged work, commits ahead/behind the remote, recent commits.
2. **Roadmap progress** — features by status (`planned`/`in-progress`/`done`), sub-task completion, any `⚠ ADR pending`.
3. **Decisions** — ADRs by status (`Proposed`/`In Progress`/`Accepted`/`Superseded`).
4. **Resume points** — each in-progress feature and its first unchecked sub-task ("pick up at *data integration*").
5. **Collaboration hazards** — the things that bite teams and resumed sessions (below).
6. **Recommended next action** — the single most sensible next command.

## Asks vs acts

**Reads and reports only.** Writes nothing, changes nothing, runs no build. Safe to run anytime, including on a dirty tree or mid-task. Asks nothing — it just tells you where you are.

## Artifact ownership

None. Chat output only.

---

## Portability (any OS, any agent)

`git` is the only required CLI. Other reads use your agent's file tools. Runs inline (no subagent). The artifact paths below default to `docs/`, or `.workflow/` if `docs/` is a published docs site — read from whichever exists.

## Execution

### Step 1 — Git state

Using `git` (portable on every OS), gather:
- **Current branch** — `git rev-parse --abbrev-ref HEAD`
- **Uncommitted + staged + untracked** — `git status --short`
- **Base branch** — use `main` if `git rev-parse --verify main` succeeds, otherwise `master`
- **Refresh the remote view** — `git fetch` quietly (skip if offline)
- **Behind / ahead of the remote** — `git rev-list --left-right --count origin/<base>...HEAD`
- **Recent history** — `git log --oneline -8`

Note: behind > 0 → **you're not up to date**; uncommitted entries → **work in progress**; ahead > 0 → **unpushed commits**.

### Step 2 — Roadmap

Scan `docs/roadmap/` (or `.workflow/roadmap/`) for roadmap files — one or more numbered files (`01-roadmap.md`, `02-…`), **including per-workspace subdirs in a monorepo** (`docs/roadmap/<workspace>/`). Parse all of them. **In a monorepo, group the report by workspace** (each app's roadmap reported under its own heading) so apps don't blur together:
- Count features by **Status** across every roadmap file: `planned` / `in-progress` / `done`, plus `existing` (pre-existing, not pipeline-built) and `dropped` (de-scoped — exclude from active work). For each `in-progress` feature, list its checked/total sub-tasks and the **first unchecked** one (the resume point).
- Note any feature flagged `⚠ ADR pending` or `Needs ADR? = yes` with an empty `ADR` cell (a decision owed before building).

Also read the **build approach** from the roadmap header (the slice-shaping strategy the team chose — e.g. a thin end-to-end path, a thinnest-usable-whole core loop, a UI-first shell then wire, or a full user journey per phase). It's read-only context, but it lets you frame progress in the team's own terms: report where things stand *along that path* (which slice / journey / loop is live, which is next), not just a bare done/planned tally. Use the `Phasing` column values the header defines rather than inventing your own labels.

If there's no roadmap, say so — suggest `/roadmap` (greenfield) or `/audit` (brownfield) to establish one. **If a roadmap file is malformed** (no overview table, non-standard status values, broken rows — likely a bad hand-edit), don't silently misreport — flag it: "`<file>` doesn't match the expected roadmap shape; counts may be off — worth a look or a `/roadmap` re-run to repair."

### Step 3 — Decisions

List ADRs from `docs/adr/` (or `.workflow/adr/`) with their **Status** line — an ADR mirrors its feature's build lifecycle: `Proposed` (feature not yet built), `In Progress` (feature being built), `Accepted` (feature built and verified — "done and dusted"), `Superseded` (replaced by a later ADR). Roadmap mapping: feature `planned`→`Proposed`, `in-progress`→`In Progress`, `done`→`Accepted`. See Step 4 for ADR-vs-feature drift.

### Step 4 — Collaboration & session hazards

Surface anything that makes it unsafe to just dive in:
- **Behind the remote** (`behind > 0`) → "Pull first — N commits on `origin/$BASE` you don't have; a teammate may have changed what you're about to touch."
- **Uncommitted work** present → list the areas; "finish or stash before starting something new."
- **In-progress feature overlap** → for each `in-progress` feature, check whether its `Code area` has commits by **other authors** in recent history (`git log --format='%an' -- <area>` shows names other than yours) → "someone else may be mid-build on *<feature>*; coordinate before continuing it."
- **ADR ↔ feature status drift** → a **feature-linked** ADR's status should track its linked feature's status (`planned`→`Proposed`, `in-progress`→`In Progress`, `done`→`Accepted`). Flag any real mismatch, e.g.: feature `done` but ADR still `Proposed`/`In Progress` (ADR should be `Accepted`); ADR `Accepted` but the feature isn't `done`; feature `in-progress` but ADR still `Proposed`. Report each with the one-command fix — usually **`/sync`** to reconcile. Be conservative: only flag when the two genuinely disagree. **A standalone decision ADR** — a foundational/stack or cross-cutting standard that no roadmap feature links to — is *decision-status* (`Proposed` when written, `Accepted` once ratified), not feature-mirrored: report it normally under Decisions and do **not** flag it as drift for having no linked feature.
- **Dropped-feature ADR** → a feature-linked ADR whose linked feature is now `dropped` (de-scoped) governs abandoned work. Flag it: "ADR `<NNNN>` governs a dropped feature — supersede or remove?" with the one-command pointer (**`/architect`** to supersede, or remove the link). Be conservative — only flag when the ADR is clearly linked to a row now marked `dropped`.
- **Detached HEAD / non-feature branch** → note it.

### Step 4b — Drift (plan vs reality)

People go off-plan — they redo UI, add a feature the roadmap doesn't mention, or write an ADR for something not tracked. `/status` is where that surfaces. Cross-check the roadmap against the code and ADRs:
- **Unplanned code** → significant code areas/modules (use `AGENTS.md` nested areas + top-level dirs) that **no roadmap feature's `Code area` points to**. That's shipped work the plan doesn't know about.
- **Orphan ADRs** → top-level ADR files in `docs/adr/` that **no roadmap feature's `ADR` cell links to**. (Child ADRs *inside* an umbrella directory are covered by the umbrella's link — not orphans.) Decisions made outside the plan.
- **Stale `done`** (light touch) → a feature marked `done`/`existing` whose code area has substantial recent churn — its "done" may no longer match reality. Only flag if obvious; don't over-reach.

Report these and the one-command fix: **`/roadmap`** to enroll unplanned work / re-run to reconcile drift, **`/architect`** (or a `/roadmap` row) to link an orphan ADR. Be conservative — only flag a real mismatch, not every file without a row.

### Step 5 — Report

```
## Status

**Branch**: <name>  ·  <ahead> ahead / <behind> behind `origin/<base>`
**Working tree**: clean | <N> files changed (<areas>)

**Roadmap** (`<base path>/roadmap/`):
- Build approach: <the header's slice-shaping strategy> · currently on <which slice / journey / phase>   (omit if the header names none)
- done: <n>  ·  in-progress: <n>  ·  planned: <n>  ·  existing: <n> (pre-workflow)  ·  dropped: <n>
- In progress:
  - <feature> — <c>/<t> sub-tasks · resume at **<first unchecked>**

**Decisions**: <n> Accepted · <n> In Progress · <n> Proposed · <n> Superseded
- ⚠ <NNNN> <ADR status> but <feature> is <feature status> → `/sync` to reconcile
- ⚠ <NNNN> governs a dropped feature — supersede or remove? → `/architect` (or remove the link)

**Drift** (plan ≠ reality):
- Unplanned code: <area> — shipped, no roadmap feature → run `/roadmap` to enroll
- Orphan ADR: <NNNN> — not linked to any feature → `/roadmap` row or `/architect`
- (or "none — plan matches reality")

**Heads-up**:
- <collaboration/session hazard, or "none">

**Suggested next**: <the single most sensible command — e.g. "pull, then `/develop <feature>` to resume at data integration">
```

Omit any section with nothing to say. If the tree is clean, you're up to date, and nothing is in progress, say so in one line and point at the next `planned` feature. `/status` only reports — it never starts the work for you.
