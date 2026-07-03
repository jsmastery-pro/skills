Roadmap structure `/roadmap` writes to — the templates/examples referenced from `SKILL.md` (sub-task format, the full roadmap Markdown, and the completion report block). These are reference material read while writing the roadmap; all rules and guidance live in `SKILL.md`.

## Standard sub-task table

Standard sub-tasks (drop any that don't apply, add feature-specific ones), **ordered within the feature per the recorded Build approach** (a Tracer Bullet slice runs data→API→UI→integration end-to-end; a Facade prototype front-loads the UI on placeholder data — don't assume one fixed order):

| # | Sub-task | Command + prompt to paste |
|---|---|---|
| 1 | **Decision (ADR)** (only if `Needs ADR? = yes`) | `/architect <feature>: <the specific decisions: composition/sections · provider · data model · behavior>` |
| 2 | **UI (placeholder data)** | `/develop <feature> UI: build to design.md with placeholder data + states` |
| 3 | **Data model** | `/develop <feature> data model: <entities/tables/fields>` |
| 4 | **Backend & API** | `/develop <feature> API: <endpoints/actions/queries>` |
| 5 | **External integration** | `/develop <feature> integration: <provider/webhooks>` |
| 6 | **Data integration** (replace the mock) | `/develop <feature> wire-up: swap placeholder for real data, loading/error/empty states` |
| 7 | **Auth & permissions** | `/develop <feature> permissions: <who can do/see what>` |
| 8 | **SEO & metadata** | `/develop <feature> SEO: title/meta/OG/structured data` |
| 9 | **Validation & edge cases** | `/develop <feature> edge cases: <the failures>` |
| 10 | **Tests** | `/test <feature>` |
| 11 | **Harden** (payments/auth/admin only) | `/harden <feature>` |
| 12 | **Sync conventions** | `/sync` |

Each rendered sub-task is one checklist line: `- [ ] <sub-task name>: `\`<command + prompt>\``. The skill, the order, and the prompt all live in that line. That is the "which skill, in what order, with what prompt" the breakdown must answer.

## Roadmap file structure

Write the chosen file with two parts — an overview table and the detailed breakdown:

