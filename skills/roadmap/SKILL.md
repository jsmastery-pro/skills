---
name: roadmap
compatibility: Built for Claude Code — uses interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Task, AskUserQuestion
description: "Use this skill to turn a product idea into a living, coarse, spec-driven roadmap — and to keep it current as you ship. Just run `/roadmap [what]` and it infers the right move from the situation, the way /architect infers its mode: plan a new product, plan the next slice of an existing one, enroll a single feature you name (one coarse row, no full re-plan), or — with no argument — reconcile after shipping and queue what's next. You never type a subcommand. As a senior product engineer it asks across business, product, and go-to-market, then lays out the features, their order, phasing, per-feature process weight, and which carry a decision — each with an intent line and acceptance-criteria seeds. It writes the roadmap to docs/roadmap/. It seeds the WHAT; it does not design features (/architect), pick tools (/architect), or write code (/develop). Build tasks are derived from each feature's ADR, not guessed here."
---

## Output style (plain words, no dashes)

Write everything this skill produces (the roadmap it writes, and every message shown to the engineer) in plain, simple language. Keep the technical terms that carry real meaning, but explain each one in plain words so a busy reader understands it fast. Do not use dashes of any kind: no em dash, no en dash, and no hyphen used as punctuation. Use short sentences, commas, or parentheses instead. Clear beats clever.

## What this skill does

