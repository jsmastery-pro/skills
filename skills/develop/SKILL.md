---
name: develop
compatibility: Built for Claude Code — uses interactive questions and stack detection. Installs on any Agent Skills client but is tuned for Claude Code.
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Task, AskUserQuestion, WebSearch, WebFetch
description: "Use this skill to build a feature — UI or logical/backend — from an approved design. Run /develop to implement a page, component, API, service, data layer, or any slice. It first gates on the decision: if building would require inventing something undecided (a design system, page composition, a provider, data model, or a feature's behavior) and no ADR records it, /develop stops and routes you to /architect. Otherwise it reads the ADR + AGENTS.md (+ design.md for UI) and builds, advancing the roadmap. It doesn't make architecture decisions or write ADRs (/architect)."
---

## Output style (plain words, no dashes)

Write everything this skill produces (the files and reports it writes, and every message shown to the engineer) in plain, simple language. Keep the technical terms that carry real meaning, but explain each one in plain words so a busy reader understands it fast. Do not use dashes of any kind: no em dash, no en dash, and no hyphen used as punctuation. Use short sentences, commas, or parentheses instead. Clear beats clever.

## What this skill does

The builder. It implements a feature that has already been *decided* — turning an ADR + project conventions into working code, for **both UI and logical work**. Two tracks behind one front door:

- **UI track** — components, pages, layouts: semantic HTML, design tokens, accessibility. Detailed in `ui-guide.md`.
- **Logical track** — APIs, services, data layers, business logic, integrations. Detailed in `logical-guide.md`.

A single task can use both (e.g. "auth" = sign-in pages *and* session logic) — run both tracks.

Because building is where decisions get silently made, `/develop` **gates on the ADR first** (Step 0). That's what stops you from quietly inventing an auth approach or a payment provider mid-build instead of deciding it in `/architect`.

## Asks vs acts

**Gates, then acts.** It does not run two rounds of upfront questions like `/architect`. It reads the decision, then builds — asking only what the design genuinely left open (a UI template when no screenshot was given; an ambiguous business rule the ADR didn't settle). Same **infer / ask / recommend** discipline: infer from the ADR + `AGENTS.md` + codebase, ask only the un-inferable, recommend local implementation choices.

## Artifact ownership

Writes **app code** (and CSS/tokens for UI). Its **only** touch on `docs/roadmap/` is advancing the feature's **status** to `in-progress` (in the At-a-glance table and beside its heading), ticking its **milestone sub-boxes** and the `Build it` box, and filling its **code pointer**. It does **not** mark a feature `done` (that waits for `/verify` and `/test`) and does **not** tick `Verify it` or `Test it`. It **never creates files in `docs/roadmap/`** (no inventories, analyses, or notes — that folder is roadmaps only; analysis/research is `/architect`'s, under `docs/adr/…/research/`). Never writes ADRs (flags the need and defers to `/architect`); never restructures root `AGENTS.md` (that's `/audit`); records new area conventions only via `/sync` afterwards.

**One ADR touch — the Status line, to mirror the feature.** Beyond filling the feature's **ADR pointer** (on its pointer line), `/develop`'s *only* edit to an ADR is advancing its `**Status**:` line (for an umbrella decision, the `index.md`'s — never a child's) so the ADR's status mirrors its feature's build lifecycle: when it **starts** building a feature that has a governing ADR, `Proposed` → `In Progress`; when the **build lands** (feature → `done`), `In Progress` → `Accepted` (built and verified — "done and dusted"; an ADR is not `Accepted` until its feature ships). It **never edits ADR content** — only that one Status line, surgically. Re-read the line right before writing it, and if it's not in the expected state (e.g. already `Accepted`, or `Superseded`) **flag it rather than clobber**.

**Artifact base.** The roadmap and ADRs it reads live under `docs/` by default, or `.workflow/` if `docs/` is a published docs site. **Read from whichever base — `docs/` or `.workflow/` — exists in the repo** (paths here assume `docs/`).

**Concurrency & collaboration.** The roadmap is shared. **Re-read it right before ticking a task** (a teammate or `/sync` may have updated it), edit only the specific checkbox, status, or pointer line (never rewrite the file), and if the feature isn't as you expected — e.g. someone already marked it `done`, or it was reworked — **flag it rather than overwrite**. Before building, a quick `git fetch` + behind-check is worth it: if you're behind the remote, surface it so you don't rebuild what a teammate just shipped (this is what `/status` reports).

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows. Detection snippets are POSIX **reference** — use your agent's own cross-platform file tools to find files, read `package.json`/config, and read the ADR and `AGENTS.md`. This skill builds inline by default; a very large single build or a multi-file rollout may fan out to subagents (Step 3, via your agent's subagent tool), and a current-usage doc-check may use a read-only web subagent (Step 2.6), degrading to build-from-knowledge where the agent has no web capability. It writes app code, which is inherently cross-platform. Bundled guides (`ui-guide.md`, `logical-guide.md`, `checklist.md`, `templates/`) are referenced by paths relative to this skill's folder; the main agent reads them. If your tool has no interactive-question picker, ask the prompts as plain text with the same options.