```markdown
# Feature Roadmap

_Seeded by /roadmap · status advanced by /develop and /sync. Roadmap files live in `docs/roadmap/` (ADRs are in `docs/adr/`)._

**Build approach (project default):** Tracer Bullet, vertical slices; each feature built end-to-end through every layer, working.
_(The chosen approach (Tracer Bullet · Skateboard · Facade (prototype-grade) · Journey) is recorded here by /roadmap as the project-wide **default** convention: /audit and /sync persist it into root `AGENTS.md`, and /architect, /develop, and /verify read and honor it so the whole build follows it consistently. Any single feature may **override** it via its own **Approach** (column below); precedence is the row's Approach if set, else this default.)_

## Overview

The **Approach** column is the per-feature override: blank/`inherit` = builds by the project default above; a named approach = that feature overrides the default. Record a value only when it differs from the default.

| # | Feature | Priority | Approach | Needs ADR? | Status | Code area |
|---|---------|----------|----------|-----------|--------|-----------|
| 1 | Stack & architecture (decide + scaffold) | P0 | inherit | yes | planned | n/a |
| 2 | Coding standards & tooling (`/audit`) | P0 | inherit | no | planned | n/a |
| 3 | Data model | P0 | inherit | yes | planned | n/a |
| 4 | Design system & UI foundation | P0 | inherit | yes | planned | n/a |
| 5 | Walking-skeleton slice | P0 | inherit | no | planned | n/a |
| 6 | Home page | P0 | inherit | yes | planned | n/a |
| 7 | Segment landing pages | P0 | inherit | yes | planned | n/a |
| 8 | Shop listing (filter & sort) | P0 | inherit | yes | planned | n/a |
| 9 | Product detail page | P0 | inherit | yes | planned | n/a |
| 10 | Cart | P0 | Facade | yes | planned | n/a |
| … | … | … | … | … | … | n/a |

_(Approach example: Cart is prototyped **Facade**-style first to demo the flow, overriding the Tracer-Bullet default; every other row inherits.)_

<!-- Brownfield: already-built features are enrolled here above the planned ones, with status `existing`
     (complete, no breakdown) or `in-progress` (partial, finish via /develop), e.g.
| n/a | Auth | n/a | inherit | n/a | existing | `src/auth/` |
| n/a | Product catalog | n/a | inherit | n/a | existing | `src/catalog/` |
Note: `existing` is not `done`. It predates the workflow. Code area filled; complete ones get no breakdown. -->

_(Granular: home and segment landing are separate features; listing, product, and cart are separate, not one "storefront".)_

## Build order (sequenced per the recorded Build approach)

Foundations always lead (Step 4); the feature phases after them are ordered by the header's **Build approach** (don't hardcode a single sequence). The example below is under **Tracer Bullet** (vertical slices); a Skateboard, Facade, or Journey build phases the same features differently.

**Phase 1, Foundations** (scaffold before audit): standards *preferences* (light; may ride along with the stack feature) → **stack & architecture** (`/architect` decides the stack, then `/develop` scaffolds it from that decision — one feature, two sub-tasks) → coding standards + tooling (`/audit` reads the **real scaffolded project**, then enforcement tooling via `/develop`) → data model (`/architect`) → design system (`/architect` → `design.md` → base components) → walking-skeleton slice. `/audit` and tooling come **after** the stack-and-scaffold feature, never before.
**Phase 2, Slice: home** (end-to-end): data → API → UI → integration → SEO → tests, shipping something real before the next slice
**Phase 3, Slice: shop listing** (end-to-end): filter & sort working against real data, states, tests
**Phase 4, Slice: product detail** (end-to-end) → **Slice: cart** (end-to-end) → … one working slice at a time
**Phase 5, Harden & test**: per feature as it goes live (full-weight features)
_Deferred: advanced search, analytics dashboard_

## Build breakdown

### 1. Stack & architecture (decide + scaffold)  ·  Needs ADR: yes  ·  Approach: inherit  ·  Status: planned
<!-- ONE foundation feature, two sub-tasks: decide the stack (ADR), then scaffold from it. The decision
     ADR records the decision only; the scaffold steps are derived by /develop, not pre-written here or
     in the ADR (that double-spec is the bug). -->
- [ ] Decision (ADR): `/architect stack & architecture: framework, hosting, persistence, auth approach` _(ARCHITECTURE ADR, records the decision only)_
- [ ] Scaffold from the decision: `/develop scaffold: framework init, dependency install, directory layout, runnable dev server/build, per the stack ADR`
- [ ] Smoke-check it runs: `/test` _(dev server boots / build passes)_
> ADR: [0001](../adr/0001-stack-architecture.md) · Code area: n/a · _The scaffold sub-task must land before `/audit`, since `/audit` reads the real project._

### 2. Coding standards & tooling (`/audit`)  ·  Needs ADR: no  ·  Approach: inherit  ·  Status: planned
- [ ] Capture standards + tooling into `AGENTS.md` from the **scaffolded project**: `/audit` _(greenfield, after scaffold: reads the real stack/structure, not a guess)_
- [ ] Set up enforcement tooling: `/develop tooling: ESLint + Prettier + strict tsconfig + husky/lint-staged pre-commit, per the captured standards`
- [ ] Tests: `/test` _(lint/format run clean)_
> ADR: n/a (no decision; conventions captured by /audit, after stack-decision + scaffold) · Code area: n/a

### 6. Home page  ·  Needs ADR: yes  ·  Approach: inherit  ·  Status: planned
- [ ] Decision (ADR): `/architect home page: composition (hero, featured collections, segment entry points), layout, asset strategy`
- [ ] UI (placeholder data): `/develop home page UI: build to design.md with mock collections + placeholder imagery`
- [ ] Data integration: `/develop home page wire-up: swap mock for real featured collections, loading/empty states`
- [ ] SEO & metadata: `/develop home page SEO: title/meta/OG/Organization JSON-LD`
- [ ] Tests: `/test home page`
> ADR: n/a · Approach: inherit (project default) · Code area: n/a

### 10. Cart  ·  Needs ADR: yes  ·  Approach: **Facade** (override)  ·  Status: planned
- [ ] Decision (ADR): `/architect cart: line items, quantity, totals, persistence`
- [ ] UI (placeholder data): `/develop cart UI: clickable cart on mock line items + states`
- [ ] Data integration: `/develop cart wire-up: swap mock for real cart, loading/empty states`
- [ ] Tests: `/test cart`
> ADR: n/a · Approach: **Facade** (overrides the Tracer-Bullet default; demo the flow on placeholder data first, then wire the back) · Code area: n/a

### 7. Segment landing pages  ·  Needs ADR: yes  ·  Approach: inherit  ·  Status: planned
- [ ] Decision (ADR): `/architect segment landing: per-segment layout (dev/gamer/anime), theming, shared vs unique blocks`
- [ ] UI (placeholder data): `/develop segment landing UI: build to design.md, mock per-segment data`
- [ ] Data integration: `/develop segment landing wire-up: real segment catalog, empty states`
- [ ] SEO & metadata: `/develop segment landing SEO: per-segment title/meta/OG`
- [ ] Tests: `/test segment landing`
> ADR: n/a · Approach: inherit (project default) · Code area: n/a

### … (every feature gets its own block with filled-in prompts)

## Legend
- **Status**: `planned` → `in-progress` → `done` (pipeline: /roadmap seeds → /develop builds → /sync reconciles). Plus **`existing`** (a pre-existing feature enrolled by /roadmap for context: built before this workflow; no breakdown; `done` is reserved for pipeline-verified work). Plus **`dropped`** (a de-scoped feature kept for history: set by /roadmap on re-planning; excluded from active work; never deleted).
- **Sub-task checkbox**: `todo` `[ ]` → `done` `[x]`. `/develop` ticks its own sub-tasks as it builds; **`/sync` sweeps the rest** (`/test`, `/harden`, tooling, `/sync`) from repo evidence
- **Needs ADR?**: `yes` → run `/architect` before building · `no` → `/develop` directly
- **Approach**: per-feature override of the header **Build approach** default. `inherit`/blank = project default; a named approach = this feature overrides it. Precedence: row Approach if set, else the default.
- **Priority**: P0 (MVP-critical) · P1 (MVP) · P2 (deferred)
```

## Completion report block

```
## /roadmap complete

**Product**: <one line>
**Behavior**: <plan | replan | add (inferred from the situation, not a typed subcommand)>
**Build approach (project default)**: <name (one-line principle)> · **Per-feature overrides**: <feature → approach, … (or "none (all inherit)")>
**Roadmap file**: <docs/roadmap/NN-name.md> (<created new | merged into latest | new slice (next number) because <reason>>)
**Existing plans read** (re-run): <N files, M features already on the roadmap (or "none (first plan)")>
**Existing features enrolled** (brownfield): <count as `existing` + count as `in-progress` (partial), or "n/a (greenfield)">
**Drift enrolled** (off-plan work found in the code/ADRs): <count, or "none">
**Scope (this plan)**: <N> NEW features to build (deduped against existing), <total sub-task count> build sub-tasks
**Cross-cutting in scope**: <SEO / analytics / i18n / compliance, or "none">
**Build order**: <feature 1> → <feature 2> → …
**First step**: <recommended next command (usually `/architect <first feature>`, or `/audit` first if brownfield has no root AGENTS.md)>
```
