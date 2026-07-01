---
name: develop
compatibility: Built for Claude Code — uses interactive questions and stack detection. Installs on any Agent Skills client but is tuned for Claude Code.
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Task, AskUserQuestion
description: "Use this skill to build a feature — UI or logical/backend — from an approved design. Run /develop to implement a page, component, API, service, data layer, or any slice. It first gates on the decision: if building would require inventing something undecided (a design system, page composition, a provider, data model, or a feature's behavior) and no ADR records it, /develop stops and routes you to /architect. Otherwise it reads the ADR + AGENTS.md (+ design.md for UI) and builds, advancing the roadmap. It doesn't make architecture decisions or write ADRs (/architect)."
---

## What this skill does

The builder. It implements a feature that has already been *decided* — turning an ADR + project conventions into working code, for **both UI and logical work**. Two tracks behind one front door:

- **UI track** — components, pages, layouts: semantic HTML, design tokens, accessibility. Detailed in `ui-guide.md`.
- **Logical track** — APIs, services, data layers, business logic, integrations. Detailed in `logical-guide.md`.

A single task can use both (e.g. "auth" = sign-in pages *and* session logic) — run both tracks.

Because building is where decisions get silently made, `/develop` **gates on the ADR first** (Step 0). That's what stops you from quietly inventing an auth approach or a payment provider mid-build instead of deciding it in `/architect`.

## Asks vs acts

