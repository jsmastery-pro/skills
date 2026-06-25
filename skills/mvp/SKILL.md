---
name: mvp
compatibility: Built for Claude Code — uses interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
description: "Use this skill at the very start of a new product, or when planning the next slice of an existing one, to turn a vague idea into a prioritized, super-detailed, buildable roadmap. Run /mvp when you have an idea but don't know what to build first, when starting a greenfield project, or when scoping the next batch of features. Acting as a senior product engineer, it asks comprehensive questions across business, product, development, and go-to-market/SEO, then decomposes the product into features AND breaks every feature down into its ordered build sub-tasks (UI → data model → data integration → auth → SEO/meta → tests), flags which need an architecture decision first, and writes it all to docs/features/index.md. It owns docs/features/index.md. It does NOT design individual features (that's /architect), write code (that's /develop), create ADRs, or write AGENTS.md."
---

## What this skill does

Turns an idea into an ordered, detailed build plan. It is the entry point when the question is *"what do I build, in what order, and what are all the pieces of each?"* — not *"how do I build this one thing?"* (that's /architect and /develop).

1. **Asks comprehensively** — business and product (what it is, who it's for, the MVP boundary, monetization, success metric), capabilities (auth, payments, file upload, search, notifications, admin…), and cross-cutting / go-to-market concerns (SEO, performance, analytics, accessibility, i18n, legal/compliance).
2. **Decomposes into features and orders them** — by dependency and value, flagging which carry a load-bearing decision (`/architect` first) vs pure implementation (`/develop` directly).
3. **Breaks every feature into its build sub-tasks** — the explicit, ordered checklist of pieces (UI page, data model, data integration, auth/permissions, SEO/meta, tests), each pointing at the skill/track that builds it. This is the part that makes the roadmap *actionable*, not just a wishlist.
4. **Writes `docs/features/index.md`** — overview table + per-feature build breakdown + build order.

It does one decomposition pass and hands you a detailed, checkable plan. Walking it — architecting and building each sub-task — is the rest of the workflow.

## Asks vs acts

**Senior product engineer role.** You are scoping a product you'll be judged on shipping — be thorough across *all* dimensions, not just the fun ones. Same **infer / ask / recommend** discipline as /architect:
- **INFER** what the idea already tells you (product category, obvious capabilities) — don't ask it.
- **ASK** the un-inferable across business, product, and go-to-market — in as many batched rounds as needed (up to 4 questions per `AskUserQuestion` call).
- **RECOMMEND** the build order, the per-feature sub-task breakdown, and which features need an ADR — those are expert calls; present them, don't make the engineer sequence their own backlog.

## Artifact ownership

`docs/features/index.md` — created and maintained by this skill. On a brownfield repo where it already exists, **merge**: add new features/sub-tasks, never clobber existing rows or rewrite their status. Writes nothing else — no ADRs, no code, no AGENTS.md.

Status lifecycle other skills advance: `/mvp` seeds sub-tasks as **todo**; `/develop` flips one to **in-progress**/**done**; `/sync` reconciles after a change ships.

**Artifact base.** The roadmap lives under `docs/` by default. If `docs/` is a *published* docs site (`docusaurus.config.*`, `.vitepress/`, `mkdocs.yml`, Astro Starlight, or Nextra detected), use `.workflow/` instead (`.workflow/features/index.md`). **Always follow whichever base — `docs/` or `.workflow/` — already exists** (paths here assume `docs/`).

**Concurrency & collaboration.** The roadmap is shared across sessions and teammates. **Re-read it immediately before writing** (it may have changed since you last looked); make **surgical** edits (append new rows in order, never rewrite the file); and if it isn't in the state you expected, **flag rather than clobber**. Append new features with the next free numbers so two people adding features don't collide on a row.

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows. Detection snippets are POSIX **reference** — use your agent's own cross-platform file tools to look for source files and read/write Markdown. This skill runs inline (no subagent). If your tool has no interactive-question picker, ask the multiple-choice prompts as plain text with the same options.

## Execution

### Step 0 — Idea check

If no idea was provided (`/mvp` with no argument): **stop and ask** before anything else:

"What are you building? Describe the product or the slice of it you want to plan — one or two sentences about what it does and who it's for."

Wait for the answer. Use it as the product idea.

### Step 1 — Greenfield or brownfield?

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.py" \
  -o -name "*.go" -o -name "*.rs" \) -not -path '*/node_modules/*' -not -path '*/.git/*' | head -1
[ -f AGENTS.md ] && echo "has root AGENTS.md"
[ -f docs/features/index.md ] && echo "has roadmap"
```

- **Greenfield**: decompose the whole MVP from scratch.
- **Brownfield**: read root `AGENTS.md` and the existing `docs/features/index.md` if present, so you plan the *next* slice on top of what's already shipped — never re-list shipped features. If there's no root `AGENTS.md`, note in the report that `/audit` should run first to give later steps real context.

### Step 2 — Round 1: product & business (generate, then `AskUserQuestion`)

Generate questions tailored to *this* idea; infer and skip what's stated. Cover:
- **MVP boundary** — the smallest version that delivers the core value (the most important question; everything hangs off it).
- **Primary audience** — only if unclear from the idea.
- **Monetization** — free / subscription / one-time / usage-based / ads / none yet (shapes whether payments/billing features exist).
- **Success metric** — what "working" looks like (signups, activation, revenue) — informs analytics features.
- **Hard constraints** — deadline, budget, team size, compliance scope.

### Step 3 — Round 2: capabilities (generate, then `AskUserQuestion`)

Multi-select of the cross-cutting capabilities the product plausibly needs, tailored to its type — e.g. authentication, multi-tenant orgs, payments/billing, email/notifications, file/media upload, search, realtime, admin panel, public API. Confirm which are in scope for *this* slice vs deferred. Each selected capability becomes one or more features.

### Step 4 — Round 3: cross-cutting & go-to-market (generate, then `AskUserQuestion`)

These are routinely forgotten and belong in the plan from day one. Ask which apply:
- **SEO** — public/marketing pages, metadata, sitemap, structured data, OG/social cards, SSR/SSG needs (skip for purely internal/auth-walled apps).
- **Performance** — Core Web Vitals targets, image optimization, caching, expected load.
- **Analytics & tracking** — product analytics, error monitoring, conversion events.
- **Accessibility** — WCAG target (the `/develop` UI track enforces AA by default; confirm if stricter).
- **Internationalization** — multiple languages/locales, RTL.
- **Legal/compliance** — cookie consent, privacy policy/terms, GDPR/CCPA, age gating.

Each "yes" becomes either its own feature or a sub-task attached to relevant features (e.g. SEO/meta is a sub-task of each public page; cookie consent is its own feature).

### Step 5 — Decompose and break down (you reason; don't ask)

**5a — Feature list.** From the answers, produce features ordered by dependency and value. Foundations first (data model, auth, multi-tenancy), then dependents, then explicitly-deferred nice-to-haves. Flag each `Needs ADR?` — **yes** for a load-bearing choice (provider, data model, architecture), **no** for pure implementation an existing convention/design system covers.

**5b — Per-feature build breakdown.** This is what makes the roadmap actionable. For **each** feature, generate its ordered build sub-tasks. Use this standard template, dropping rows that don't apply and adding feature-specific ones:

| Order | Sub-task | Built by | Notes |
|---|---|---|---|
| 1 | **Decision (ADR)** — only if `Needs ADR? = yes` | `/architect` | settle provider / data model / pattern |
| 2 | **Data model** — schema, migrations, entities | `/develop` (logical) | |
| 3 | **Backend logic & API** — services, endpoints, business rules | `/develop` (logical) | |
| 4 | **External integration** — provider/webhooks (if any) | `/develop` (logical) | |
| 5 | **UI pages/components** — the screens | `/develop` (UI) | needs design.md + assets |
| 6 | **Data integration** — wire UI ↔ API, loading/error/empty states | `/develop` | |
| 7 | **Auth & permissions** — who can do/see what | `/develop` (logical) | |
| 8 | **SEO & metadata** — only for public pages | `/develop` (UI) | title, meta, OG, structured data |
| 9 | **Validation & edge cases** — limits, failures, concurrency | `/develop` | |
| 10 | **Tests** | `/test` | |
| 11 | **Sync conventions** | `/sync` | promote decisions into AGENTS.md |

Recommended build order within a feature: **data → backend → integration → UI → wire-up → harden → test**. (UI can start in parallel against a stub once the API shape is in the ADR.)

### Step 6 — Write `docs/features/index.md`

Create (or merge into) the roadmap with two parts — an overview table and the detailed breakdown:

```markdown
# Feature Roadmap

_Seeded by /mvp · status advanced by /develop and /sync._

## Overview

| # | Feature | Priority | Needs ADR? | Status | Code area |
|---|---------|----------|-----------|--------|-----------|
| 1 | Auth & identity | P0 | yes | planned | — |
| 2 | Billing | P1 | yes | planned | — |
| 3 | Marketing site | P0 | no | planned | — |

## Build order

1. Auth & identity — foundational, everything gated depends on it
2. Marketing site — public, can run in parallel
3. Billing — after auth
4. _Deferred: advanced search, analytics dashboard_

## Build breakdown

### 1. Auth & identity  ·  Needs ADR: yes  ·  Status: planned
- [ ] Decision (ADR) — provider + session model — `/architect`
- [ ] Data model — users, sessions, roles — `/develop` (logical)
- [ ] Backend & API — sign-in/up/reset, session handling — `/develop` (logical)
- [ ] Integration — wire auth provider + webhooks — `/develop` (logical)
- [ ] UI — sign-in / sign-up / reset / verify pages — `/develop` (UI)
- [ ] Data integration — wire forms ↔ API, error/loading states — `/develop`
- [ ] Permissions — route guards, role checks — `/develop` (logical)
- [ ] SEO/meta — `noindex` auth pages — `/develop` (UI)
- [ ] Tests — `/test`
- [ ] Sync — record auth conventions in `src/auth/AGENTS.md` — `/sync`
> ADR: — · Code area: —

### 2. Billing  ·  Needs ADR: yes  ·  Status: planned
- [ ] … (same shape, tailored)

## Legend
- **Status**: `planned` → `in-progress` (set by /develop) → `done`
- **Sub-task checkbox**: `todo` `[ ]` → `done` `[x]` (advanced by /develop / /test / /sync)
- **Needs ADR?**: `yes` → run `/architect` before building · `no` → `/develop` directly
- **Priority**: P0 (MVP-critical) · P1 (MVP) · P2 (deferred)
```

On a brownfield merge: append new features/sub-tasks; leave existing rows and checkbox states untouched.

### Step 7 — Report and hand off

```
## /mvp complete

**Product**: <one line>
**Scope**: <N> features (<P0 count> P0, <deferred count> deferred), <total sub-task count> build sub-tasks
**Cross-cutting in scope**: <SEO / analytics / i18n / compliance — or "none">
**Roadmap**: docs/features/index.md
**Build order**: <feature 1> → <feature 2> → …
**First step**: <recommended next command — usually `/architect <first feature>`, or `/audit` first if brownfield has no root AGENTS.md>
```

`/mvp` does not run `/architect` or `/develop` for you — it hands you the ordered, broken-down list; you walk it sub-task by sub-task.
