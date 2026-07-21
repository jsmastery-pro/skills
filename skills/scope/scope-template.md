Scope structure `/scope` writes to: the reference shapes read while writing the scope and the completion report. All rules and guidance live in `SKILL.md`.

## What keeps it readable (the format rules)

- **Two parts:** a slim **At a glance** table for a quick scan, then **the plan** as clean feature sections grouped by phase. Build order is just the section order. There is no separate "build order" list to keep in sync.
- **Clean headings.** A heading is `### <N>. <Feature name>` plus a short status word and short tags **only when they carry real information** (`needs a decision`, a per feature approach override, a workflow tier override like `· Full`). Never a pipe delimited metadata row like `Title | P0 | inherit | …`.
- **Each fact appears once.** Intent, the definition of done, tasks, and pointers live in the section; the At a glance table is the quick index. Status is shown in the table and beside the heading, and nowhere else.
- **Only what is set.** No `n/a`, no `inherit`, no empty fields. A pointer line (`spec <n> · code in <path>`) appears **only once those exist**: the spec link added by `/architect` at capture, the code path by `/develop`.
- **A feature grows a defined shape.** It has a one or two line **intent**, a single **Done when:** line (the acceptance criteria seeds), and **checkbox steps**. A **not yet designed** feature has **one box** (its entry command: `/architect` when it `needs a decision`, else `/develop`, or `/audit` for standards & tooling). **When its spec is captured, `/architect` fills in the built ready shape:** `Design it` (ticked) → `Build it: /develop <feature>` with **2 to 5 milestone sub items rolled up from the spec** → `Verify it: /check verify <feature>` → `Test it: /test <feature>`. **The atomic build tasks stay in the spec's `## Build plan`, never here**. The scope carries only the milestone rollup. The next step is always the first unticked box.

## Single file scope