Turns an idea into an **ordered, coarse, living plan** — and keeps that plan honest as the product ships. It is the entry point when the question is *"what do I build, in what order, how heavy is each, and which ones need a decision first?"* — **not** *"how do I build this one thing?"* (that's `/architect` and `/develop`).

A roadmap here is deliberately **coarse and small**. Each feature row carries only: its order, its phasing, its status, a process **weight**, whether it **needs an ADR**, an **ADR pointer**, a **code area**, plus a one- or two-line **intent** and a few **acceptance-criteria seeds** (definition-of-done seeds — the WHAT). It does **not** hold an exhaustive build-task breakdown. Those tasks are **derived from each feature's ADR** when `/architect` designs it — `/roadmap` seeds the *what*; `/architect` designs the *how* and fills the tasks; `/develop` builds them.

**One command, inferred intent.** You always run `/roadmap [what]` — never a subcommand. The skill reads the situation (is there a roadmap yet? did you name a single feature or none? is this a brownfield repo?) and does the right thing, the way `/architect` infers its mode. The three behaviors below are what it *infers into*, not modes you select:

| Behavior | Inferred when | What it does |
|---|---|---|
| **plan** (default) | No roadmap yet + a product-sized idea, or you ask for the next slice of an existing one | Full pass: ask → decompose into coarse feature rows → order + phase → write the roadmap |
| **replan** | Roadmap exists + **no argument** | Reconcile what shipped, enroll needs that surfaced during the build, reorder, queue the next slice. **This is the normal living rhythm, not a rare event** — run bare `/roadmap` again to reconcile. |
| **add** | Roadmap exists + the argument names a **single feature** | Enroll **one** coarse row (intent + order + weight + Needs ADR) without re-planning the whole product — run `/roadmap <a feature>` to enroll one |

It seeds the plan and hands you a coarse, checkable list. Architecting each feature (which fills its build tasks) and building them is the rest of the workflow.

## Asks vs acts

**Senior product engineer role.** You are scoping a product you'll be judged on shipping — be thorough across *all* dimensions, not just the fun ones. Same **infer / ask / recommend** discipline as `/architect`:
- **INFER** what the idea already tells you (product category, obvious capabilities) — don't ask it.
- **ASK** the un-inferable across business, product, and go-to-market — in as many batched rounds as needed (up to 4 questions per round; see *Decision panels*).
- **RECOMMEND** the build approach, the build order, each feature's weight, and which features need an ADR — those are expert calls; present them, don't make the engineer sequence their own backlog.

**`/roadmap` never picks tools.** No provider, library, ORM, host, or BaaS is chosen or named here — that's `/architect`'s job, per feature, in the ADR. If a feature implies a tool choice, that's exactly what makes it `Needs ADR: yes`. Keep the roadmap tool-agnostic so it doesn't rot.

## Decision panels (every user-facing choice)

Every choice you put to the engineer is an **options panel**, never a neutral menu:
- **2–4 concrete options**, each a real answer to *this* product — not placeholders.
- **Exactly one** option marked **`(recommended)`**, with a one-line why. You are the senior engineer; make the call and let them override — never present equal options with no pick.
- Always include a free-text **Other** so they can override with their own answer.
- **Capability-first rendering:** use your agent's interactive option picker (`AskUserQuestion` on Claude Code); if it has none, ask the *same* options as plain text. Batched question rounds follow the same rule — up to 4 per round.

## Artifact ownership

`docs/roadmap/` — the **feature roadmap**, created and maintained by this skill. Clean separation from `/architect`, which owns `docs/adr/` (the ADR files). Other skills find a feature by scanning `docs/roadmap/` for the row that names it.

**The roadmap is a living document, not a pile of dated snapshots.** `plan`, `replan`, and `add` all **edit the roadmap in place** — reconciling and appending, never spawning a new dated file per pass. A small product is a **single file**; a big one is **split by epic** (below). Writes nothing else — no ADR files, no code, no `AGENTS.md`. **`docs/roadmap/` holds roadmap files only** — never inventories, analyses, or research docs (those are decision-support and live *with the ADR*, under `docs/adr/…/research/`, owned by `/architect`).

**File shape — single-file by default, epic-split on demand:**
- **Small product** → one file, `docs/roadmap/roadmap.md` (overview table + per-feature intent/seed blocks + legend).
- **Large product** → **split by epic**, mirroring the ADR umbrella (index + children) and monorepo per-workspace layout: an **`docs/roadmap/index.md`** (epics + order + status rollup) plus one file per epic (`docs/roadmap/auth.md`, `docs/roadmap/checkout.md`, …). **Promote on demand:** start single-file; when it grows past comfortably scanning in one view (roughly a dozen-plus features spanning clearly distinct areas), split the biggest areas into epic files and leave `index.md` as the map. Don't pre-split a small product.

Keep every file **coarse and small** — that's the whole point of splitting. If one epic file is getting long, the fix is finer features and a tighter intent, not a build-task dump.

**Status lifecycle — `/roadmap` sets the *initial* status; the pipeline advances it:**
- New features start **`planned`**. On **brownfield**, `/roadmap` also enrols pre-existing features as **`existing`** (complete) or **`in-progress`** (partial) — the one place `/roadmap` writes a status other than `planned`.
- From there, **`/develop`** advances *pipeline-built* work (`planned` → `in-progress` → `done`) and **`/sync`** reconciles against the diff.
- **`done` ≠ `existing`**: `done` means *this pipeline* built and verified it; `existing` means it predates the workflow. `/develop` and `/sync` never touch `existing` rows.
- **Pivots / de-scoping**: `replan` may set a de-scoped feature to **`dropped`** — it **never deletes rows**. `dropped` keeps history visible and excludes the feature from active counts and work. `/develop` and `/sync` skip `dropped` rows.

**Process weight — a coarse right-sizing attribute (this absorbs the old `/triage`).** Every feature carries a **Weight**: `lean` · `medium` · `full`. It's not a separate skill or step — it's one column that turns downstream process **on or off** for that feature:
- **`lean`** — trivial, low-risk, well-understood → skip design-review and skip `/harden`. Often `Needs ADR: no`.
- **`medium`** — moderate scope or a real decision → normal path.
- **`full`** — high risk, large scope, or compliance-sensitive → **design-review and `/harden` are required**; almost always `Needs ADR: yes`.

`/roadmap` sets an **initial** weight per feature (a coarse call from the same signals `/architect` and `/develop` use); the README's Tiers are the reference for what each weight buys. Downstream skills read this column to decide how much process a feature gets.

**Artifact base.** The roadmap lives under `docs/` by default. If `docs/` is a *published* docs site (`docusaurus.config.*`, `.vitepress/`, `mkdocs.yml`, Astro Starlight, or Nextra detected), use `.workflow/` instead (`.workflow/roadmap/…`). **Always follow whichever base — `docs/` or `.workflow/` — already exists** (paths here assume `docs/`).

**Concurrency & collaboration.** The roadmap is shared across sessions and teammates. **Re-read it immediately before writing** (it may have changed since you last looked); make **surgical** edits (append new rows in order, reconcile the cells that changed, never rewrite the whole file); and if it isn't in the state you expected, **flag rather than clobber**. Append new features with the next free numbers so two people adding features don't collide on a row.

---

## Reference files

- **`roadmap-template.md`** — the structure `/roadmap` writes to: the coarse overview table (with the new columns), the per-feature intent + acceptance-criteria-seeds block (and the derived-tasks note), the epic-split `index.md` and per-epic shapes, the `replan` and `add` outputs, and the `## /roadmap complete` report block. Read it when writing the roadmap and the report.

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows. Detection snippets are POSIX **reference** — use your agent's own cross-platform file tools to look for source files and read/write Markdown. Planning runs inline. Two **optional** subagents are capability-first — spawn them via your agent's subagent tool only where it exists, and degrade to inline otherwise: an optional **read-only code-scan** subagent for brownfield mapping on large repos (a **fast/cheap** model), and an optional **sourcing** subagent that runs **only if the engineer opts into web verified links at the Step 6b References consent**. If your tool has no interactive-question picker, ask every decision panel as plain text with the same options.

## Execution

### Step 0 — Infer intent & idea check

`/roadmap` takes **no subcommand** — you always infer the behavior from the situation (whether a roadmap already exists, and what the argument is). Do the detection in Step 1 (locate the roadmap) first if you need to, then infer:
- **Roadmap exists + no argument** (or a re-run described as "reconcile / what's next") → **replan behavior** (see the *Replan* section) — the normal rhythm after shipping; the engineer just runs bare `/roadmap` again.
- **Roadmap exists + the argument names a single feature** → **add behavior** (see the *Add* section) — enroll one row, no full re-plan; the engineer runs `/roadmap <a feature>`.
- **No roadmap yet + a product-sized idea**, or a request to scope the **next slice** (including brownfield) → **plan behavior**, below.

When intent is ambiguous (e.g. an argument that could be a whole new slice *or* a single feature on an existing roadmap), infer the most likely reading from scope and say which behavior you chose in the report; if truly unclear, ask a one-line clarifying question.

If plan behavior and no idea was provided (`/roadmap` with no argument and no existing roadmap to extend): **stop and ask** before anything else:

"What are you building? Describe the product or the slice of it you want to plan (one or two sentences about what it does and who it's for)."

Wait for the answer. Use it as the product idea.

### Step 1 — Locate the roadmap; greenfield / brownfield / monorepo

Using your agent's own file-search tools, detect (skip `node_modules/` and `.git/`):
- **Any source files** — at least one `.ts`, `.tsx`, `.js`, `.py`, `.go`, or `.rs`. Presence ⇒ brownfield; none ⇒ greenfield.
- **A root `AGENTS.md`** — note whether it exists.
- **An existing roadmap** — look under `docs/roadmap/` for `roadmap.md` (single-file) **or** `index.md` + epic files (split) — and, in a monorepo, under `docs/roadmap/<workspace>/`. Note the shape you find.

**Greenfield** — decompose the whole MVP from scratch, foundations-first (Step 3).

**Brownfield** — read root `AGENTS.md` (and the existing roadmap, if any) so you plan the *next* slice on top of what's there:
1. **Enroll the already-built features** for context — derive them from `AGENTS.md` (its nested-area docs map to existing areas) plus a light code scan, each with a `Code area` pointer. **On a large repo, offload that scan to a read-only exploration subagent** (a **fast/cheap** model with `Read`/`Grep`/`Glob`) that returns a compact map — don't read the tree inline. **Assess completeness honestly from the code**, and set status accordingly — don't just stamp everything done:
   - **Complete & shipped** → **`existing`** (a *distinct* marker — **not** `done`).
   - **Partially built** → **`in-progress`** (so `/develop` can resume it).
   Never mark a half-built feature `existing`.
2. **Plan the next slice** as `planned` rows. Don't re-plan features already complete (`existing`).
   - If there's no root `AGENTS.md`, note in the report that `/audit` should run first to give real context.

**If a roadmap already exists (a re-run) — read the *union*, don't duplicate or fragment:**
- **Read the whole roadmap** — the single file, or `index.md` + every epic file — and build the **full set of features already on it** at *any* status (`planned`, `in-progress`, `done`, `existing`, `dropped`). This is your dedup baseline.
- **Dedup against all of it.** Don't add a feature that already exists in any status. If the request overlaps an existing `planned` feature, **extend that row** (sharpen its intent / seeds) rather than creating a duplicate. Only genuinely-new features get new rows.
- **Reconcile drift.** If you find **shipped work or ADRs no roadmap row covers** (built off-plan), enroll them — completed as `existing`/`done`, unfinished as `in-progress`. Note these as "drift enrolled".
- **State what you found** in the report: how many features already on the roadmap, how many new, how many drift items, and which file(s) you wrote to. (For a full reconcile after shipping, prefer **replan mode**.)

**Monorepo — plan per workspace, don't mix apps in one roadmap.** Detect a monorepo: a workspaces config (`pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `lerna.json`, or `workspaces` in root `package.json`) or multiple app/package manifests under `apps/*` / `packages/*`. If found:
- **Each workspace gets its own roadmap directory**: `docs/roadmap/<workspace>/` (single-file `roadmap.md`, or `index.md` + epics if that workspace is large). Repo-wide planning — monorepo tooling, a shared design system in `packages/ui`, cross-cutting infra — goes in **`docs/roadmap/_root/`**.
- **Scope to the workspace.** `/roadmap web <idea>` plans the `web` app; a bare `/roadmap` on a monorepo **asks which workspace(s)** to plan (or "repo-wide") — as a decision panel. Read **that workspace's** nested `AGENTS.md` for *its* stack/conventions — apps often differ (e.g. web vs api vs mobile), so don't assume one.
- **Each feature's `Code area` points into its workspace** (`apps/web/...`). Foundations are per-workspace, **except** genuinely shared ones (monorepo tooling, a shared UI package) which live in `_root` and the apps depend on.
- **A feature spanning workspaces** → plan it in `_root` (tag its intent by workspace), or split into coordinated per-workspace features. Don't bury cross-app work in one app's roadmap.

### Step 2 — Ask (batched rounds, as decision panels)

Generate questions tailored to *this* idea; infer and skip what's stated. Run as many batched rounds as needed (up to 4 per round; every question is a decision panel per the convention above). Cover:

**Round 1 — product & business.**
- **MVP boundary** — the smallest version that delivers the core value (the most important question; everything hangs off it).
- **Primary audience** — only if unclear from the idea.
- **Monetization** — free / subscription / one-time / usage-based / ads / none yet (shapes whether billing features exist).
- **Success metric** — what "working" looks like (signups, activation, revenue) — informs analytics features.
- **Hard constraints** — deadline, budget, team size, compliance scope. **These shape the phasing recommendation and the per-feature weights.**

**Round 2 — capabilities.** Multi-select of the cross-cutting capabilities the product plausibly needs, tailored to its type — e.g. authentication, multi-tenant orgs, payments/billing, email/notifications, file/media upload, search, realtime, admin panel, public API. Confirm which are in scope for *this* slice vs deferred. Each selected capability becomes one or more features. **Name capabilities, never the tool that implements them** — the tool is `/architect`'s call.

**Round 3 — cross-cutting & go-to-market.** Routinely forgotten, belong in the plan from day one:
- **SEO** — public/marketing pages, metadata, sitemap, structured data, social cards, SSR/SSG needs (skip for purely internal/auth-walled apps).
- **Performance** — Core Web Vitals targets, caching, expected load.
- **Analytics & tracking** — product analytics, error monitoring, conversion events.
- **Accessibility** — WCAG target.
- **Internationalization** — multiple languages/locales, RTL.
- **Legal/compliance** — cookie consent, privacy/terms, GDPR/CCPA, age gating.

Each "yes" becomes its own feature or folds into a relevant feature's acceptance-criteria seeds (e.g. "SEO metadata present" is a seed on each public page; cookie consent is its own feature).

### Step 3 — Choose the build approach (decision panel)

The **build approach** is the most far-reaching call the roadmap makes: it decides how every feature is sliced and sequenced, and — once recorded — the whole pipeline honors it downstream. Don't run a fixed procedure here. As a senior **product engineer**, reason about *this* product — its goal and the Round 1 constraints, and whether it's a proper production build or a throwaway — then present a decision panel of the named approaches, each stated by its **guiding principle** (not its steps), and recommend exactly one:

- **Tracer Bullet**: vertical slices; each feature built end-to-end through every layer, working.
- **Skateboard**: MVP-first; ship the thinnest *usable whole* first, then grow it.
- **Facade**: UI-first; a clickable shell on placeholder data, then wire the back. **Prototype-grade** (fast to demo, not production-complete).
- **Journey**: a complete user path end-to-end per phase.
- **Other** (free text).

**Recommend exactly one — reason it out, don't hardcode the pick or its mechanics.** For a proper production build the default is **Tracer Bullet** (every slice ships something real and complete); shift only when this product's goal calls for it — fast validation of one core loop → **Skateboard**; the experience/funnel *is* the product → **Journey**; the explicit goal is a quick clickable prototype → **Facade** (and say plainly it is prototype-grade, not production-complete). State the one-line why in terms of this product. **Capability-first:** use your agent's interactive picker if it has one; otherwise ask the same options as plain text. Never name a tool — the approach shapes *how* features are built, not *with what*.

**Record it — this is the propagation source.** Write the chosen approach into the **roadmap header** as `Build approach: <name> — <one-line principle>`. It is a **project-wide convention, not just a roadmap note**: `/audit` and `/sync` persist it into the root `AGENTS.md`, and `/architect`, `/develop`, and `/verify` **read and honor it** — so the entire build follows the chosen approach consistently. It also sets the **Phasing** column values for feature rows (which slice / journey each belongs to).

**This header value is the project *default* — any single feature may override it.** Most features inherit it; occasionally one feature is best built a different way (e.g. a clickable Facade prototype of one screen inside an otherwise Tracer-Bullet product). So each feature carries an optional per-feature **Approach** (Step 5) that overrides the default just for that row. **Precedence:** a feature builds by its row **Approach** if one is set, else by the project default. Record an override on a row **only when it differs** from the default — leave the row's Approach empty (inherit) otherwise.

### Step 4 — Foundations-first sequencing (a principle every build approach obeys)

The chosen build approach decides how features are sliced — but **no approach starts a feature slice before the ground it stands on exists**. A working skeleton before features is a principle, not a preference: reason from it the same way whichever approach you recommended. So sequence the roadmap so these lead, each an explicit **foundation feature** (not a sub-task buried in a page). The order below is the reasoned default — a cheaper foundation precedes anything that depends on it. **Crucially, the stack must be decided and the project scaffolded before `/audit` runs**: `/audit` seeds root `AGENTS.md` conventions + tooling *from the real project*, so running it before the project exists is premature — it would capture conventions and tooling for a stack that isn't there yet.

1. **Standards preferences** — the engineer's light, un-inferable standards *preferences* (architecture style leanings, formatting taste). Keep this **light** — it's a preference capture, and it may be folded into the stack feature below rather than its own row. The heavy convention + tooling capture is `/audit`, which comes **after** scaffold. `Needs ADR: no`.
2. **Stack and architecture** — **ONE foundation feature, built like every other feature** (a `Decision (ADR)` sub-task, then a build sub-task), not two separate rows. First `/architect` decides the stack (ARCHITECTURE ADR — this is where tools/providers/frameworks get chosen, and **nothing tooling-related runs before it**); then `/develop` **scaffolds** the project from that decision (framework init, dependency install, directory layout, a runnable dev server/build). `Needs ADR: yes`, weight `medium`+. **The decision ADR records only the decision** — the scaffold steps are derived by `/develop` at build time, **not pre-written into the ADR or the row** (writing them in both places is the double-spec bug). The scaffold sub-task still lands **before `/audit`**, so there is a real project for `/audit` to read.
3. **Coding standards & tooling (`/audit`)** — run `/audit` (greenfield) to capture the engineer's standards into root `AGENTS.md` **and** seed enforcement tooling — now reading the **real, scaffolded project** (its actual stack, structure, and manifests) rather than guessing. `Needs ADR: no` (captured by `/audit`, not designed). **This runs after the stack-and-scaffold feature, never before.**
4. **Data model** — an **explicit, non-skippable foundation feature** (`Needs ADR: yes`). The core entities, relationships, and persistence shape that every later feature builds on. Never fold this into another feature or skip it — a wrong data model is the most expensive thing to redo.
5. **Design system / UI foundation** — `/architect` → `design.md`, then base components (`Needs ADR: yes`) — if the product has meaningful UI. Cross-cutting: every page depends on it.
6. **Walking-skeleton slice** — a **thin vertical slice wired end-to-end** (DB → API → UI), doing **one trivial real thing** (e.g. a single record you can create and see rendered). It proves the whole stack is connected before feature work piles on. Weight `medium`, and it usually leans on the foundation ADRs above rather than needing its own. (Under **Tracer Bullet** this merges with the first real slice — see *Shape the slices to the build approach*.)

**Then** the feature slices, ordered and phased per Step 3. The **Phasing** column marks each row as `Foundation`, `Skeleton`, the slice/journey it belongs to (e.g. `Slice 2`), or `Deferred`; the **Order** column is the integer build sequence across the whole roadmap.

**Shape the slices to the build approach — this changes WHAT the slices are, not just their labels.** The chosen approach (Step 3) decides the **shape** of the decomposition, not only the phase names. A roadmap that lists every capability as its own fully-built feature and then staples `Slice 1 … Slice N` onto them has NOT honored the approach — it is a flat feature list wearing slice stickers. Reason from the approach's principle:

- **Tracer Bullet** → the first post-foundation slice is a **thin thread through the core user journey, end to end**: the smallest path that touches every layer and proves the whole loop works, and nothing more. For a standup app that is *sign in → create a team → submit today's standup on a default template → see it in the team feed*, with no invites, no custom templates, no reminders yet. **This IS the walking skeleton for a Tracer Bullet build** — merge them, don't ship a throwaway skeleton and then a separately-full auth feature. Later slices **thicken one segment** of that already-working thread (member invites, custom templates, reminders, history, search, admin). Never build a full auth feature and a full admin panel before the core loop runs end to end once.
- **Skateboard** → the first deliverable is the **thinnest usable whole** product (a tiny version of the entire thing a real user could actually use); later rows grow it.
- **Journey** → each phase is **one complete user path**, end to end, before the next path begins.
- **Facade** → **UI shells first** on placeholder data, wired to real data later.

**A thin thread leans on shared ADRs, so most rows do NOT each need their own.** The core-loop slice rests on the foundational ADRs (data model, auth), and each thickening step usually extends a decided pattern rather than making a new decision. Still apply the invent-test per row (below), but a Tracer Bullet roadmap should have **far fewer** `Needs ADR: yes` rows than a flat feature list. If nearly every row needs its own ADR, you decomposed into full features instead of slices — go back and re-slice.

### Step 5 — Decompose into coarse feature rows (you reason; don't ask)

From the answers, produce the feature list — foundations first (Step 4), then the slices, then explicitly-deferred nice-to-haves. For **each** feature, set:

- **Keep features small** — one page or one cohesive unit each. A home page and per-segment landing pages are *separate* features; a listing, a product page, and a cart are three, not one "storefront". Finer features make the roadmap honest and progress visible. If a "feature" spans unrelated screens, split it.
- **Intent (1–2 lines)** — what it is and why it matters. The one-liner a teammate reads to know what this row is for.
- **Acceptance-criteria seeds** — a few bullet "definition of done" seeds: the **WHAT**, the observable outcomes that mean this feature works (e.g. "user can filter the list by category and the URL reflects the filter"; "empty and error states render"; "SEO metadata present"). These are **seeds, not a spec** — `/architect` refines them into the ADR's full requirements and acceptance criteria. Don't over-specify; capture the load-bearing outcomes.
- **Weight** — `lean` / `medium` / `full` (see *Artifact ownership*). Set the initial call from risk, scope, and compliance sensitivity.
- **Approach (optional per-feature override)** — defaults to **inherit the project default** (the header's Build approach). Only when a feature is genuinely best built a different way, run a **Build-approach decision panel for THAT feature**: offer **`(recommended) inherit the project default`** as the top option, plus the named approaches (Tracer Bullet · Skateboard · Facade (prototype-grade) · Journey · Other) as overrides. Same decision-panel + capability-first + no-hardcoded-tool conventions as Step 3. **Record the Approach on the row only when it differs from the default**; leave it empty (inherit) otherwise. Precedence: row Approach if set, else the project default.
- **Needs ADR?** — use the *invent-test*: **would building it require a decision the engineer hasn't made?** Flag **yes** when it involves a provider/library choice, a data model, a cross-cutting pattern, the design system, a whole page/screen with no spec yet, or non-trivial behavior (search, filtering, recommendations). Flag **no** only for genuinely pure implementation an existing `design.md`/ADR/convention already covers. When unsure, flag **yes** — an unflagged decision is the expensive miss. A `full`-weight feature is almost always `yes`.
- **One decision per ADR — don't bundle, don't false-flag.** When a feature carries **multiple distinct decisions**, each is its own `Needs ADR: yes` item — don't lump unrelated decisions into one "strategy" ADR. If several genuinely share **one** broad decision that then splits, model it as an **umbrella** and let dependents reference it — but never mark a dependent `no` when it actually carries its own decision.

**No build-task breakdown here — one clear next command per row.** Each feature shows exactly **one** next action on its `> Next:` line: if `Needs ADR: yes`, it is **`/architect <feature>`** (which produces the ADR and, from it, the build tasks); if `Needs ADR: no`, it is **`/develop <feature>`** directly. Write just that single command, nothing more. Do **not** append explanatory clauses like *"build tasks are derived from the ADR when this feature is architected"* (that noise is what made the next step unclear), and do **not** enumerate UI / data-model / API / integration / test sub-tasks — that is `/architect`'s output, per feature, and guessing it here ships a wrong plan. A reader should see one command to run next, full stop.

**Analysis/inventory is not a roadmap row.** Cataloguing duplication, listing call sites, auditing current state — that's **decision-support research** that belongs with the ADR (`/architect` produces it, under `docs/adr/…/research/`). Never plan a row or step that writes a `.md` into `docs/roadmap/`.

### Step 6 — Write the roadmap (single-file or epic-split)

Re-list the roadmap location immediately before writing (a teammate may have changed it), then write to the structure in `roadmap-template.md`:

- **Small product → single file** `docs/roadmap/roadmap.md` (monorepo: `docs/roadmap/<workspace>/roadmap.md`): the coarse overview table (with the brownfield-enrollment rows) + a per-feature intent/seed block for each row + the legend.
- **Large product → epic-split**: `docs/roadmap/index.md` (epics + order + status rollup) + one file per epic (`docs/roadmap/<epic>.md`) holding that epic's feature rows and intent/seed blocks. **Promote to this only when the single file has outgrown a comfortable scan** — otherwise stay single-file.
- **Re-run (living update)** — **edit in place**, don't spawn a dated file: append new rows with the next free `#`, sharpen existing rows' intent/seeds, and leave existing statuses untouched. Set a now-out-of-scope row to `dropped` (never delete). On brownfield, append enrolled `existing`/`in-progress` rows above the `planned` ones.

**Basis on recommendations (only when the engineer opts in).** This is gated by the References consent panel in Step 6b, so ask that panel first (or confirm the chosen level) before you add any citations. If the engineer chose **No references**, add **no `(basis: …)` citations** and **no `## References`** section (the roadmap keeps its intent and reasoning, just with no citation tags, so it reads clean). If they chose **Sources only** or **Sources plus web verified links**, then where the roadmap *recommends* something the engineer didn't dictate (the phasing choice, the order rationale, a suggested capability, flagging a feature `Needs ADR`, a weight call), append a short `(basis: …)`: a **project source** (`your AGENTS.md`, an ADR, the existing stack) or a **named practice** (`vertical slices ship real value early`, `foundations before features`, `data model is the costliest thing to redo`). Inline here you have no web tools, so **name the source or practice, never a URL** (web verified links, if that level was chosen, are added by the Step 6b subagent).

### Step 6b — References consent (one panel, covers sources AND links)

Ask ONE consent question that governs both the `(basis: …)` citations and any reference links, so there is a single clear ask, not two competing ones. Present it as a decision panel (capability-first picker or plain text) and record the outcome as the References level:
- **question**: "Add a References section to the roadmap (where the recommendations come from, and optionally links)? The intent and reasoning stay either way. The links option runs a subagent that web searches and fetches pages to confirm official docs and standards, which costs some extra tokens."
- **header**: "References"
- **options**:
  - `No references, keep it clean (recommended)` (no `## References` section, and no `(basis: …)` citations on the recommendations)
  - `Sources only (named project sources and practices, no web fetch)` (a `## References` section with named project sources and practices, plus `(basis: …)` citations, no links, no subagent)
  - `Sources plus web verified links (fetches pages to confirm the links, costs some extra tokens)` (sources and citations as above, plus web verified links added by a sourcing subagent)
  - Other (free text)

**If they choose No references** (or there is no answer): add **no `## References`** section and **no `(basis: …)`** citations anywhere (this is what the Basis on recommendations note in Step 6 is gated on). The roadmap keeps its intent and reasoning and stays clean. You're done.

**If they choose Sources only** (or the agent has no web tools): add the `(basis: …)` citations (Step 6) and a **`## References`** section naming *Project sources* (verifiable) and *Practices & standards* (named), with **no Links group** and no subagent. You're done.

**If they choose Sources plus web verified links**, add the citations and `## References` as for Sources only, then spawn a **sourcing subagent** (capability-first) so links are *fetched and confirmed*, not fabricated:
- `model`: a **fast/cheap** model (e.g. `haiku` on Claude Code; a light model on other agents) · `description: "Roadmap: source & reference the recommendations"`
- Tools: `Read`, `Edit`, `WebSearch`, `WebFetch`
- `prompt`: give it the roadmap file path(s) and its recommendations. Its job: for the load-bearing recommendations, confirm each `(basis: …)` is sound, and where a **canonical source is worth linking** (an official doc, a named standard/practice), **web search and fetch to confirm it exists and says what's claimed**, then complete the **`## References`** section with a *Links* group (web verified only, else "none verified"). **Never invent a URL.** Keep it lean.
- If the client has no web tools or subagents, degrade to the Sources only behavior (named practices and project sources, no links).

### Step 7 — Report and hand off

Print the completion report using the **`## /roadmap complete`** block in `roadmap-template.md`, filled with this run's specifics.

`/roadmap` does not run `/architect` or `/develop` for you — it hands you the ordered, coarse, weighted list; you walk it feature by feature (architect the `Needs ADR: yes` ones, then build).

---

## Replan (the living rhythm — run after a feature or phase ships)

`replan` is the **default cadence**, not a rare event: run it each time a feature or phase lands to keep the roadmap matching reality and to queue the next slice. It **reconciles in place** — never spawns a new file.

1. **Re-read the whole roadmap** (single file, or `index.md` + epics; the workspace's, in a monorepo) and the code/ADRs for what just shipped.
2. **Reconcile what shipped** — mark completed features `done` (verify from the code/ADR — don't stamp), tick nothing you can't confirm. Where `/develop`/`/sync` already advanced rows, leave them.
3. **Enroll needs that surfaced during the build** — read the shipped features' **ADR `## Consequences` and `## Follow-up`** sections: a follow-up ("add rate limiting", "backfill migration", "the search index we deferred") that isn't yet a roadmap row becomes a **new `planned` row** with an intent, weight, and `Needs ADR?`. This is how the roadmap grows from real build feedback rather than up-front guessing.
4. **Reprioritize / reorder** — with the new rows and what's now known, re-sequence the `Order` and adjust `Phasing` for the not-yet-built work. Foundations stay first; de-scoped work becomes `dropped` (never deleted).
5. **Queue the next slice** — make clear which feature(s) are next (the lowest-`Order` `planned` rows), and whether each is `Needs ADR: yes` (→ `/architect` next) or `no` (→ `/develop`).
6. **Report** via the completion block (mode: replan) — what you marked done, what you enrolled from ADR follow-ups, what you reordered/dropped, and the next step.

Keep it coarse and surgical: reconcile cells and append rows; don't rewrite the file.

## Add (enroll one ad-hoc feature — lightweight)

Inferred when a roadmap already exists and the argument names a single feature — `/roadmap <a feature>` enrolls **one** coarse row without re-planning the product, for a feature the engineer invents mid-stream. There is no `add` subcommand to type.

1. **Re-read the roadmap** and **dedup** — if it already exists in any status, extend that row instead of adding a duplicate.
2. **Ask only what's needed** (a short decision panel if the intent/weight is ambiguous — otherwise infer): the feature's **intent**, its **weight**, and where it sits (its **Order** / **Phasing**).
3. **Offer the per-feature Approach** (Step 5) — top option **`(recommended) inherit the project default`**, plus the named approaches to override. Record an Approach on the row **only if it differs** from the header default; otherwise leave it inheriting.
4. **Set `Needs ADR?`** with the invent-test (Step 5). If yes, its next step is `/architect <feature>`.
5. **Append one row** (next free `#`, status `planned`) with its intent line and a couple of acceptance-criteria seeds — **no build-task breakdown** (derived from the ADR later). In an epic-split roadmap, add it to the right epic file and bump that epic's rollup in `index.md`.
6. **Report** briefly (mode: add): the row added, its weight, its approach (inherited or overridden), whether it needs an ADR, and the next command.

---

## Reference

- **`roadmap-template.md`** — coarse overview table + per-feature intent/seed blocks, epic-split `index.md`/per-epic shapes, replan/add outputs, and the completion report block.