**Gates, then acts.** It does not run two rounds of upfront questions like `/architect`. It reads the decision, then builds — asking only what the design genuinely left open (a UI template when no screenshot was given; an ambiguous business rule the ADR didn't settle). Same **infer / ask / recommend** discipline: infer from the ADR + `AGENTS.md` + codebase, ask only the un-inferable, recommend local implementation choices.

## Artifact ownership

Writes **app code** (and CSS/tokens for UI). Its **only** touch on `docs/mvp/` is advancing the feature's row — `planned` → `in-progress` on start, `done` when the build lands — and filling its `Code area` (and `ADR`) pointers. It **never creates files in `docs/mvp/`** (no inventories, analyses, or notes — that folder is roadmaps only; analysis/research is `/architect`'s, under `docs/adr/…/research/`). Never writes ADRs (flags the need and defers to `/architect`); never restructures root `AGENTS.md` (that's `/audit`); records new area conventions only via `/sync` afterwards.

**Artifact base.** The roadmap and ADRs it reads live under `docs/` by default, or `.workflow/` if `docs/` is a published docs site. **Read from whichever base — `docs/` or `.workflow/` — exists in the repo** (paths here assume `docs/`).

**Concurrency & collaboration.** The roadmap is shared. **Re-read it right before ticking a sub-task** (a teammate or `/sync` may have updated it), edit only the specific checkbox/cell/row (never rewrite the file), and if the row isn't as you expected — e.g. someone already marked it `done`, or the feature was reworked — **flag it rather than overwrite**. Before building, a quick `git fetch` + behind-check is worth it: if you're behind the remote, surface it so you don't rebuild what a teammate just shipped (this is what `/status` reports).

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows. Detection snippets are POSIX **reference** — use your agent's own cross-platform file tools to find files, read `package.json`/config, and read the ADR and `AGENTS.md`. This skill runs inline (no subagent) and writes app code, which is inherently cross-platform. Bundled guides (`ui-guide.md`, `logical-guide.md`, `checklist.md`, `templates/`) are referenced by paths relative to this skill's folder; the main agent reads them. If your tool has no interactive-question picker, ask the prompts as plain text with the same options.

## Execution

### Pre-check — the project must already exist

`/develop` builds *into* a scaffolded project; it does not scaffold one. If there's no project skeleton at all (no `package.json`/`pyproject.toml`/`go.mod`/manifest, no source tree), **stop** and tell the engineer:

> No project found to build into. Scaffold it first — `create-next-app`, `npm init`, `vite`, `cargo new`, etc. (per your architecture ADR) — then re-run `/develop`.

If a project exists (even a bare scaffold), proceed.

### Pre-check — freshness & collaboration (don't build on stale state or over a teammate)

Before mutating anything, a quick safety pass (skip silently if it's a solo, offline, or non-git context):

```bash
git fetch --quiet 2>/dev/null
git rev-parse --verify main >/dev/null 2>&1 && BASE=main || BASE=master
git rev-list --count HEAD..origin/$BASE 2>/dev/null   # commits you're BEHIND
git status --short                                     # uncommitted work
```

- **Behind the remote** (count > 0) → **stop and warn**: "You're N commits behind `origin/$BASE` — a teammate may have already changed or shipped this. Pull first, then re-run." Don't build on stale code.
- **Uncommitted work in the area you're about to touch** → warn: "You have uncommitted changes here — commit or stash first so this build doesn't tangle with them." Let them proceed if they insist.
- **Feature already `in-progress` by someone else** → if the roadmap marks this feature `in-progress` AND its `Code area` has **recent commits by another author** (`git log --format='%an' -- <area> | head` shows names other than yours), warn: "*<feature>* looks like it's mid-build by someone else — coordinate before continuing it." Confirm before proceeding.

These are warnings, not hard blocks (the engineer may have a reason) — but surface them; silent stale/duplicate builds are the worst team foot-gun.

### Step 0 — The ADR gate (always first)

Decide whether a **decision is owed and unrecorded**. The test is one question:

> **To build this, would you have to *invent* something the engineer hasn't decided?**

If yes, a decision is owed — stop and route to `/architect`, because the ADR it writes *is the build spec* (`/develop` should implement a decision, not make one). Things you'd have to invent:

- **A provider, library, integration, data model, or cross-cutting pattern** — the classic backend decisions (auth provider, DB/ORM, storage, email, caching strategy).
- **What a whole UI page or screen contains and looks like** — building a page (home, shop, product, order history, dashboard, …) means deciding its **design system** (does a `design.md` exist? if not, which direction?), its **sections/composition** (what's on the page and in what order), its **component inventory**, and the **asset strategy** (what to use when the engineer gave no screenshot and the repo has no images — e.g. fall back to an online source). Those are design decisions. Owed **unless** a `design.md` *and* a page-level spec/ADR already pin them down.
- **A feature's behavior** — search, filtering, recommendations, a wizard, anything where "what exactly should it do?" is open. `/architect` is where those questions get asked (which fields does search cover? which filters? sort? fuzzy?). Owed unless an ADR already specs the behavior.

It is **not** owed for pure implementation that's already specified: a small bug fix, a single component that matches an existing `design.md`, wiring already-decided pieces together, a copy/content tweak, or anything an existing ADR/`design.md`/`AGENTS.md` already governs.

Do **not** hardcode this to a list of page names or features — apply the *invent-test* to whatever you were asked to build. A "home page", a "shop page", and a "search filter" all fail the test on a fresh project (no design system, no behavior spec) and pass it once an ADR/`design.md` exists.

**The dangerous case is the false negative — building a real decision without noticing it** (which is exactly what "just build the home page" looks like). So when you can't tell, treat it as **owed** and ask (the panel below). One extra question is cheap; a page or feature whose design/behavior you silently invented is expensive to unwind.

**Read only what *this* feature needs — not the whole `docs/` tree.** `/develop` touches exactly: the **one** roadmap file that holds this feature, and the **one** governing ADR it points to. Do **not** read other features' rows, other roadmap files/workspaces, or unrelated ADRs — that's wasted context and can mislead the build with decisions that aren't yours.

**Check, in order:**
1. **Locate this feature's roadmap file (only that one).** In a monorepo, go straight to the workspace's subdir for the task's package (`docs/mvp/<workspace>/`) — don't open other workspaces. To find the right file among numbered ones, glance at overview tables only; then read the **breakdown of just the file that contains this feature**. Find its row: if `Needs ADR? = yes` and the `ADR` cell is empty → **a decision is owed and missing.** (Malformed roadmap/row → flag and ask, don't guess.)
2. **Open the governing ADR via the row's `ADR` pointer — read only that file** (plus its umbrella `index.md` if it's a nested child). It's the spec; proceed. Only if the row has **no** pointer *and* no ADR is linked, do a **targeted** look for one matching this feature's scope in its `docs/adr/<workspace>/` — never a blanket read of every ADR.
3. Check whether the decision is already captured in the **nearest** `AGENTS.md` (the workspace/area one — synced from an earlier feature, e.g. "auth uses Clerk"). If so, proceed without a new ADR.

**If a decision is owed and nothing records it — do not guess, and do not silently stop. Ask the engineer** via `AskUserQuestion` (single-select):

- **question**: "This looks like it needs an architecture decision first — `<name the specific load-bearing choice, e.g. 'which auth provider + session model'>`. How do you want to handle it?"
- **header**: "ADR first?"
- **options**:
  1. `Architect it first` — "Recommended — capture the decision in an ADR before building, so the build has a spec." → **end here** and output the paste-ready handoff (below). Do not build.
  2. `No — not needed` — "I've judged there's no real decision here; build directly." → proceed to Step 1.
  3. `Skip for now` — "Build it without an ADR; I'll backfill the decision later." → proceed to Step 1, and leave the feature's `Needs ADR?` = `yes` with a `⚠ ADR pending` note in the roadmap (`docs/mvp/`) so it isn't forgotten.

The tool appends "Other" as a free-text option automatically.

**On `Architect it first`**, end the skill with this handoff for the engineer to paste:

> Run this next, then come back to `/develop`:
> ```
> /architect <feature> — <the specific decision to settle>
> ```
> Once the ADR exists, re-run `/develop <task>` and I'll build to it.

**If no decision is owed** (pure implementation), skip the question and proceed.

### Step 1 — Classify the track

| Signals | Track |
|---|---|
| "page", "component", "screen", "layout", "ui"; a screenshot is attached; visual work against `design.md` | **UI** → `ui-guide.md` |
| "api", "endpoint", "service", "functionality", "logic", "data", "job", "webhook", "integration" | **Logical** → `logical-guide.md` |
| Both present (e.g. "auth": pages + session logic) | **Both** — run each track for its part |

If genuinely ambiguous, ask once: "Is this the UI, the logic behind it, or both?"

### Step 2 — Load the decision and conventions (both tracks)

Before building, read:
1. **The governing ADR — read only this one** (from the roadmap row's `ADR` pointer, or the one found in Step 0; plus its umbrella `index.md` if it's a nested child). Not the whole `docs/adr/` tree — just the spec for *this* feature: data model, API surface, invariants, security model, the provider/library already chosen. **Check its `Status`:** if it's still **`Proposed`** (not `Accepted`), the decision isn't ratified — warn before building: "The governing ADR is still `Proposed`, not accepted — build on an un-agreed decision, or accept it first (re-run `/architect` and confirm)?" Build only on the engineer's go-ahead. A `Superseded` ADR → use the one that superseded it.
2. **The nearest `AGENTS.md`** to the target code area (proximity — Claude Code auto-loads it; read it explicitly to be sure). This carries decisions synced from earlier features, so you **don't re-ask** what's already settled.
3. **`design.md`** (UI track only) — the visual source of truth.

**Monorepo — work inside the target workspace.** If this is a monorepo (workspaces config, or `apps/*`/`packages/*` manifests), identify which workspace the feature belongs to (its `Code area` in the roadmap, or the task path) and **operate there**: read *that workspace's* nested `AGENTS.md` and `design.md`, use its `package.json`/stack, write into its tree, and run **its** commands (the workspace's `dev`/`build`/`test`, e.g. `pnpm --filter <workspace> …` or `turbo run … --filter`). The scaffold and freshness pre-checks apply to that workspace. Its roadmap is at `docs/mvp/<workspace>/`.

**Precedence when they conflict:** the **ADR wins for the feature it governs** — it's the specific, ratified decision; `AGENTS.md` is the general project convention. So if `AGENTS.md` says "tests use Jest" but this feature's ADR says "Vitest for this," follow the ADR *for this feature* — and **flag the conflict** ("ADR <NNNN> diverges from `AGENTS.md` on X — `/sync` should reconcile") rather than silently picking one. (If the ADR is silent on a point, `AGENTS.md` governs.)

This step is why `/develop auth functionality` doesn't re-ask the stack chosen during `/develop auth pages`: `/architect` decided it, `/sync` wrote it into `AGENTS.md`, and you read it here.

**Spec-completeness check (before building, not mid-build).** Confirm the ADR actually contains what you need to build *this* task — for logical work: data model, API surface, security model, key invariants; for UI work: the screens and their states/requirements. If a load-bearing section you need is **missing or left as a placeholder**, do not guess your way through it. Ask via `AskUserQuestion`:
- **question**: "The ADR for this is missing `<section>` — I need it to build correctly. How do you want to proceed?"
- **header**: "ADR gap"
- **options**: `Update the ADR first` (recommended — end with a paste-ready `/architect <feature> — fill in <section>` handoff) · `Tell me the answer now` (engineer supplies it inline; proceed, and note it should be backfilled into the ADR) · `Use your best judgment` (proceed on a stated assumption, surfaced in the report for review).

A thin ADR caught here is a 30-second question; caught mid-build it's a wrong guess baked into code.

### Step 3 — Resume check, then build

**Resume first — never rebuild what's already done.** Use the **same file you located in Step 0** (the one roadmap file with this feature — the workspace's, in a monorepo); don't re-open others. If its status is **`existing`** (already shipped) or **`dropped`** (de-scoped), it isn't active — don't auto-build; tell the engineer it's marked `<status>` and confirm they want to revive/modify it (that's a new task, possibly needing an ADR). Otherwise read its build breakdown and find the first **unchecked** `[ ]` sub-task. Everything `[x]` above it is already built (possibly in an earlier session) — do not redo it. Tell the engineer where you're picking up: "This feature is 4/10 done — resuming at *data integration*." Then set the feature's **Status** to `in-progress`. (No roadmap → just build the requested task.)

**Gather any remaining inline answers** (the Step 2 spec-gap answer, the UI asset/template questions, an ambiguous business rule) — these need the engineer, so collect them *before* handing off to a build run.

**Build inline by default — subagents only when they earn it.** Inline (on the main thread) is the default for most builds: it stays interactive (you can ask mid-build), it's simpler, and it avoids the token cost of inlining a guide+ADR into a subagent brief. Escalate to a subagent only for:
- **A very large *single* build** (many files / long) that would bloat a long session's main context → isolate it in **one subagent** (you've already gathered the answers, so it won't need to ask).
- **A big multi-file *rollout* of an already-decided pattern** (e.g. "apply the shared SQL builders to 6 routers", "swap inline inputs across 17 files") → **fan out** (below). This is the case where subagents clearly pay — one giant context holding 17 files is the slow, 10k-token path; small parallel ones are faster and cheaper.

Everything else — a normal feature slice, a page, an endpoint — **build inline**. Don't reach for a subagent by default.

Then build the track(s):

- **UI track** → follow `ui-guide.md` **inline** (interactive/visual: component-or-screen → stack/styling/dark-mode detection → asset resolution → tokens → font → the five phases → accessibility). Keep it on the main thread so design/asset questions stay responsive.

- **Logical track — normal build** → build **inline**, following `logical-guide.md` (ground in the ADR → data layer → core logic → interface → integration → correctness pass). Interactive and simplest.
- **Logical track — very large single build** → *optionally* isolate it in **one subagent** (`model: "sonnet"`, tools `Read, Bash, Write, Edit, Grep, Glob`) to keep the main context lean. **Give it a *slim* brief** — the `logical-guide.md` text, the **relevant sections** of the ADR (not the whole doc if it's an umbrella), the **nearest** `AGENTS.md`, the collected answers, and the exact sub-tasks. Inlining every doc in full is a top token sink; inline only what *this* build needs.

- **Logical track — big rollout** → do it in two stages:
  1. **Primitive first, serially** — one subagent builds the shared thing the rollout depends on (the helper/module/schema) and confirms it typechecks.
  2. **Fan out the rollout** — `parallel` subagents, **one per file or small router-group**, each with a *tiny* brief: "apply `<primitive>` (signature: …) to `<file>` per the pattern in ADR `<link>`; preserve exact behavior." Each carries only its own file + the primitive's API — **not** the full guide, not the other files. This is what makes a 17-file change cheap and fast instead of one bloated context.
  3. **Gate once at the end** — run the package-wide typecheck/lint and `/verify` after the fan-out, not per subagent.

- **Both** → logical first (so the UI has a real interface to bind to), then UI.

**Follow the ADR's verify protocol.** If the ADR specifies how to verify (common on projects with **no test runner** — e.g. "`pnpm -F <pkg> typecheck` must pass after every sub-task", or "diff API responses before/after"), **run exactly that** after each sub-task/batch, and don't mark a sub-task done until it passes. Don't assume a test suite exists — do what the ADR says.

### Step 4 — Update the roadmap and report

- **Only mark what actually landed.** Before ticking anything, confirm the work is really there — files written, build subagent returned success (not an error or empty result), code present. If the build **failed or came back partial** (subagent errored, was interrupted, or left a sub-task half-done): leave that sub-task **unchecked**, keep the feature **`in-progress`**, and report exactly what's incomplete and why. Never mark a sub-task `done` on an unverified or failed build — a roadmap that claims work that isn't there is worse than one that's behind.
- In the roadmap (`docs/mvp/`): tick the build sub-task(s) you **verified** complete (`[ ]` → `[x]`), fill in the feature's `Code area` (and `ADR`) pointers, and set its **Status** to `done` only when every sub-task is checked — otherwise leave it `in-progress`.
- Relay the track's report (the `## /develop complete` block from `ui-guide.md` and/or `logical-guide.md`).
- Recommend the next step per tier: usually `/test`, then `/sync` to promote any new area conventions into `AGENTS.md`.

`/develop` builds; it does not run `/test`, `/sync`, or `/architect` for you — it points; you decide.

---

## Reference files

- UI build track: `ui-guide.md`
- Logical build track: `logical-guide.md`
- Accessibility checklist (UI track, Phase 5): `checklist.md`
- Design templates (UI track): `templates/`
- Project design system (UI track): `./design.md`
