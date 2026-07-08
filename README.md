# Engineering Workflow Skills

A set of [Agent Skills](https://agentskills.io) that encode a complete, tiered, phase-based engineering workflow — from **a vague idea** to **shipped, documented, verified code** — for any AI coding agent.

The core idea: **one skill per phase, one artifact per skill.** Each skill does a single job well, writes its results to a durable file (a roadmap, an ADR, a context file), and hands off to the next. Because the state lives in files — not in a chat session — work survives across sessions, picks up where it left off, and works for a whole team.

```
idea ─▶ /roadmap ─▶ /audit ─▶ /architect ─▶ /develop ─▶ /verify ─▶ /test ─▶ /review ─▶ /harden ─▶ /document ─▶ /sync
        scope       map        decide        build       see it     lock     review    stress     write up    keep current
                                                          work       in
        └──────────────────── /status (orient anytime) ──────────────────────┘   /debug (root-cause a bug, anytime)
```

---

## Quick start

Install into your agent (see [Install](#install) for all options):

```bash
# Claude Code
npx skills@latest add JavaScript-Mastery-Pro/pilot -a claude-code   # then restart Claude Code
```

Then, depending on where you're starting:

**A brand-new product**
```
/roadmap a B2B SaaS for managing freelance contracts
```
→ asks about scope, monetization, SEO, phasing, etc., and writes a **coarse, living roadmap** — features ordered and weighted, each with an intent and acceptance-criteria seeds.

**An existing codebase (first time)**
```
/audit          → reads the repo, writes AGENTS.md context files
/roadmap <next slice>  → plans what's next on top of what's already there
```

**Any single change**

Right-size it against the [Tiers table](#tiers--right-sizing-the-process) below, then start with the first skill in that tier's playbook. A **fix** (something broken) goes straight to `/debug`:
```
/debug the double-charge bug on checkout
```

`/status` at any time tells you where things stand and what's safe to pick up.

---

## The skills

| Skill | Phase | What it does |
|---|---|---|
| [`roadmap`](skills/roadmap/) | **Scope** | Turns an idea into a **coarse, living** feature roadmap in `docs/roadmap/` — each feature with an intent, acceptance-criteria seeds, phasing, and process weight. Build tasks are derived from each feature's ADR, not guessed here. Just run `/roadmap` — it infers plan / reconcile / enroll-one-feature from context. |
| [`audit`](skills/audit/) | **Map** | Writes the `AGENTS.md` context files every other skill reads — asks your standards on greenfield, scans the code on brownfield, per-area (and per-workspace) nesting. |
| [`architect`](skills/architect/) | **Decide** | Staff-engineer system design as a **step-by-step walk** — one dimension at a time (requirements → data model → stack → API → security → edge cases), it suggests and you pick, nothing bundled upfront — writing a complete build-spec **ADR** to `docs/adr/`. A feature ADR carries `## Requirements` (acceptance criteria), Design, and `## Build plan`; a decision-only stack/standard ADR records just the decision. On capture it **updates the roadmap feature** (milestones + Verify/Test boxes) and **offers the chosen tool's Agent Skill and MCP server**. |
| [`develop`](skills/develop/) | **Build** | Builds a feature — UI *and* logic — from its ADR as a **vertical slice**, runs migrations, ticks the roadmap milestones, and emits verify steps. For a UI screen it composes the **whole product surface** (brand, copy, layout, states), never a bare widget. **Gates on the decision first**: if building would mean inventing something undecided, it routes you to `/architect`. |
| [`verify`](skills/verify/) | **Verify** | Runs the *real app* end-to-end — plus a **spec-conformance** pass: every acceptance criterion met and every specced surface built (catches missed pages / un-applied migrations), not just green tests. |
| [`test`](skills/test/) | **Verify** | A senior test suite for your uncommitted change; detects/saves your framework. |
| [`review`](skills/review/) | **Verify** | Rigorous code review on a **different model** than wrote the code, so a fresh set of eyes catches what the author missed. |
| [`harden`](skills/harden/) | **Verify** | Systems-level adversarial pass for concurrency, scale, and security failure modes (for `full`-tier work). |
| [`debug`](skills/debug/) | **Fix** | A disciplined root-cause loop — reproduce, localize, hypothesize, prove, fix at the root, add a regression test. |
| [`document`](skills/document/) | **Ship** | PR text, changelog, release notes, or a postmortem — drafted from the real diff. |
| [`sync`](skills/sync/) | **Close** | Keeps `AGENTS.md` current, **reconciles the roadmap** from what actually shipped, and flags ADRs the change made stale. |
| [`status`](skills/status/) | **Orient** | Reads git + roadmap + ADRs to show what's done, what's in progress, what's safe to pick up, and any **plan-vs-reality drift** — across a paused session or a team. |

---

## How the workflow flows

You rarely run all twelve. The [Tiers table](#tiers--right-sizing-the-process) (or the roadmap) tells you which subset a given piece of work needs.

### Greenfield — a new product
1. **`/roadmap`** decomposes the idea into a **coarse, living** roadmap and picks the build approach, **foundations first**: **stack** → **scaffold** → **coding standards** → **data model** → design system → a **walking-skeleton** slice, *then* the feature slices.
2. Walk the roadmap in order. The ground gets laid before conventions or code: **`/architect`** decides the stack (an ARCHITECTURE ADR), then you **scaffold the project** with that chosen stack, then **`/audit`** seeds root `AGENTS.md` conventions + tooling from the *real* project — running it before the stack is chosen and the project scaffolded would be premature. `/architect` then designs the data model, and so on down the foundations.
3. Then the per-feature loop (below), building each feature as a **vertical slice** (data → logic → API → UI, end-to-end) so every slice ships something real. Run `/roadmap replan` after each slice lands to reconcile and queue what's next.

### Brownfield — an existing codebase
1. **`/audit`** reads the repo and writes the `AGENTS.md` context files (root + per-area), so every later skill understands your project.
2. **`/roadmap`** plans the next slice *on top of what exists* — it enrolls already-built features (as `existing`) so the roadmap is a complete picture, and plans only the new work.
3. Per-feature loop, then `/roadmap replan` to keep the plan matching what actually shipped.

### The per-feature loop (the heart of it)

The loop is **spec-driven**: `/roadmap` fixes the *what*, `/architect` designs the *how* as an acceptance-criteria contract, and every later step traces back to that contract.

```
/roadmap → /architect → /develop → /verify → /test → /harden* → /review → /document → /sync → replan
 what       how (walk to  build the   spec-      lock    stress    fresh-    write     sync     queue
 (seed)     the ADR)      slice       conformance         (full)*   model     up        context  next
```

- **`/roadmap`** seeds the *what* — a feature's intent plus acceptance-criteria **seeds** (the definition-of-done).
- **`/architect`** designs the *how* as a **step-by-step walk** — it asks one dimension at a time (requirements → data model → stack/tool → API → security → edge cases), suggesting an option at each and letting you pick, never dumping a finished model or stack in a box. It writes an **ADR** whose spine is `## Requirements` (IDed acceptance criteria `AC-1…`, *the contract*), a Design section, and a `## Build plan`; a **decision-only ADR** (stack/architecture or cross-cutting standard) records just the decision, no build plan. On capture it **updates the roadmap feature** to `Design → Build (2–5 milestones rolled up from the ADR) → Verify → Test`, and when it settles on a tool it **offers that tool's Agent Skill and MCP server** (you choose, nothing is auto-installed).
- **`/develop`** builds the **vertical slice** (data → logic → API → UI, end-to-end), runs and confirms migrations, ticks the roadmap milestones, and emits **verify steps** tied back to each `AC-N`. For UI it composes the **full product surface** (brand, copy, layout, states), not a bare widget, and pulls the real design from a **Figma MCP** when one is connected.
- **`/verify`** runs the **spec-conformance** pass — every acceptance criterion met and every specced surface (page, route, table, migration) actually built. This is what catches a missed page or an un-applied migration that green tests never reveal.
- **`/test`** locks in the durable checks · **`/harden`** stress-tests `full`-weight work · **`/review`** re-reads on a fresh model · **`/document`** writes it up · **`/sync`** reconciles context + roadmap · then **replan** queues the next slice.

`/develop` **gates** on the ADR: if the feature needs a design system, a provider, a data model, or a behavior you haven't decided, it stops and sends you to `/architect` first. The **Tracer Bullet vertical slice is the default** for a proper build; the **Facade** UI-first path (a shell on placeholder data) is a *prototype* option — chosen as the build approach at roadmap time. `*`harden only on `full`-weight work (payments, auth, migrations).

**Bugs** skip this entirely: `/debug` runs a root-cause loop and hands a regression test to `/test`.

> **Decision panels.** Every user-facing choice is an **options panel** (2–4 options plus a free-text "your own"). **Confirmation gates** (a stage sign-off, the ADR accept, the build-approach pick) carry one **(recommended)** default. The choices **you own** — the design source, the data model, the stack, tool/MCP setup — are asked **open**: the agent presents the options and *you* pick, it does not pre-decide. On agents with an interactive picker it renders as one; elsewhere it degrades to plain text.

> **Context hygiene.** The workflow's state lives in files (roadmap, ADRs, `AGENTS.md`, `verify.md`), so each skill advises **`/clear` at handoffs** (after `/roadmap`, after each `/architect`, between features) and **`/compact`** mid-build. A fresh session re-reads everything from disk, so long chats don't pile up token cost. (On Claude Code, `/clear` / `/compact`; use your agent's equivalent elsewhere.)

---

## Artifacts — what gets written, and where

Each skill owns exactly one kind of artifact, so there's no overlap and nothing to keep in sync by hand:

| Artifact | Path | Owned by |
|---|---|---|
| **Feature roadmap** | `docs/roadmap/` | `roadmap` creates · `develop`/`sync` advance status |
| **ADRs** (decisions) | `docs/adr/` | `architect` creates · `develop`/`sync` advance status |
| **Verify plan** | `verify.md` (beside the ADR) | `develop` writes · `verify`/`test` consume |
| **Context files** | `AGENTS.md` (root + nested) + a thin `CLAUDE.md` pointer | `audit` creates · `sync` maintains |
| **App code** | your source tree | `develop` |
| **Tests** | your test dirs | `test` |
| **Review findings** | `docs/reviews/` | `review` |
| **Hardening checklists** | `docs/hardening/` | `harden` |
| **Human docs** | PR body, `CHANGELOG.md`, `docs/releases/`, `docs/postmortems/` | `document` |

> If `docs/` is a *published* docs site (Docusaurus, VitePress, MkDocs, Starlight, Nextra), the workflow artifacts move to `.workflow/` automatically so they don't ship to your site.

### The roadmap model (`docs/roadmap/`)

`/roadmap` writes a **coarse, living** roadmap — the *what*, not an exhaustive task list — built for human reading. Two parts: a slim **At a glance** table, then the plan as **clean feature sections grouped by phase**. A section is a plain heading (name plus short tags only when they matter: `needs a decision`, an approach override, `full` weight), a one- or two-line **intent**, a single **Done when:** line (the acceptance-criteria seeds), and its **tasks as checkboxes** — the next step is always the first unticked box. A pointer line (`ADR <n> · code in <path>`) appears only once those exist, and nothing that isn't set is shown (no `n/a`, no empty columns, no metadata pipes in the title):

```markdown
## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 4 | Home page | Slice 2 | planned |

## Slice 2

### 4. Home page · in-progress
The public landing page that turns a visitor into a signup.
**Done when:** hero/featured/footer render on real data; SEO + social card present; empty and error states handled.
- [x] Design it (ADR): `/architect home page`
- [ ] Build it: `/develop home page`
   - [ ] Hero + featured sections on real data (AC-1, AC-2)
   - [ ] SEO metadata + social card (AC-3)
   - [ ] Empty and error states (AC-4)
- [ ] Verify it: `/verify home page`
- [ ] Test it: `/test home page`
ADR 0007 · code (filled by /develop)
```

A feature **starts as a single box** (`Design it (ADR): /architect …`). **When `/architect` captures its ADR, the roadmap updates in place** to the shape above: `Design` ticked, the ADR linked, a `Build it` box with **2 to 5 milestones rolled up from the ADR** (the atomic build tasks stay in the ADR's `## Build plan`, never dumped into the roadmap), then `Verify it` and `Test it`. Every box is a command or a tracked milestone, so the next step is always the first unticked box. `/develop` ticks the milestones, `/verify` and `/test` close their boxes, and a feature is `done` **only when all four are ticked** — so a built-but-untested slice honestly reads `in-progress`. `/roadmap` seeds the *what*; `/architect` designs the *how* and defines the milestones; `/develop` builds; `/verify` and `/test` close the feature.

- **Build approach** — `/roadmap` recommends *how the product gets built*, as a named delivery strategy (described by principle, so the AI reasons rather than following a hardcoded recipe):
  - **Tracer Bullet** — vertical slices; each feature built end-to-end through every layer, working. *(recommended default for a proper build)*
  - **Skateboard** — MVP-first; ship the thinnest *usable whole* first, then grow it.
  - **Facade** — UI-first; a clickable shell on placeholder data, wire the back later *(prototype-grade)*.
  - **Journey** — a complete user path end-to-end per phase.

  The choice is **recorded once and honored everywhere**: `/roadmap` writes it into the roadmap header → `/audit`/`/sync` persist it into root `AGENTS.md` → `/architect`, `/develop`, `/verify` read it and shape the ADR's build plan, the build, and what "working" means to fit it. Change the approach and the whole pipeline follows.
- **Foundations-first sequencing** — whatever the phasing, the ground comes first and isn't up for a vote: **stack → scaffold → coding standards → data model → design system → a walking-skeleton slice**, *then* the features. (The stack is decided and the project scaffolded *before* `/audit` seeds conventions + tooling, so it reads the real project rather than an empty one.)
- **Per-feature process weight** — the `Weight` column right-sizes each feature (it turns design-review and `/harden` on or off downstream). This **replaces the old triage step** — right-sizing is one column, not a separate skill.
- **The replan beat** — the roadmap is *living*. `/roadmap replan` after each feature or phase ships reconciles what landed, enrolls follow-ups surfaced during the build (from the ADR's `## Consequences` / `## Follow-up`), reorders, and queues the next slice. `/roadmap add <feature>` enrolls one ad-hoc feature without re-planning the whole product.
- **Epic-split** — a small product is a single `roadmap.md`; a big one splits by epic into an `index.md` + one file per epic (mirroring the ADR umbrella and the per-workspace layout).

**Feature statuses:** `planned` → `in-progress` → `done` (the pipeline lifecycle), plus `existing` (predated this workflow, enrolled for context) and `dropped` (de-scoped, kept for history). The linked **ADR's status** mirrors that build lifecycle (`Proposed` → `In Progress` → `Accepted`) — see [The ADR model](#the-adr-model-docsadr) below. `/develop` ticks the build milestones and leaves `Verify it`/`Test it` for `/verify`/`/test`; a feature reaches **`done` only when Design, Build, Verify, and Test are all ticked** (so a built-but-untested slice stays `in-progress`). `/sync` reconciles the rest from what actually shipped, and `/status` reports it all and flags drift (code or ADRs that exist but aren't on the roadmap).

### The ADR model (`docs/adr/`)

An ADR is the feature's **complete build spec**, and it carries the **acceptance-criteria spine** the rest of the loop hangs off:

- **`## Requirements`** — the user stories plus IDed acceptance criteria (`AC-1`, `AC-2`, …). **This is the contract** `/develop` builds to and `/verify` checks.
- **Design** — the confirmed data model, API surface, stack/tool picks, security model, and edge cases (the mode-specific `## Feature design` / `## Proposed stack` / equivalent).
- **`## Build plan`** — the ordered tasks derived from the criteria, each tagged *"satisfies AC-N"*, migration first. (A **decision-only** ADR — a stack/architecture or cross-cutting standard — omits this: it records the decision, and the feature that executes it, e.g. the scaffold sub-task, derives the steps at `/develop` time.)

This gives end-to-end **traceability**: **criterion → build task → verify step → conformance check**. Every `AC-N` maps to at least one task; every task yields a verify step in `verify.md`; `/verify` confirms each criterion is met.

`/architect` produces it through a **step-by-step walk** — it asks each dimension one at a time (the **data model elicited entity by entity**, the **stack layer by layer**), suggests an option and lets you pick, and never dumps a finished model or stack in a box for accept-or-change. Tool options are **generated fresh & current at runtime**, never a hardcoded list. The finished ADR is confirmed via an **options panel** before anything gets built.

**Single file vs umbrella.** Most decisions are **one file**: `docs/adr/NNNN-title.md` (in a monorepo, `docs/adr/<workspace>/`). A **broad decision** — one that splits into several sub-decisions, or carries a bulky audit/inventory — becomes a **directory** instead, so the pieces stay discoverable and each ADR stays focused:

```
docs/adr/0003-checkout/
  index.md                       # the umbrella decision + a ## Structure manifest linking every file below; carries the Status
  0001-payment-provider.md       # a child sub-decision — focused, with its own ## References; no Status line (governed by the umbrella)
  0002-cart-state.md
  research/
    0001-provider-comparison.md  # supporting evidence, prefixed by the child it belongs to
    _shared-checkout-inventory.md # umbrella-wide evidence
```

- **Status lives on `index.md`** (it mirrors the feature); child ADRs are spec content and carry no status.
- **`/develop` reads `index.md` (the map + any cross-child contract), then the child ADR(s) its sub-task touches** — not the whole tree. A child's `research/` is *optional depth*, opened only if the build needs the underlying evidence.
- **Feature-linked ADR** → status mirrors the feature lifecycle: `Proposed` (decision agreed, feature not built) → `In Progress` (building) → `Accepted` (built and verified), plus `Superseded`. **Cross-cutting / stack ADRs** not tied to a buildable feature are instead **decision-status** — `Accepted` once you ratify them (there's no build phase to gate on).
- Children stay flat by default; a child gets its own subfolder only when its research grows. `/architect` decides single-vs-directory from the decision's breadth.

### Tool skills & MCP (optional, capability-first)

When `/architect` or `/audit` settles on a tool, it checks whether that tool has an **Agent Skill** or an **MCP server** and offers to set it up — *you* choose (the skill, the MCP, both, or neither); nothing is auto-installed, and declines are remembered in `AGENTS.md` so it never re-nags. An installed skill's conventions then shape both the ADR (in `/architect`) and the code (in `/develop`); a connected MCP gives the workflow **live access to the real thing** — a **Figma** MCP for the real design in `/develop`'s UI, a **database** MCP to confirm a migration is live, a **browser** MCP for `/verify` to drive the running app. It is all capability-first and never hardcoded: with nothing connected the workflow uses its normal fallbacks, so MCP is pure upside, never required.

---

## Tiers — right-sizing the process

The amount of process scales with risk. **Right-size each change against the table below, then run the matching playbook** — so a typo doesn't get the full treatment and a payments change doesn't get skipped. When in doubt between two tiers, pick the higher one.

| Tier | Triggers (**all** for just-do-it/lean · **any** for medium/full) | Playbook |
|---|---|---|
| **just-do-it** | One-liner, typo, config value, or copy update · fully reversible with one revert · no production risk · one file, no shared systems | act directly |
| **lean** | Well-understood, self-contained · single area · low blast radius, easy revert · doesn't touch auth / payments / migrations / shared infra | `/develop → /verify → /test → /document` |
| **medium** | Cross-cutting (multiple areas) · new external dependency or integration · touches shared state, APIs, or data models · moderate blast radius | `/audit → /architect → /develop → /verify → /test → /review → /document` |
| **full** | Production auth, payments, data migration, or compliance · large refactor or architectural change · breaking API or infra change · high blast radius · security-sensitive | `/audit → /architect → /develop → /verify → /test → /harden → /review → /document → /sync` |

`/architect` runs **only when a load-bearing decision is owed** (a new provider, data model, or cross-cutting pattern); for a medium/full change that reuses already-decided patterns, `/develop`'s ADR gate confirms none is needed and skips straight to building. `/debug` and `/status` are **on-demand**, not playbook steps — `/debug` whenever `/verify` or `/test` surfaces a failure, `/status` to orient before starting.

**Build vs fix.** Decide what *kind* of task this is first. A **build** (feature, change, addition) takes the tiered playbooks above. A **fix** (something broken, failing, throwing, or behaving wrong) is a defect and takes the fix path — `/debug` (root-cause) → `/test` (regression) → `/sync`, adding `/verify` if it touches a user-facing flow. The tiers still set a fix's severity (a payments bug is `full`), but the skill path is the fix path, not build.

**Starting a whole product or a fresh batch of features** isn't one change — run `/roadmap` first to produce the feature roadmap (in `docs/roadmap/`), then right-size each feature off that list one at a time.

**Greenfield vs brownfield order.** Where `/audit` sits depends on whether code exists yet:
- **Brownfield** (existing codebase): `/audit → /architect → …` — understand what's there *before* deciding the change.
- **Greenfield** (new project): `/roadmap → /architect → scaffold → /audit → /develop → …` — decide the foundational stack **first** (`/architect`'s ARCHITECTURE ADR), **scaffold the project** with that stack, *then* `/audit` seeds root `AGENTS.md` conventions + tooling from the real scaffolded project (auditing before the stack is chosen and scaffolded would seed an empty one).

---

## Monorepo

The workflow is first-class on monorepos (pnpm/turbo/nx workspaces, or `apps/*`/`packages/*`). The principle: **everything scopes to the target workspace, which has its own stack, conventions, commands, and roadmap.**

- **`/audit`** gives each workspace its own nested `AGENTS.md` (its stack + scoped commands), seeded even on a fresh scaffold; the root `AGENTS.md` holds only monorepo-wide concerns.
- **`/roadmap`** writes a roadmap *per workspace* (`docs/roadmap/web/`, `docs/roadmap/api/`), with shared foundations and cross-app features in `docs/roadmap/_root/`. `/roadmap web <idea>` scopes to one app.
- **`/architect`** reads *that workspace's* stack (apps often differ — Next.js web, Go api, RN mobile) and won't assume one.
- **`/develop`** builds in the right workspace using its commands (`pnpm --filter web …`); **`/verify`** runs the specific app; **`/test`** resolves per package root; **`/sync`** reconciles the right workspace's roadmap; **`/status`** reports per workspace.

So `/roadmap web` → `/architect` (reads `apps/web`'s stack) → `/develop` (builds in `apps/web`) flows cleanly, app by app.

**Context & token efficiency on large repos.** The biggest cost on a big monorepo is *reading* code to understand where to build — so the skills follow Anthropic's context-engineering guidance and **isolate that reading in a read-only exploration subagent** that returns a compact map (~1–2k tokens), keeping the main thread's context clean for the decisions and the edits (`/develop` Step 2.5; `/roadmap`'s brownfield scan; `/architect`, `/review`, `/test`, `/harden` already read via their subagents). The operating rules: scope to **one workspace / one roadmap file / one governing ADR**; do **one sub-task per run** and `/clear` between features so context doesn't accumulate; and **match the model to the work** — exploration and mechanical rollouts on a fast/cheap model, deep logic and orchestration on a strong one.

---

## Working in a team

The artifacts are shared files, so the skills are built for concurrent use:

- **Branch per feature.** Two people on one branch collide on code *and* on the roadmap/ADRs/`AGENTS.md`. Branch-per-feature is what makes the rest work.
- **Freshness checks.** `/develop`, `/architect`, and `/sync` warn if you're behind the remote (a teammate may have shipped this) or have uncommitted work, before they mutate anything.
- **Concurrent-build warning.** `/develop` flags a feature already `in-progress` with recent commits by someone else.
- **Safe concurrent edits.** Skills re-read shared files immediately before writing, make surgical edits, and flag rather than clobber on unexpected state. `/architect` guards against ADR-number collisions.
- **Orientation.** `/status` shows what's done, what's in progress (and by whom), whether you're behind, and any plan-vs-reality drift — so you can pick up safely.

---

## Compatibility

These skills follow the open Agent Skills format and are written to be **portable**:

- **Any OS** — macOS, Linux, and Windows. `git` is the only required CLI (identical everywhere); every other step uses your agent's own cross-platform file tools rather than POSIX utilities like `find`/`grep`/`sed`.
- **Any client** — they install on any skills-compatible agent (Claude Code, Cursor, Copilot, Codex, Gemini CLI, and [more](https://agentskills.io/clients)). Bundled files (writing guides, templates) are referenced relative to the skill folder; the main thread reads them itself at write time. Where a read or fetch subagent needs a briefing file, the main agent resolves it to an absolute path (falling back to inlining the text if a client can't give subagents file-read access to installed skills).
- **Capability-first, with plain fallbacks.** Several steps use a subagent, a per-step model choice, or an interactive options panel. Every skill is written to **use whatever your agent natively provides, and fall back only where it doesn't** — it never assumes a feature exists. The fallbacks, in order: run the work **inline** (no subagent), use the **parent model** (no per-step model choice), and ask questions as **plain text** (no options panel). Your agent already knows its own tool names, so the skills stay generic; the per-agent mapping lives here:

| Capability | Claude Code | Cursor | Codex | Antigravity |
|---|---|---|---|---|
| Subagent tool | `Task` | `Task` | `spawn_agent` | `invoke_subagent` |
| Per-step model | ✅ per subagent | ✅ `model:` (inherit/id) | one model / roles | parent model only |
| Options panel | `AskUserQuestion` | plain text | plain text | plain text |
| `AGENTS.md` context | via `CLAUDE.md` pointer | native (+ nested) | native | native |
| Subagent file access | passed paths or inline fallback | passed paths or inline fallback | passed paths or inline fallback | passed paths or inline fallback |
| Read-only enforcement | `allowed-tools` | `readonly:` / sandbox | `sandbox_mode` | inherited scopes |
| Install path (`-a`) | `.claude/skills/` | `.agents/skills/` | `.agents/skills/` | `.agents/skills/` |

### Cheaper subagents on Claude Code (model pinning)

By default a Claude Code subagent **inherits the main session's model**, so if you run on Opus, every read-only helper (exploration, skill/MCP discovery, doc-check, sourcing) inherits Opus too and burns tokens it never needed. Prose in a skill cannot fix this — the harness only honors a structured model field.

This repo ships two read-only role subagents in [`.claude/agents/`](.claude/agents/) that pin the model:

| Agent type | Model | Used for |
|---|---|---|
| `scout` | `haiku` | read-only code exploration and repo scans |
| `researcher` | `haiku` | Agent Skill / MCP discovery, doc-checks, source verification |

The skills spawn these two types by name on Claude Code (with the plain "set the model explicitly" behavior as the fallback everywhere else), so both read-only helpers run on Haiku, never the inherited session model. A subagent is only ever used for the two things above, reading code or fetching from the web. All writing (the ADR, `AGENTS.md`, the test suite, docs, and code in `/develop`) stays on the main thread, so nothing gets pushed onto a heavier model.

**To get this in the repos where you actually run the skills**, copy `.claude/agents/` into that project (or into `~/.claude/agents/` to enable it for every project). The resolution order Claude Code uses is: `CLAUDE_CODE_SUBAGENT_MODEL` env var → the spawn's `model` parameter → the agent type's `model:` → the session model. Do **not** set `CLAUDE_CODE_SUBAGENT_MODEL` to a fixed model if you want the per-role split, since it overrides everything.

### Running on Codex

The suite is a first-class fit for Codex — in several ways it needs *no* degradation:

- **`AGENTS.md` is native.** Codex reads `AGENTS.md` as its project instructions automatically (`project_doc_max_bytes`, `project_doc_fallback_filenames`). The context files `/audit` and `/sync` produce are the exact artifact Codex already consumes — so the workflow's shared memory is first-class, not just compatible.
- **Subagents work.** Codex ships multi-agent tools on by default (`features.multi_agent` → `spawn_agent`, `wait_agent`, `resume_agent`, …), so the read-only scout/researcher helpers and the review/harden subagents run natively. Those helpers get a brief from the main agent; where one needs a bundled file it reads it from the absolute path passed, with an inline fallback if your sandbox blocks installed-skill reads. Per-step *model* selection (haiku vs opus) is Claude-specific; on Codex use one model, or define roles via `agents.<name>.config_file`.
- **Install:** `npx skills add JavaScript-Mastery-Pro/pilot -a codex` → lands in `.agents/skills/`. Enable/disable individual skills with `skills.config` if desired.
- **Enforce the read-only skills with Codex's sandbox, not just `allowed-tools`.** Because `allowed-tools` uses Claude tool names, treat it as advisory on Codex and let Codex's own permission layer do the enforcing — run `/status`, `/review`, `/verify` under `sandbox_mode = "read-only"` (or a `default_permissions = ":read-only"` profile). Build skills need `sandbox_mode = "workspace-write"`.

### Running on Antigravity

Antigravity (Google) is another strong fit — it shares the two things that matter most:

- **`AGENTS.md` is read natively** to align the agent's behavior and planning phase with your conventions — the same artifact `/audit` and `/sync` produce.
- **Subagents are first-class** via `invoke_subagent` (async, with built-in `research`/`browser`/`self` roles and `define_subagent` for custom ones), so the read-only scout/researcher helpers and the review/harden subagents run natively. Antigravity's `browser` subagent is a natural fit for `/verify`'s runtime checks.
- **One key constraint:** an Antigravity subagent **runs on the parent's model** (no per-subagent model choice). So `/review`'s cross-model guarantee can't be automated there — it now detects this and falls back to an inline, same-model review (flagged as reduced independence), or you switch your active model and re-run. The read-only helpers (scout/researcher) that would pick a *cheaper* model simply run on the parent model.
- **Install:** `npx skills add JavaScript-Mastery-Pro/pilot -a antigravity` → project skills land in `.agents/skills/`. Subagents inherit the parent's approved command/file scopes, and any tool needing confirmation bubbles up to the subagent panel — so Antigravity's own permission model is the enforcement layer, with `allowed-tools` as an advisory hint (as on Codex).

### Running on Cursor

Cursor is the closest match to Claude Code:

- **`AGENTS.md` is native** — read at the root *and in nested subdirectories* (auto-applied per directory), exactly how `/audit` and `/sync` structure context. Cursor also reads `.claude/agents/` for compatibility.
- **Subagents via `Task`** (same tool name as Claude Code), with built-in `Explore`/`Bash`/`Browser` roles and parallel execution — so the read-only scout/researcher helpers and the review/harden subagents run natively.
- **Per-subagent model is supported** (`model: inherit` or a specific id), so `/review`'s cross-model pass works here. Cursor falls back to a compatible model under admin/plan/Max-Mode limits — the same case `/review`'s fallback already handles.
- **Read-only skills map to Cursor's `readonly: true` subagent flag** (no edits, no state-changing shell) — a native fit for `/status`, `/review`, `/verify`.
- **Install:** `npx skills add JavaScript-Mastery-Pro/pilot -a cursor` → `.agents/skills/`.

## Install

Using [`npx skills`](https://github.com/vercel-labs/skills). **The install folder depends on the agent you target with `-a`** — pick the one(s) you use:

```bash
# Claude Code → installs into .claude/skills/
npx skills@latest add JavaScript-Mastery-Pro/pilot -a claude-code

# No -a → installs into the generic .agents/skills/ (read by Codex and other agents)
npx skills@latest add JavaScript-Mastery-Pro/pilot

# Both at once → creates BOTH .claude/skills/ and .agents/skills/
npx skills@latest add JavaScript-Mastery-Pro/pilot -a claude-code -a codex

# See what's available, or install just one
npx skills@latest add JavaScript-Mastery-Pro/pilot --list
npx skills@latest add JavaScript-Mastery-Pro/pilot --skill review -a claude-code

# Install globally (for your user, all projects) with -g
npx skills@latest add JavaScript-Mastery-Pro/pilot -a claude-code -g
```

> **Which folder?** Each agent reads its own directory: **Claude Code → `.claude/skills/`**, while Codex and several others read the shared **`.agents/skills/`**. If you want a skill in two tools, install for both (e.g. `-a claude-code -a codex`) — you'll then have both folders, each with its own copy. After installing for Claude Code, **restart it** so the skills load.

Commit the installed skills folder(s) to share the same workflow with your team.

## Local development

The canonical source for every skill is the top-level **`skills/`** directory — that's the single copy `npx skills` publishes and installs, so there are no duplicates.

If you want Claude Code to use these skills *while developing this repo* (Claude Code reads from `.claude/skills/`), create a local link — `.claude/` is git-ignored, so this never ships and can't double-list in `npx skills`:

```bash
# macOS / Linux
mkdir -p .claude && ln -s ../skills .claude/skills

# Windows (PowerShell — junction, no admin needed)
New-Item -ItemType Junction -Path .claude\skills -Target skills
```

Validate any skill against the spec with [`skills-ref`](https://github.com/agentskills/agentskills/tree/main/skills-ref):

```bash
npx skills-ref validate ./skills/<name>
```

A repo-level guard, `scripts/check-portability.mjs`, enforces the cross-tool conventions so they don't drift — every skill declares `allowed-tools`, no skill hardcodes a Claude-only model alias or names a subagent tool in prose, and no non-portable shell glue leaks into a `SKILL.md`. Run it (and `skills-ref`) before committing:

```bash
node scripts/check-portability.mjs
```

---

Built with the [Agent Skills](https://agentskills.io) open format.