```markdown
# Scope: <Product name>

<One or two plain sentences: what the product is and who it serves.>

**Build approach:** <Tracer Bullet | Skateboard | Facade | Journey> (<one-line principle>).
**Workflow:** <Vibe | Lean | Medium | Full> (<the tail after develop: e.g. Medium = check verify, then test>). The project default rigor tier; architect still gates any feature that needs a decision at every tier; a feature's own tier tag (e.g. `· Full`) overrides it.

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Stack & architecture | Foundation | in-progress |
| 2 | Coding standards & tooling | Foundation | planned |
| 3 | Data model | Foundation | in-progress |
| 4 | Design system & UI foundation | Foundation | planned |
| 5 | Core standup loop | Slice 1 | planned |
| 6 | Daily reminders | Slice 2 | planned |
| … | … | … | … |

## Foundations

### 1. Stack & architecture · in-progress
Decide the stack and scaffold a runnable project so every later slice builds on real structure.
**Done when:** the stack is recorded in a spec and the empty scaffold boots locally and passes build.
- [x] Decide the stack (spec): `/architect stack & architecture`
- [x] Scaffold from the decision: `/develop stack & architecture`
- [ ] Smoke-check it runs: `/test`
Spec 0001 · code in `./`

### 2. Coding standards & tooling
Capture conventions, then install lint, format, and pre-commit enforcement from the real scaffolded project.
**Done when:** root `AGENTS.md` reflects the real stack, and lint/format/pre-commit run clean.
- [ ] Capture conventions + tooling choices: `/audit`
- [ ] Install the tooling: `/develop tooling`
- [ ] Check it runs clean: `/test`

### 3. Data model · in-progress
<!-- DESIGNED: /architect captured spec 0002 and filled in the shape below. The 2 to 5 boxes under
     "Build it" are a ROLLUP of the spec's ## Build plan: every table, column, and policy lives in
     the spec, NOT here. This is what a feature looks like right after its spec is captured. -->
Core entities every feature builds on: users, teams, memberships, standup entries, template.
**Done when:** entities and relationships support later slices (reminders, templates, history) without a breaking migration.
- [x] Design it (spec): `/architect data model`
- [ ] Build it: `/develop data model`
   - [ ] Schema + constraints: tables, keys, unique/check, cascades (AC-1..6)
   - [ ] Row-level security: per-table policies + helpers (AC-7..9)
   - [ ] Apply migration, confirm live, generate types (AC-1..9)
- [ ] Verify it: `/check verify data model`
- [ ] Test it: `/test data model`
Spec 0002 · code (filled by /develop)

### 4. Design system & UI foundation · needs a decision
Visual language, layout primitives, and base components so the flows feel cohesive and accessible.
**Done when:** `design.md` covers type/color/spacing/components, and base components handle focus and keyboard.
- [ ] Design it (spec): `/architect design system & UI foundation`

## Slice 1: Core standup loop

### 5. Core standup loop · needs a decision
Sign in, create a team, submit today's update on the default template, read the team feed. Nothing else yet. This slice is the walking skeleton.
**Done when:** a user can sign in, create a team, submit one standup a day, and see the team's updates for today.
- [ ] Design it (spec): `/architect core standup loop`

## Slice 2: Daily reminders

### 6. Daily reminders · needs a decision
Nudge members who have not submitted before a team cutoff, so daily standup becomes a habit.
**Done when:** unsubmitted members get a timezone-aware reminder before cutoff, and submitters are not nagged.
- [ ] Design it (spec): `/architect daily reminders`

## Deferred
Out of scope for the current build pass, kept so the plan stays honest.
- **Email invites**: invite teammates by email · needs a decision
- **Billing & plans**: free and paid tiers · needs a decision · Full
- **Chat integrations**: post standups to team chat · needs a decision
- **Product analytics**: measure signups and habit · needs a decision

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally, `Decide the stack (spec)` on Stack & architecture), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | **`/architect` at spec capture** | `Design it` ticked; spec linked; `Build it: /develop <feature>` + **2 to 5 milestones**; the tier's closing boxes (`Verify it` Lean+, `Test it` Medium+, `Review it` + `Document it` Full); any surfaced follow-up enrolled |
| `in-progress` (building) | `/develop` | milestone sub-boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | the tier's last required stage (`Vibe` → `/develop`; `Lean` → `/check verify`; `Medium`/`Full` → `/test`), then `/sync` | required boxes ticked; `Review it`/`Document it` (Full) ticked by `/check review`/`/document`, tracked but not part of the `done` gate (Design/Build/Verify/Test); `/sync` captures conventions |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop` (or `/audit` for standards & tooling). The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre-workflow) and `dropped` (de-scoped, kept for history).
- **Approach tag** beside a heading (e.g. `· Facade`) overrides the project default for that feature; no tag = inherits it.
- **Workflow tier tag** beside a heading (e.g. `· Full`, `· Vibe`) overrides the project default `**Workflow:**` tier for that one feature; no tag = inherit. It is the single rigor dial (there is no separate "weight").
- **Workflow** (header line) is the project default tier, the stages each feature runs **after** `/develop`: **Vibe** = nothing after `/develop` (rely on its build time self check); **Lean** = `/check verify`; **Medium** = `/check verify` then `/test`; **Full** = `/check verify`, `/test`, a fresh model `/check review`, then `/document` (and most features need a spec). The tier also sets what closes a feature to `done`, the last required stage marks it: **Vibe** → `/develop` (build + self check); **Lean** → `/check verify` on PASS; **Medium**/**Full** → `/test` (with verify passed). At every tier an `Assumed` spec still blocks `done` until `/architect` ratifies it, and `/architect` still gates any feature that needs a decision (tier does not turn the gate off). A feature's own tier tag overrides this default. `/develop` reads the effective tier to scale the next steps it recommends.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
```

## Brownfield enrollment

Already built features are enrolled **for context**, above the planned ones, with status `existing` (complete, no task list) or `in-progress` (partial, finish via `/develop`), each with a code pointer. They also appear in the At a glance table.

```markdown
### A. Auth · existing
Pre-workflow auth: sign in, sessions, reset. code in `src/auth/`

### B. Product catalog · in-progress
Partial catalog; finish the remaining pieces via /develop. code in `src/catalog/`
```

`existing` is not `done`: it predates the workflow, so `/develop` and `/sync` leave it alone.

## Large product: epic split

When `scope.md` outgrows a comfortable scan (roughly a dozen plus features across clearly distinct areas), split by epic: **rename `scope.md` to `docs/scope/index.md`** (keep the At a glance table across all epics + a one line status rollup per epic, each linking its file), and **move each area's feature sections out into its own `docs/scope/<epic>.md`**. Promote **on demand**; don't split a small product early. File names are always **semantic** (`scope.md` / `index.md` / `<epic>.md`), never numbered. In a monorepo, each workspace gets its own `docs/scope/<workspace>/` the same way, with a top level `docs/scope/index.md` mapping the workspaces (one line + rollup each).

## Completion report block

```
## /scope complete

**Product**: <one line>
**Behavior**: <plan | replan | add (inferred from the situation, not a typed subcommand)>
**Build approach**: <name (one-line principle)> · **Per-feature overrides**: <feature → approach, … (or "none, all inherit")>
**Workflow**: <Vibe | Lean | Medium | Full> (<the stages it runs; why recommended for this product>) · **Per-feature tier overrides**: <feature → tier, … (or "none, all inherit")>
**Scope file**: <docs/scope/scope.md> (<created new | updated in place | new epic file for <area>>)
**Scope (this pass)**: <N> new features to build, <M> already on the scope, <K> deferred
**Build order**: <feature 1> → <feature 2> → …
**First step**: <run `/clear` first, then the first unticked box, usually `/architect <first feature>` (or `/audit` if a brownfield repo has no root AGENTS.md), each skill reads its inputs from the files just written, so a fresh session keeps every step cheap>
```

_Context hygiene: the scope, the specs, and `AGENTS.md` are the durable state, so the workflow hands off through files, not the chat. Advise `/clear` between units (after `/scope`, after each `/architect`, between features) and `/compact` mid unit if one run gets long. On Claude Code use `/clear` / `/compact`; use your agent's fresh session equivalent elsewhere._
