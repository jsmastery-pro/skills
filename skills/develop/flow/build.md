# Develop: build flow (Steps 1-4, after the Step 0 spec gate passes)

Read this once the Step 0 gate in `SKILL.md` clears (a decision is not owed, or the engineer chose to build anyway). It holds the build flow after the gate. Tracks are additive: a feature can be UI, Logical, or both (and may also carry a tooling sub task); classify in Step 1 and run each part.

Guide paths below (`ui-guide.md`, `logical-guide.md`, `checklist.md`) are relative to the develop skill folder (the parent of this `flow/` directory).

### Step 1: Classify the track

| Signals | Track |
|---|---|
| "page", "component", "screen", "layout", "ui"; a screenshot is attached; visual work against `design.md` | **UI** → `ui-guide.md` |
| "api", "endpoint", "service", "functionality", "logic", "data", "job", "webhook", "integration" | **Logical** → `logical-guide.md` |
| Both present (e.g. "auth": pages + session logic) | **Both**: run each track for its part |

If genuinely ambiguous, ask once: "Is this the UI, the logic behind it, or both?"

### Step 2: Load the decision and conventions (both tracks)

Read:
1. **The governing spec** (feature's `spec` pointer, or Step 0), build spec sections only: `## Requirements` (user stories + IDed acceptance criteria `AC-1…`; the contract, and the source of the Step 4 verify steps), `## Decision`, the design/spec section (`## Feature design` / `## Proposed stack` / spec table), `## Build plan` (ordered tasks tagged "satisfies AC-N", migration as task 1), `## Consequences` (constraints). Skip `## Context`, `## Options considered`, `## Rationale` (decision history, not build input) unless a constraint needs the reasoning. Umbrella `index.md` → read the index (decision + child list; `## Structure` maps every child; the index holds any cross child contract), then only the child spec(s) this sub task touches (usually one; a second only if it truly spans two, never all), build spec sections only; a child is self sufficient, its inline rationale is optional depth. Never read the spec's `rationale.md` for a build (it is decision history, not build input). **Check the `Status`** (single file, or umbrella `index.md`; children carry none): `Proposed` → warn: "The governing spec is still `Proposed`, not accepted. Build on a decision that isn't agreed, or accept it first (run `/architect` again and confirm)?" and build only on a go ahead; `Superseded` → use the superseding spec.
2. **The nearest `AGENTS.md`** to the target code area (Claude Code loads it automatically; read explicitly to be sure). It carries decisions synced from earlier features: don't ask again what's settled.
3. **`design.md`** (UI track only): the visual source of truth.
4. **The build approach**, precedence: the feature's scope row `Approach` override if declared, else the project default in root `AGENTS.md`, else the scope file's header (a feature with its own approach, e.g. a Facade prototype in a Skateboard project, builds by ITS approach). Strategies: vertical end to end slice, thinnest usable whole, UI shell first prototype wired later, full user journey per phase. Governs *how you assemble* the slice in Step 3, not *what* it contains (the spec fixes that). None recorded → default to a coherent end to end slice, every layer the feature spans (data → logic → interface → UI). Reason from the strategy's principle, not a fixed per approach recipe.
5. **Tool skills**: the spec's `## Decision` **Implementation skills** field names them (e.g. an ORM, an auth library); `AGENTS.md`'s `## Agent skills` section lists what's installed, one bullet per skill with its location. Open the `SKILL.md` (the path from that bullet or the spec field is real and readable) of each one materially governing the code you're about to write and follow its conventions. On demand only: just the skills this sub task touches, not all. On Claude Code a skill may activate on its own; read it explicitly anyway. Unreadable → build from the spec plus knowledge, note it.

**Monorepo: work inside the target workspace.** Workspaces config or `apps/*`/`packages/*` manifests → identify the feature's workspace (code pointer, or task path) and operate there: its nested `AGENTS.md` and `design.md`, its `package.json`/stack, write into its tree, run its commands (`dev`/`build`/`test`, e.g. `pnpm --filter <workspace> …` or `turbo run … --filter`). The checks before you start apply to that workspace; its scope is `docs/scope/<workspace>/`.

**Precedence on conflict:** the spec wins for the feature it governs; `AGENTS.md` is the general convention (`AGENTS.md` says Jest, this spec says "Vitest for this" → Vitest for this feature). Flag the conflict ("spec <NNNN> diverges from `AGENTS.md` on X, `/sync` should reconcile") rather than silently picking. spec silent on a point → `AGENTS.md` governs.

**Spec completeness check (before building, not partway through the build).** Confirm the spec has what this task needs: logical → data model, API surface, security model, key invariants; UI → the screens and their states/requirements. A load bearing section missing or a placeholder → don't guess; ask:
- **question**: "The spec for this is missing `<section>`. I need it to build correctly. How do you want to proceed?"
- **header**: "spec gap"
- **options**: `Update the spec first` (recommended: end with a paste ready `/architect <feature>: fill in <section>` handoff) · `Tell me the answer now` (engineer supplies it inline; proceed, note it should be backfilled into the spec) · `Use your best judgment` (proceed on a stated assumption, surfaced in the report for review).

### Step 2.5: Explore before building (isolate the reading, the top monorepo win)

Locating files to touch and patterns/interfaces to match and reuse means reading code, the top context cost in a large or monorepo repo (inline, every opened file stays in the main context all session). Isolate it in a read only subagent that returns a compact map (~1 to 2k tokens).

- **Skip it** when the change is tiny and you know the file, and on a fresh (just cleared) session where context is still light: inline reading is then fast and mostly cache cheap, while a subagent adds spawn latency for little saving. It only pays when context is the scarce thing, not on every build.
- **Run it** when the reading would genuinely bloat the main context: a large or monorepo repo, many files, an unfamiliar area, or a session already carrying a lot.

Spawn a read only exploration subagent (Claude Code: the `scout` subagent type, which is read only and pins its model to a fast, low cost tier; else Cursor `Explore`, Antigravity `research`, Codex `spawn_agent`; else a plain subagent, or inline if your agent has none). Where the type does not pin it, set its model explicitly to a fast, low cost tier and do not let it inherit this session's model. Tools `Read`/`Grep`/`Glob` only, no `Edit`/`Write`. Brief: target workspace, exact sub task, the spec's key interfaces; return only a compact map, files to create/edit (paths), patterns/conventions to match (`file:line`), symbols/types/helpers to reuse, and gotchas, no file contents or dumps.

Build from the map: offload the token heavy reading, keep the deciding and writing on the main thread (Step 3).

**Rules of thumb (large repos & monorepos):** hold the Step 0 read scope (one workspace, one scope file, one governing spec), one sub task per run, and build inline on the main thread.

### Step 2.6: Doc check (only when needed): offload current usage lookups to a web subagent

Only when you genuinely need the current usage/setup/API of a tool the spec already decided (fast moving or newly released, e.g. an auth library's ORM adapter wiring, a framework's latest routing/config shape) and you're unsure your knowledge is current. Most builds don't need it: for a stable, well known stack, build from knowledge and let the typecheck/build/lint loop catch a stale API cheaply; don't web search by default. Never to choose or reconsider a tool (`/architect`'s job): look up *how to use* the decided tool, not *whether*; if docs reveal it genuinely can't work, that's the "spec is wrong" path (Step 3), not a silent swap. This is a fresh lookup of current API usage, NOT a second fetch of the spec's own reference links, which were verified once at design time and are there for a human to follow, never for the build to open again.