## Execution

### Pre-check — the project must already exist (except the scaffold task)

**Exception, the scaffold task.** If this task **is** the scaffold sub-task of the Stack and architecture foundation feature (the prompt says `scaffold`, or the step is to initialize the project from the stack ADR), then **creating the project IS the job** — do not refuse. Read the ARCHITECTURE ADR's `## Proposed stack`, run the framework's own init (`create-next-app`, `npm init`, `vite`, `cargo new`, and so on, per that stack), install the **base** dependencies (framework, core runtime, and only what the first slice actually needs), lay out the directories, and confirm a dev server or build runs. The scaffold steps are **derived here from the stack decision**, not read from a pre-written ADR build plan (a decision ADR has none). **Install just-in-time, not everything up front:** do NOT install every library the ADR names (email, monitoring, billing, chat, analytics) at scaffold time — each later feature installs its **own** dependencies when it is built. Only genuinely cross-cutting tooling (lint, format, type strictness) comes early, via `/audit` + the tooling task. Then proceed.

Otherwise, `/develop` builds *into* an already-scaffolded project; it does not scaffold one. If there's no project skeleton at all (no `package.json`/`pyproject.toml`/`go.mod`/manifest, no source tree) **and this is not the scaffold task**, **stop** and tell the engineer:

> No project found to build into. Run the scaffold step first (the Stack and architecture feature's scaffold sub-task, per your architecture ADR), then run `/develop` again.

If a project exists (even a bare scaffold), proceed.

### Pre-check — freshness & collaboration (don't build on stale state or over a teammate)

Before mutating anything, a quick safety pass (skip silently if it's a solo, offline, or non-git context):

- `git fetch` quietly to update remote refs.
- Determine the base branch with `git` (`main` if it exists, else `master`).
- With `git`, count the commits you're BEHIND the remote base (`git rev-list --count HEAD..origin/<base>`).
- With `git`, check for uncommitted work (`git status --short`).

- **Behind the remote** (count > 0) → **stop and warn**: "You're N commits behind `origin/$BASE`. A teammate may have already changed or shipped this. Pull first, then run again." Don't build on stale code.
- **Uncommitted work in the area you're about to touch** → warn: "You have uncommitted changes here. Commit or stash first so this build doesn't tangle with them." Let them proceed if they insist.
- **Feature already `in-progress` by someone else** → if the roadmap marks this feature `in-progress` AND its code area (its pointer line's path) has **recent commits by another author** (use `git log --format='%an' -- <area>` and check whether the recent author names include anyone other than you), warn: "*<feature>* looks like it's mid-build by someone else. Coordinate before continuing it." Confirm before proceeding.

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

**Read only what *this* feature needs — not the whole `docs/` tree.** `/develop` touches exactly: the **one** roadmap file that holds this feature, and the **one** governing ADR it points to (a single file, or an umbrella `index.md` + the one child that specs this sub-task). Do **not** read other features' rows, other roadmap files/workspaces, or unrelated ADRs — that's wasted context and can mislead the build with decisions that aren't yours.

**Check, in order:**
1. **Locate this feature's roadmap file (only that one).** In a monorepo, go straight to the workspace's subdir for the task's package (`docs/roadmap/<workspace>/`) — don't open other workspaces. To find the right file among them (`roadmap.md`, or the matching `<epic>.md` in a split), glance at the **At-a-glance table** only; then read **just this feature's section** in the file that contains it. If it `needs a decision` and has **no ADR pointer yet** (no pointer line, or the line has no ADR) → **a decision is owed and missing.** (Malformed roadmap / feature → flag and ask, don't guess.)
2. **Open the governing ADR via the feature's `ADR` pointer (its pointer line) — read only its build-spec sections for this sub-task.** For token efficiency, read only the build spec — **`## Requirements`** (the user stories + IDed acceptance criteria `AC-1…` — the contract this build must satisfy), **`## Decision`**, the design/spec section (`## Feature design` / `## Proposed stack` / spec table), **`## Build plan`** (the ordered tasks, each tagged "— satisfies AC-N", migration as task 1), and **`## Consequences`** (constraints) — and **skip `## Context`, `## Options considered`, and `## Rationale`** (human decision-history, not build input) unless a specific constraint needs the reasoning. A single ADR file → read those sections. An umbrella `index.md` → read the index (decision + child list), then open **the child ADR(s) this sub-task touches** (usually one; a second only if it genuinely spans two) — again just their build-spec sections. It's the spec; proceed. Only if the feature has **no** pointer *and* no ADR is linked, do a **targeted** look for one matching this feature's scope in its `docs/adr/<workspace>/` — never a blanket read of every ADR.
3. Check whether the decision is already captured in the **nearest** `AGENTS.md` (the workspace/area one — synced from an earlier feature, e.g. "the auth provider is already chosen"). If so, proceed without a new ADR.

**If a decision is owed and nothing records it — do not guess, and do not silently stop. Ask the engineer** — present these as your agent's interactive option picker (`AskUserQuestion` on Claude Code) — or as plain-text options with the same choices if it has none (single-select):

- **question**: "This looks like it needs an architecture decision first: `<name the specific load-bearing choice, e.g. 'which auth provider + session model'>`. How do you want to handle it?"
- **header**: "ADR first?"
- **options**:
  1. `Architect it first` — "Recommended. Capture the decision in an ADR before building, so the build has a spec." → **end here** and output the paste-ready handoff (below). Do not build.
  2. `No, not needed` — "I've judged there's no real decision here; build directly." → proceed to Step 1.
  3. `Skip for now` — "Build it without an ADR; I'll backfill the decision later." → proceed to Step 1, and leave the feature's `Needs ADR?` = `yes` with a `⚠ ADR pending` note in the roadmap (`docs/roadmap/`) so it isn't forgotten.

The tool appends "Other" as a free-text option automatically.

**On `Architect it first`**, end the skill with this handoff for the engineer to paste:

> Run this next, then come back to `/develop`:
> ```
> /architect <feature>: <the specific decision to settle>
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
1. **The governing ADR — read only its build-spec sections for *this* sub-task** (from the feature's `ADR` pointer line, or the one found in Step 0). **Read only the build spec, not the whole ADR (token-efficiency rule):** the sections `/develop` needs are **`## Requirements`** (the user stories + IDed acceptance criteria `AC-1…` — the contract the build must meet, and the source of the verify steps you emit at the end), **`## Decision`**, the **design/spec section** (`## Feature design` / `## Proposed stack` / the equivalent spec table), **`## Build plan`** (the ordered tasks, each tagged "— satisfies AC-N", migration as task 1), and **`## Consequences`** (constraints). **Skip `## Context`, `## Options considered`, and `## Rationale`** — that's the human decision-record (the WHY), not build input; go back to it only if a specific constraint genuinely needs the reasoning. **Single ADR file** → read those sections. **Umbrella `index.md`** (a directory decision) → read the `index.md` for the overall decision + its child list, then open **the child ADR(s) whose scope this sub-task touches** and build from their detailed spec — again its build-spec sections, not its reasoning (usually one child; read a second only if the sub-task genuinely spans two — never all). The index's `## Structure` maps every file, and the `index.md` holds any **cross-child contract** (how the pieces connect). The child ADR is self-sufficient to build from — open a child's `## References` research **only if you need the underlying evidence** (optional depth, not required reading). Not the whole `docs/adr/` tree, and not the reasoning prose — just the spec for *this* work: data model, API surface, invariants, security model, the provider/library already chosen. **Check the `Status`** — on the single file, or on the umbrella `index.md` for a directory decision (child ADRs carry no lifecycle status): if it's still **`Proposed`** (not `Accepted`), the decision isn't ratified — warn before building: "The governing ADR is still `Proposed`, not accepted. Build on an un-agreed decision, or accept it first (re-run `/architect` and confirm)?" Build only on the engineer's go-ahead. A `Superseded` ADR → use the one that superseded it.
2. **The nearest `AGENTS.md`** to the target code area (proximity — Claude Code auto-loads it; read it explicitly to be sure). This carries decisions synced from earlier features, so you **don't re-ask** what's already settled.
3. **`design.md`** (UI track only) — the visual source of truth.
4. **This feature's build approach** — how the feature is sequenced into working software, read with precedence: **this feature's roadmap-row `Approach` override if the feature's row declares one, else the project default** — recorded in the **root `AGENTS.md`**, or failing that the **roadmap file's header**. This mirrors the ADR-overrides-`AGENTS.md` precedence: a feature that declares its own approach (e.g. a Facade prototype in an otherwise Skateboard project) is built by ITS approach, while every other feature uses the project default. It names the strategy to build by — a vertical end-to-end slice, the thinnest usable whole, a UI-shell-first prototype wired later, or a full user journey per phase — and it governs *how you assemble* this slice in Step 3, **not** *what* it contains (the ADR fixes that). **If neither the feature nor the project records an approach, default to a coherent end-to-end slice** — the feature working through every layer it spans. Read the recorded strategy and, in your role as a senior build engineer, reason from its principle; don't run it through a fixed per-approach recipe.
5. **The relevant tool skills — read and apply their conventions as you build.** The ADR's `## Decision` **Implementation skills** field names the community/tool skills that shaped this feature (an ORM, an auth library, a payments provider, and so on), and `AGENTS.md` records what the project has installed. For each one that **materially governs the code you are about to write**, open its `SKILL.md` (its path is real and readable) and follow its conventions — this is the whole point of the skill being installed: the *build* should match the tool's right way, not a generic guess. Read **on demand** — only the skills this sub-task touches, only when they shape it, not all of them (a project with several installed skills would otherwise dump thousands of tokens). On Claude Code an installed skill may auto-activate from its description; read it explicitly anyway to be sure. If a skill can't be read (not installed, or the agent has no file access), build from the ADR plus your knowledge and note it.

**Monorepo — work inside the target workspace.** If this is a monorepo (workspaces config, or `apps/*`/`packages/*` manifests), identify which workspace the feature belongs to (its code pointer in the roadmap, or the task path) and **operate there**: read *that workspace's* nested `AGENTS.md` and `design.md`, use its `package.json`/stack, write into its tree, and run **its** commands (the workspace's `dev`/`build`/`test`, e.g. `pnpm --filter <workspace> …` or `turbo run … --filter`). The scaffold and freshness pre-checks apply to that workspace. Its roadmap is at `docs/roadmap/<workspace>/`.

**Precedence when they conflict:** the **ADR wins for the feature it governs** — it's the specific, ratified decision; `AGENTS.md` is the general project convention. So if `AGENTS.md` says "tests use Jest" but this feature's ADR says "Vitest for this," follow the ADR *for this feature* — and **flag the conflict** ("ADR <NNNN> diverges from `AGENTS.md` on X — `/sync` should reconcile") rather than silently picking one. (If the ADR is silent on a point, `AGENTS.md` governs.)

This step is why `/develop auth functionality` doesn't re-ask the stack chosen during `/develop auth pages`: `/architect` decided it, `/sync` wrote it into `AGENTS.md`, and you read it here.

**Spec-completeness check (before building, not mid-build).** Confirm the ADR actually contains what you need to build *this* task — for logical work: data model, API surface, security model, key invariants; for UI work: the screens and their states/requirements. If a load-bearing section you need is **missing or left as a placeholder**, do not guess your way through it. Ask (as above):
- **question**: "The ADR for this is missing `<section>`. I need it to build correctly. How do you want to proceed?"
- **header**: "ADR gap"
- **options**: `Update the ADR first` (recommended: end with a paste-ready `/architect <feature>: fill in <section>` handoff) · `Tell me the answer now` (engineer supplies it inline; proceed, and note it should be backfilled into the ADR) · `Use your best judgment` (proceed on a stated assumption, surfaced in the report for review).

A thin ADR caught here is a 30-second question; caught mid-build it's a wrong guess baked into code.

### Step 2.5 — Explore before building (isolate the reading — the top monorepo win)

Knowing *where* to build — which files to touch, which existing patterns and interfaces to match and reuse — means reading code. On a large or monorepo codebase that reading is the **biggest context cost**: done inline, every file you open stays in the main context for the rest of the session, which is what makes a build slow and token-heavy. Per Anthropic's context-engineering guidance, **isolate the exploration in a read-only subagent** — it reads dozens of files in its own context and returns a compact map (~1–2k tokens); the raw reading never lands in your main thread.

- **Skip it** for a tiny, well-localized change where you already know the single file.
- **Run it** for anything touching an unfamiliar area, several files, or a large/monorepo repo — exactly where inline reading balloons.

Spawn a **read-only exploration subagent** (use your agent's exploration capability — Claude Code / Cursor `Explore`, Antigravity `research`, Codex `spawn_agent`; else a plain subagent, or do it inline if your agent has none):
- **a fast, low-cost model** (e.g. `haiku`/`sonnet` on Claude Code) — exploration is search-heavy, not deep reasoning; don't spend a strong model on it.
- **read-only tools**: `Read`, `Grep`, `Glob` — no `Edit`/`Write`.
- **brief**: the target workspace, the exact sub-task, and the ADR's key interfaces. Tell it to return **only a compact map** — the files to create/edit (paths), the patterns/conventions to match (`file:line`), the symbols/types/helpers to reuse, and any gotchas — **not** file contents or dumps.

Build from that map. The rule: **offload the token-heavy *reading*; keep the *deciding and writing* on the main thread** (Step 3).

**Rules of thumb (large repos & monorepos):** scope to **one workspace, one roadmap file, one governing ADR** (already the rule above). Do **one sub-task per run** and `/clear` between features so context doesn't accumulate across a long session. **Match the model to the work** — exploration and mechanical rollouts on a fast/cheap model, deep logic and orchestration on a strong one.

### Step 2.6 — Doc-check (only when needed): offload current-usage lookups to a web subagent

Sometimes a build needs the **current setup or API of a library the ADR already chose** — a fast-moving or newly-released dependency where your training may be stale (e.g. the correct current way to wire an auth library with an ORM adapter, or a framework's latest routing/config shape). This is a real, legitimate build-time need, and in practice the model **reaches for a web search on its own** when it hits it. Done inline that is a token sink: a "22 sites" search dumps all that raw reading straight into your main build context. **Isolate it the same way as the exploration in Step 2.5** — in a subagent — so only the answer lands on the main thread.

**When to do it (gate hard — this is the exception, not the default):**
- **Only** when you genuinely need the **current usage/setup/API of a tool the ADR already decided**, and you are unsure your knowledge is current. Most builds don't need it: for a stable, well-known stack, build from knowledge and let the **typecheck/build/lint loop** catch a stale API cheaply. Don't web-search by default.
- **Never to choose or reconsider a tool.** Tool selection is `/architect`'s job. This looks up *how to use* the decided tool, not *whether* to use it. If the docs reveal the chosen tool genuinely can't work, that is the "spec is wrong" path (below) back to `/architect`, not a silent swap.

**How (capability-first):** spawn a **read-only web subagent** (web tools — `WebSearch`/`WebFetch` on Claude Code; your agent's web capability elsewhere; on Cursor/Codex/Antigravity use their web/browse tool), on a **fast, low-cost model**. Brief it with the exact tools and versions from the ADR and the one thing you need to know. Tell it to return **only a compact usage summary** — the correct current call/config/setup steps, version notes, and gotchas — **not** raw pages or a list of sites. Build from that summary. **If the agent has no web capability**, skip this: build from your knowledge and lean on the build/typecheck loop to surface a stale-API mistake, and note the assumption.

The rule is the same as Step 2.5: **offload the token-heavy reading (web or code); keep the deciding and writing on the main thread.**

### Step 3 — Resume check, then build

**Task source — the ADR's `## Build plan` is the atomic checklist; the roadmap shows a milestone rollup.** For a feature with a governing ADR, build from the ADR's **`## Build plan`** (the atomic, AC-tagged tasks, migration first) — that is the real checklist, and **tick progress there** as you build so a resumed run picks up correctly. The roadmap feature carries only the **milestone rollup** under its `Build it: /develop <feature>` box (2 to 5 sub-items): **tick each milestone when the ADR tasks it rolls up are done**, and tick the `Build it` box itself when all its milestones are done. **Leave `Verify it` and `Test it` unticked — those are `/verify`'s and `/test`'s to tick.** A feature with no ADR has its task(s) as the roadmap checkboxes directly.

**Build the coherent slice the approach calls for — don't silently skip surface.** Assemble the feature, in your role as a senior build engineer, to fit the feature's build approach (read in Step 2 — the feature's row override, else the project default): the ADR specs a **coherent slice**, not a loose bag of tasks — e.g. a tracer-bullet slice wired end-to-end through every layer it spans, or a Facade's UI shell on placeholder data now with the logical layer wired after. Reason from the approach's principle rather than a fixed recipe. **Default, when no approach is recorded, to the feature working end-to-end** (data → logic → interface → UI, whatever the slice spans). Before building, cross-check the task list against the ADR's **`## Requirements` (acceptance criteria `AC-1…`)** and its API/UI surface: if the ADR requires something the task list **doesn't cover** — the classic "missed the verify-email page" miss — **flag it and add the task** rather than shipping a partial slice that leaves an `AC-N` unmet. The acceptance criteria are the contract; every one must be satisfied by a task you build (or explicitly deferred with the engineer's agreement).

**Resume first — never rebuild what's already done.** Use the **same file you located in Step 0** (the one roadmap file with this feature — the workspace's, in a monorepo); don't re-open others. If its status is **`existing`** (already shipped) or **`dropped`** (de-scoped), it isn't active — don't auto-build; tell the engineer it's marked `<status>` and confirm they want to revive/modify it (that's a new task, possibly needing an ADR). Otherwise scan the ADR's `## Build plan` (the atomic checklist; or the roadmap checkboxes for a no-ADR feature) and find the first **unchecked** `[ ]` task. Everything `[x]` above it is already built (possibly in an earlier session) — do not redo it. Tell the engineer where you're picking up: "This feature is 4/10 done, resuming at *data integration*." Then set the feature's **status** to `in-progress` (update the At-a-glance table and the heading), and **mirror it onto the governing ADR**: if this feature has a governing ADR (its `ADR` pointer), advance its `**Status**:` line `Proposed` → `In Progress` — a one-line surgical edit (re-read the line first; if it's not `Proposed` — already `In Progress`, `Accepted`, or `Superseded` — flag it, don't clobber; never touch ADR content). (No roadmap → just build the requested task.)

**Gather any remaining inline answers** (the Step 2 spec-gap answer, the UI asset/template questions, an ambiguous business rule) — these need the engineer, so collect them *before* handing off to a build run.

**With the exploration map from Step 2.5 in hand, the build is a *write* step — build inline by default, subagents only when they earn it.** Inline (on the main thread) is the default for most builds: it stays interactive (you can ask mid-build), it's simpler, and it avoids the token cost of inlining a guide+ADR into a subagent brief. Escalate to a subagent only for:
- **A very large *single* build** (many files / long) that would bloat a long session's main context → isolate it in **one subagent** (you've already gathered the answers, so it won't need to ask).
- **A big multi-file *rollout* of an already-decided pattern** (e.g. "apply the shared SQL builders to 6 routers", "swap inline inputs across 17 files") → **fan out** (below). This is the case where subagents clearly pay — one giant context holding 17 files is the slow, 10k-token path; small parallel ones are faster and cheaper.

Everything else — a normal feature slice, a page, an endpoint — **build inline**. Don't reach for a subagent by default.

Then build the track(s):

- **UI track** → follow `ui-guide.md` **inline** (interactive/visual: component-or-screen → stack/styling/dark-mode detection → asset resolution → tokens → font → the five phases → accessibility). Keep it on the main thread so design/asset questions stay responsive.

- **Logical track — normal build** → build **inline**, following `logical-guide.md` (ground in the ADR → data layer → core logic → interface → integration → correctness pass). Interactive and simplest.
- **Logical track — very large single build** → *optionally* isolate it in **one subagent** (tools `Read, Bash, Write, Edit, Grep, Glob`) to keep the main context lean. **Pick the subagent's model by the reasoning depth of the work, not its size** — a large but *mechanical* build (rote wiring of already-decided pieces, a repetitive rollout, a page whose composition is fixed) runs fine on a fast/cheap model; reserve a strong model for genuinely **novel or hard logic** (a subtle state machine, a concurrency-sensitive invariant). Size drives whether to *isolate* it (context cost); difficulty drives *which model*. **Give it a *slim* brief** — the `logical-guide.md` text, the **child ADR for this sub-task** plus the umbrella `index.md`'s decision (not every child) — or the relevant sections of a single-file ADR, the **nearest** `AGENTS.md`, the collected answers, and the exact sub-tasks. Inlining every doc in full is a top token sink; inline only what *this* build needs.

- **Logical track — big rollout** → do it in two stages:
  1. **Primitive first, serially** — one subagent builds the shared thing the rollout depends on (the helper/module/schema) and confirms it typechecks.
  2. **Fan out the rollout** — `parallel` subagents, **one per file or small router-group**, each with a *tiny* brief: "apply `<primitive>` (signature: …) to `<file>` per the pattern in ADR `<link>`; preserve exact behavior." Each carries only its own file + the primitive's API — **not** the full guide, not the other files. This is what makes a 17-file change cheap and fast instead of one bloated context.
  3. **Gate once at the end** — run the package-wide typecheck/lint and `/verify` after the fan-out, not per subagent. **Clean up only on a green sweep** — the "remove superseded code" step (below) runs **only after ALL rollout sites migrated successfully AND the package typecheck/lint passes**; while any site is un-migrated it still depends on the old code, so deleting it would break the build.
  4. **Partial-failure handling — don't half-migrate.** If some fan-out subagents fail or come back partial: **do not delete the old code** (the un-migrated sites still need it), leave the feature **`in-progress`**, and **report migrated-vs-pending sites explicitly** — which files landed, which remain, and the error for each failure. State that **re-running `/develop` resumes the pending sites**: it detects the already-migrated sites (skips them) and only applies the primitive to the ones still on the old pattern — the rollout is idempotent and resumable. The superseded code comes out on the run where the last site lands green.

- **Both** → the order the two tracks run in follows the build approach, not a fixed rule. By default (and for an end-to-end / tracer-bullet slice) build the logical interface first so the UI binds to something real, then the UI; for a **Facade** (UI-shell-first prototype) stand the UI up on placeholder data first and wire the logical layer after. Let the project's recorded approach decide.

**If the build reveals the spec is wrong, update the ADR before patching — never silently diverge.** The Step 0 / Step 2 checks catch a *thin* or *missing* ADR before you start; this is the mid-build case where the ADR turns out **wrong or incomplete** — the decided data model can't hold, an acceptance criterion contradicts the API surface, the chosen approach doesn't work in practice. When building correctly would mean **deviating from the spec**, STOP before coding the deviation and route to `/architect` to **update or supersede** the ADR (paste-ready `/architect <feature>: <what the spec got wrong>`); resume `/develop` once the ADR reflects reality. Quietly building something the ADR doesn't say is how spec and code drift apart — the whole point of the spec-driven flow is that they don't.

**A data-layer build isn't done until its migration is applied and verified.** Generating a migration is not the same as running it: a data-layer sub-task requires **generating the migration, running it against the target DB, and confirming the schema is live** (the tables/columns/relationships actually exist — query the DB or its introspection, not just the migration file) before it's ticked. A generated-but-unapplied migration is an un-done task. (Detailed in `logical-guide.md`, Phase 2.)

**Remove superseded code — the old and new must not coexist.** When a build **replaces** an existing pattern or implementation (a refactor, or a rollout that swaps one approach for another), deleting the old code is **part of the build, not optional cleanup**. Once the new implementation is in, remove the superseded code — dead functions, now-unreachable branches, orphaned files, and imports left unused — and **verify nothing still references it** (search the codebase for callers/imports of the removed symbols; the typecheck/build/lint must be clean *with the old code gone*). A build that leaves the old and new implementations side by side is not done. (Elaborated in `logical-guide.md`.)

**For a multi-site rollout, this cleanup is gated on the whole rollout landing.** A single-site refactor cleans up inline as above — delete the old code the moment the new implementation is in and the typecheck is green. But a fan-out rollout (above) must **wait until ALL sites have migrated successfully and the package typecheck/lint passes** before removing the superseded code, because every un-migrated site still references it — deleting early breaks the build. If the fan-out came back partial, leave the old code in place, keep the feature `in-progress`, report migrated-vs-pending sites (and each failure's error), and let a re-run of `/develop` finish the pending sites (resumable/idempotent); the deletion happens on the run that turns the sweep green.

**Follow the ADR's verify protocol.** If the ADR specifies how to verify (common on projects with **no test runner** — e.g. "`pnpm -F <pkg> typecheck` must pass after every sub-task", or "diff API responses before/after"), **run exactly that** after each sub-task/batch, and don't mark a sub-task done until it passes. Don't assume a test suite exists — do what the ADR says.

### Step 4 — Update the roadmap and report

- **Only mark what actually landed.** Before ticking anything, confirm the work is really there — files written, build subagent returned success (not an error or empty result), code present. For a **data-layer** task, "landed" means the migration is **applied and the schema confirmed live**, not merely generated. If the build **failed or came back partial** (subagent errored, was interrupted, or left a sub-task half-done): leave that task **unchecked**, keep the feature **`in-progress`**, and report exactly what's incomplete and why. Never mark a task `done` on an unverified or failed build — a roadmap that claims work that isn't there is worse than one that's behind.
- **Tick the atomic tasks in the ADR, the milestones in the roadmap.** As you complete each **`## Build plan`** task, tick it in the ADR (that is the resume trail). On the roadmap, tick a **milestone** sub-box when the ADR tasks it rolls up are done, and tick the **`Build it`** box when all its milestones are done. Fill in the feature's **pointer line** (`code in <path>`). **Do NOT tick `Verify it` or `Test it`** — leave those for `/verify` and `/test`, and **leave the status `in-progress`** (a built-but-unverified, untested feature is not `done`); tell the engineer to run `/verify <feature>` next. Only `/test` (with `/verify` passed) closes a feature to `done`. Tick only what you **verified** built — **the one roadmap file you located in Step 0**, not the whole tree. For a **no-ADR** feature, tick its roadmap checkbox(es) directly.
- **Mirror `done` onto the governing ADR.** When (and only when) the feature reaches `done` — every sub-task checked, build verified — advance its governing ADR's `**Status**:` line `In Progress` → `Accepted` (the feature is built and verified — "done and dusted"; don't do this while it's still `in-progress`). One-line surgical edit only: re-read the line first, and if it isn't `In Progress` as expected (e.g. already `Accepted`, or `Superseded`) **flag it rather than clobber** — never edit ADR content.
- **Emit verify steps, then ASK where they go (every run — never auto-save).** At the end of *every* `/develop` run, derive **concrete verification steps from the ADR's acceptance criteria** — actionable and specific, each tied back to its `AC-N`, not vague advice. **Always present the panel below and let the engineer choose** — do **not** silently write `verify.md`; the file is created only if they pick "Save". E.g. "visit `/signup` → sign up → expect redirect to `/auth/verify-email` → AC-1", "run `<migrate cmd>` → query confirms tables live → AC-4". Then present a decision panel (your agent's option picker — `AskUserQuestion` on Claude Code — or plain-text options with the same choices if it has none; single-select):
  - **question**: "Save these verify steps to the feature's `verify.md`, or just show them in this summary?"
  - **header**: "Save verify steps?"
  - **options**:
    1. `Save to verify.md` — "Recommended for data, auth, or full-weight features: a durable checklist `/verify` can run and `/test` can later lock." → write/append the steps to `verify.md` (below).
    2. `Just show in summary` — "Keep them inline in this report only; don't write a file." → include them in the report and stop.

  The tool appends "Other" as a free-text option automatically. On **Save**, write/append to a `verify.md` **beside the ADR**: if the ADR is a **single file**, **promote it to a directory** to hold the new file — `docs/adr/NNNN-feature.md` → `docs/adr/NNNN-feature/{index.md, verify.md}` (**rename the ADR file to `index.md`**, never double the name; same promotion rule `research/` uses), and **repoint the roadmap feature's `ADR` link to the new `…/index.md` path**; if the ADR is already a directory, drop `verify.md` in it. Append (don't clobber) if a `verify.md` already exists. Use this format so `/verify` can consume it and `/test` can lock the durable steps:

  ```markdown
  # Verify: <feature> · ADR NNNN · updated <date>
  _Steps derived from ADR NNNN acceptance criteria. `/verify` runs these; `/test` locks the durable ones._
  ## UI / manual
  - [ ] <action> → <expected>        → AC-N
  ## Commands
  - [ ] `<command>` → <expected>     → AC-N
  ## Acceptance-criteria coverage
  - AC-1 … covered by step … · AC-2 … · …
  ```
- Relay the track's report (the `## /develop complete` block from `ui-guide.md` and/or `logical-guide.md`).
- Recommend the next step per tier: usually `/verify` (run the steps you just emitted/saved), then `/test` to lock the durable ones, then `/sync` to promote any new area conventions into `AGENTS.md`. **Always end by advising `/clear` before the next feature** — the roadmap, the ADR, and `AGENTS.md` hold the state, so a fresh session loses nothing and keeps every build short and cheap (long sessions cost more even when cached). Suggest **`/compact` mid-build** if this single feature is running long. (On Claude Code use `/clear` / `/compact`; use your agent's fresh-session equivalent elsewhere.)

`/develop` builds; it does not run `/verify`, `/test`, `/sync`, or `/architect` for you — it points; you decide.

---

## Reference files

- UI build track: `ui-guide.md`
- Logical build track: `logical-guide.md`
- Accessibility checklist (UI track, Phase 5): `checklist.md`
- Design templates (UI track): `templates/`
- Project design system (UI track): `./design.md`