**How (capability first):** spawn a read only web subagent (on Claude Code, the `researcher` subagent type, which pins a fast, low cost model and carries the web tools; else the web/browse tool on Cursor/Codex/Antigravity or your agent's equivalent), with its model set explicitly to a fast, low cost tier where the type does not pin it (do not inherit the session model), briefed with the exact tools and versions from the spec and the one thing you need. Return only a compact usage summary (current call/config/setup steps, version notes, gotchas), never raw pages or site lists, so only the answer lands on the main thread; build from it. No web capability → skip: build from knowledge, lean on the build/typecheck loop to surface a stale API mistake, note the assumption.

### Step 3: Resume check, then build

**Task source.** Governing spec → its `## Build plan` is the atomic checklist (tasks tagged with their AC, migration first): build from it and tick progress there, the resume trail. The scope carries only the milestone rollup under the feature's `Build it: /develop <feature>` box (2 to 5 sub items), updated per Step 4; `Verify it` and `Test it` belong to `/check verify` and `/test`. No spec → the scope checkboxes are the tasks.

**Build the coherent slice the approach calls for; don't silently skip surface.** Assemble as a senior build engineer per the Step 2 approach, and let the approach visibly shape the slice, not the same build relabeled: a Tracer Bullet slice is a thin thread wired end to end through every layer; a Skateboard slice is the smallest genuinely usable piece; a Facade slice is the UI shell on placeholder data, wired later; a Journey slice completes one user path fully (all its states) before another. Reason from the principle, not a recipe; none recorded → the Step 2 end to end default. Cross check the task list against `## Requirements` (`AC-1…`) and the spec's API/UI surface before building: required but uncovered (the classic missed verify email page) → flag it and add the task. Every `AC-N` is satisfied by a task you build, or explicitly deferred with the engineer's agreement.

**Resume first; never rebuild what's done.** Use the Step 0 scope file only (the workspace's, in a monorepo). Status **`existing`** (shipped) or **`dropped`** (dropped from scope) → not active: don't build it automatically; say it's marked `<status>` and confirm reviving/modifying (a new task, possibly needing a spec). Else find the first unchecked `[ ]` in the spec's `## Build plan` (or the scope checkboxes, no spec); `[x]` tasks are already built, don't redo them. Say where you pick up: "This feature is 4/10 done, resuming at *data integration*." Set the feature's status to `in-progress` (At a glance table and heading); a governing spec's `**Status**:` line advances `Proposed` → `In Progress` surgically per Artifact ownership (read it again first; not `Proposed` → flag, don't clobber). No scope → just build the requested task.

**Gather remaining inline answers** (the Step 2 spec gap answer, UI asset and design direction questions, an ambiguous business rule) before any build handoff; they need the engineer.

**With the Step 2.5 map in hand, the build is a write step you do inline on the main thread.** Do not spawn a subagent to write code; the main thread does all the building. (Reading to locate files is the only thing offloaded, in Step 2.5; the writing stays here.) A normal feature slice, a page, an endpoint, a very large single build, and a big multi file rollout are all built inline, just sequenced sensibly.

Tracks:

- **UI** → follow `ui-guide.md` inline (component or screen → stack/styling/dark mode detection → asset resolution → tokens → font → the five phases → accessibility); the main thread keeps design/asset questions responsive.
- **Logical: normal build** → inline per `logical-guide.md` (ground in the spec → data layer → core logic → interface → integration → correctness pass).
- **Logical: very large single build** → still inline. Work through it in ordered chunks per `logical-guide.md`, ticking `## Build plan` tasks as each lands and its typecheck passes; use `/compact` partway through the build if the single feature runs long (the scope and spec hold the state, so nothing is lost).
- **Logical: big rollout of an already decided pattern** (e.g. "swap inline inputs across 17 files") → still inline, sequenced to stay safe:
  1. **Primitive first**: build the shared thing (helper/module/schema) and confirm it typechecks before touching call sites.
  2. **Apply site by site**: work through the files in turn, applying `<primitive>` per the pattern the spec fixes, preserving exact behavior; tick each as it lands.
  3. **Gate once at the end**: package wide typecheck/lint and `/check verify` after all sites are migrated, not after each. Remove the superseded code only on this green sweep (ALL sites migrated AND typecheck/lint passing): sites not migrated still reference it, deleting early breaks the build.
  4. **Partial progress; don't migrate only halfway**: if you stop before every site is done, keep the old code, leave the feature `in-progress`, report migrated versus pending sites explicitly (which files landed, which remain), and say running `/develop` again resumes the pending sites (it detects and skips migrated ones; idempotent and resumable). The old code comes out on the run where the last site lands green.
- **Both** → track order follows the build approach, not a fixed rule. Default (and for an end to end / tracer bullet slice): logical interface first so the UI binds to something real, then UI. Facade (UI shell first): UI on placeholder data first, wire the logical layer after.

**Spec wrong partway through the build → update the spec before patching; never silently diverge.** The spec proves wrong or incomplete partway through the build (e.g. the decided data model can't hold, or an acceptance criterion contradicts the API surface): if building correctly means deviating from the spec, STOP before coding the deviation, route to `/architect` to update or supersede the spec (paste ready `/architect <feature>: <what the spec got wrong>`), resume once the spec reflects reality.

**A data layer build isn't done until its migration is applied and verified**: generate the migration, run it against the target DB, confirm the schema is live (tables/columns/relationships exist; query the DB or its introspection, not just the migration file) before ticking. Generated but unapplied = not done. (`logical-guide.md`, Phase 2.)

**Remove superseded code; old and new must not coexist.** A build that replaces an existing pattern or implementation (a refactor, or an approach swapping rollout) includes the deletion, not as optional cleanup: remove dead functions, unreachable branches, orphaned files, unused imports; verify nothing still references them (search for callers/imports; typecheck/build/lint clean with the old code gone). Old and new side by side = not done. Timing: single site → delete the moment the new code is in and typecheck is green; multi site rollout → per rollout points 3 and 4 above. (Elaborated in `logical-guide.md`.)

**Follow the spec's verify protocol.** If the spec specifies how to verify (common with no test runner, e.g. "`pnpm -F <pkg> typecheck` must pass after every sub task", or "diff API responses before/after"), run exactly that after each sub task/batch; a sub task isn't done until it passes. Don't assume a test suite exists.

### Step 4: Update the scope and report

- **Only mark what actually landed.** Confirm first: files written, code present and typechecking; data layer task → migration applied and schema confirmed live, not merely generated. Interrupted or half done sub task → leave the task unchecked, keep the feature `in-progress`, report exactly what's incomplete and why. Never mark a task `done` on an unverified or incomplete build.
- **Tick atomic tasks in the spec, milestones in the scope** (only what you verified built, only in the Step 0 scope file): each completed `## Build plan` task in the spec; a milestone sub box when its spec tasks are done; the `Build it` box when all milestones are done; fill the pointer line (`code in <path>`). Do NOT tick `Verify it` or `Test it`; leave the status `in-progress` (built but unverified, untested is not `done`); tell the engineer to run `/check verify <feature>` next. Only `/test` (with `/check verify` passed) closes a feature to `done`. No spec feature → tick its scope checkbox(es) directly.
- **Mirror `done` onto the governing spec.** When (and only when) the feature reaches `done` (every sub task checked, build verified), advance the spec's `**Status**:` line `In Progress` → `Accepted` ("done and dusted"; never while `in-progress`), surgically per Artifact ownership: read it again first; not `In Progress` (already `Accepted`, `Superseded`) → flag, don't clobber.
- **Emit verify steps, then ASK where they go (every run, never save automatically).** Derive concrete verification steps from the spec's acceptance criteria, actionable and specific, each tied to its `AC-N`, not vague advice (e.g. "visit `/signup` → sign up → expect redirect to `/auth/verify-email` → AC-1", "run `<migrate cmd>` → query confirms tables live → AC-4"). Always present this panel; write `verify.md` only on "Save" (single select; `AskUserQuestion` on Claude Code):
  - **question**: "Save these verify steps to the feature's `verify.md`, or just show them in this summary?"
  - **header**: "Save verify steps?"
  - **options**:
    1. `Save to verify.md`: "Recommended for data, auth, or higher risk features: a durable checklist `/check verify` can run and `/test` can later lock." → write/append the steps to `verify.md` (below).
    2. `Just show in summary`: "Keep them inline in this report only; don't write a file." → include them in the report and stop.

  The tool appends "Other" as a free text option automatically. On **Save**, write/append `verify.md` beside the spec. Single file spec → promote it to a directory, `docs/specs/NNNN-feature.md` → `docs/specs/NNNN-feature/{index.md, rationale.md, verify.md}` (split the decision record sections Context/Options considered/Rationale/References into `rationale.md`, keep the build spec in `index.md`, never double the name), and repoint the scope feature's `spec` link to the new `…/index.md` path. Directory spec → drop `verify.md` in. Existing `verify.md` → append, don't clobber. Format (so `/check verify` can consume it and `/test` can lock the durable steps):

  ```markdown
  # Verify: <feature> · spec NNNN · updated <date>
  _Steps derived from spec NNNN acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._
  ## UI / manual
  - [ ] <action> → <expected>        → AC-N
  ## Commands
  - [ ] `<command>` → <expected>     → AC-N
  ## Acceptance-criteria coverage
  - AC-1 … covered by step … · AC-2 … · …
  ```
- Relay the track's report (the `## /develop complete` block from `ui-guide.md` and/or `logical-guide.md`).
- Recommend the next step: usually `/check verify` (run the steps just emitted/saved), then `/test` to lock the durable ones, then `/sync` to promote new area conventions into `AGENTS.md`. Always end by advising `/clear` before the next feature (the scope, spec, and `AGENTS.md` hold the state, so a fresh session loses nothing; long sessions cost more even when cached). Suggest `/compact` partway through the build if this single feature runs long. (On Claude Code `/clear` / `/compact`; your agent's fresh session equivalent elsewhere.)

`/develop` builds; it does not run `/check verify`, `/test`, `/sync`, or `/architect` for you, it points; you decide.
