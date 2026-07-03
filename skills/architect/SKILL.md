---
name: architect
compatibility: Built for Claude Code — uses subagents, model selection, and interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Task, AskUserQuestion
description: "Use this skill to make and document an architectural or technical decision before writing code. Run /architect when facing a meaningful choice between approaches, designing a feature or page from scratch, choosing a tech stack, or when /develop says a decision is owed. A Staff/Principal Engineer that challenges bad directions, names anti-patterns, asks deep feature-specific questions, and recommends the right answer rather than a neutral menu — then writes a complete-build-spec ADR to docs/adr/ for your confirmation. Owns all ADR files."
---

## What this skill does

Runs a structured discovery process, weighs options, and writes or updates an Architecture Decision Record (ADR) in `docs/adr/`. Works across four modes:

| Mode | When | Subagent behaviour |
|---|---|---|
| `FEATURE` | Designing a new feature from scratch, with or without existing code | First-principles design, best practices, minimal code reading |
| `ARCHITECTURE` | Choosing a tech stack or foundational architecture for a new project | Comprehensive stack evaluation, industry patterns, no code to read |
| `ENHANCEMENT` | Improving, replacing, or scaling something that already exists | Read existing code + ADRs, focused option comparison |
| `CROSS-CUTTING` | Standardising a pattern across the whole codebase (error handling, logging, auth, naming) | Sample current state, define the standard precisely, recommend enforcement |

- **Create**: new decision → new ADR with status `Proposed`
- **Update**: evolving an existing decision → edit existing ADR in place
- **Supersede**: replacing a past decision → new ADR + update old ADR's status line

**ADR status behaves in one of two ways, decided by whether a buildable roadmap feature links to the ADR** (a `docs/roadmap/` row whose `ADR` cell points to it):

- **Feature-linked ADR** (a typical FEATURE/ENHANCEMENT, or an ARCHITECTURE foundation that HAS a roadmap row) → **status mirrors the feature lifecycle.** /architect creates the ADR as `Proposed` and owns its *content*, but does **not** advance its status thereafter — the status line tracks the feature's build lifecycle: /develop advances it to `In Progress` when the feature goes in-progress, then to `Accepted` when the feature is built and verified (roadmap `done`). So /architect does **not** set `Accepted` on the engineer's confirmation — confirmation ratifies the ADR content, but `Accepted` means the feature has shipped.
- **Standalone decision ADR** (a foundational/stack or cross-cutting standard **not tied to a single buildable feature** — no roadmap row links it) → **decision-status.** There is no build phase to gate on, so ratification *is* the deliverable: it's `Proposed` when written, then **`Accepted` once the engineer ratifies it** (on confirmation — the decision is now in force). It is NOT feature-mirrored, and /develop does not advance it.

An ADR **documenting already-shipped work** (the "already built" path, or a feature that's already `existing`) describes reality that already exists, so it's born **`Accepted`**.

Does not write code. Does not update the `AGENTS.md`/`CLAUDE.md` context files (/sync owns that).

## Asks vs acts

Asks targeted questions before spawning any subagent — but **spends the question budget on substance, not ceremony.** Every question is sorted into one of three buckets:

- **INFER** — anything the prompt or codebase already reveals: feature-vs-architecture, the stack in use, whether UI is in scope, an already-chosen provider. **Do not ask these** — derive them. Asking what you can read wastes the engineer's attention and reads as incompetent.
- **ASK** — only what the engineer alone knows: requirements, preferences, business rules, compliance scope. This is what the staged conversation is *for*.
- **RECOMMEND** — anything expertise can settle: which provider/library/pattern is best for their constraints. **Decide it and propose** — state the pick, a one-line why, and the runner-up, and let them override. Never present a neutral menu, never silently decide for them.

**Grill the engineer on the feature — ask a lot, and make every question feature-specific.** This is the heart of the skill: pin down the feature's data model, business rules, behavior, scale, library/provider choice, and (when UI is involved) what each screen contains and which sections it has. Generate the questions from *this* feature — an auth feature and a reviews feature share none — and keep asking, in as many batched rounds as it takes, until the ADR is a complete build spec. **The less the engineer specified, the more you ask.** Framing (stack, platform, team/constraints) you *infer* from `AGENTS.md` and the codebase rather than ask — spend the whole question budget on the feature itself.

**Recommendations align with the stack already in use** — if the project runs on a BaaS, prefer its auth/storage over a new external tool; reuse beats sprawl. Works for **web or mobile** alike — infer the platform, never assume web.

## Artifact ownership

**ADR files** in `docs/adr/`, created or updated by this skill only — plus any **research it produces** (inventories, audits) which live **beside the ADR they inform**, never in the roadmap folder. (The roadmap lives separately in `docs/roadmap/` and is owned by `/roadmap` — not an ADR.)

Two independent choices — **where** the ADR lives (repo shape) and **what shape** it takes (decision size):

- **Location = repo shape.** Single repo → `docs/adr/`. Monorepo → `docs/adr/<workspace>/` for a workspace decision, `docs/adr/_root/` for a repo-wide one (mirrors the roadmap). Numbering is **per location** (scan that dir for the next `NNNN`). Call the resolved location `$ADR_DIR`.
- **Shape = decision size, and applies the SAME in a single repo or a monorepo.** A simple decision is a single file, `$ADR_DIR/NNNN-title.md`. A **broad "strategy/foundation" decision that splits into multiple related sub-decisions** — regardless of repo type — becomes a **directory**: `$ADR_DIR/NNNN-<umbrella>/index.md` (the umbrella) + child ADRs (`NNNN-<child>.md`) + a `research/` subfolder for supporting inventories. Default to a single file; use the **directory shape whenever there are child decisions *or* bulky supporting research** — the directory is warranted by children *or* research, not children alone (a big single-decision audit gets `docs/adr/0001-dedup-strategy/{0001-dedup-strategy.md, research/…}` too).

  **Every file is discoverable from the decision that owns it — no orphan research.** In a directory ADR:
  - the **top file** (`index.md` for an umbrella; the ADR file itself for a single decision) opens with a **`## Structure`** manifest that lists and links **every** child ADR and **every** research file — one line each: what it is + which decision it supports — so reading it maps the whole directory.
  - each **child ADR** links its own evidence in a **`## References`** section.
  - **research filenames are prefixed by the child they support**: `research/NNNN-<topic>.md` (matching the child's number), or `research/_shared-<topic>.md` for umbrella-wide evidence. So a developer building child `0001` reads `0001-*.md`, follows its `## References`, and the `0001-` prefix confirms which research is theirs.
  - **Children stay flat by default; promote on demand.** A child is a flat file (`0001-payment-provider.md`); promote it to its own folder (`0001-payment-provider/{index.md, research/…}`) **only when it accumulates multiple research/asset files**. Most children stay flat — nesting is the exception (avoids overloading `index.md` and deepening the tree for nothing).
  - **The child ADR is self-sufficient to build from; `research/` is optional depth** — the evidence/audit trail, not required reading. `/develop` builds from the child ADR and opens a research file only when it needs the underlying data, so research isn't loaded into context by default. **Cross-child contracts** (how two children connect) live in the umbrella `index.md`, so a task spanning two children gets the glue from the one map it already read.
- **One narrow exception into the roadmap:** after the ADR is confirmed, it fills in the matching feature's `ADR` pointer cell in `docs/roadmap/…` **and writes the derived, AC-tagged build tasks (from the ADR's `## Build plan`) into that feature's sub-tasks** — the pointer, the sub-tasks, and the "Decision (ADR)" checkbox, nothing else (the feature's **status** stays `/roadmap`/`/develop`/`/sync`). With no matching row, the tasks stay in the ADR's `## Build plan` and /architect offers to enroll a row (see the derive-tasks step).

**Artifact base.** ADRs live under `docs/` by default. If `docs/` is a *published* docs site (`docusaurus.config.*`, `.vitepress/`, `mkdocs.yml`, Astro Starlight, or Nextra detected), use `.workflow/` instead (`.workflow/adr/`) so workflow files don't ship to the site. **Always follow whichever base — `docs/` or `.workflow/` — already exists** (paths in this skill assume `docs/`).

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows:
- **Commands**: `git` is the only required CLI and behaves the same on every OS. Other shell snippets (`mkdir -p`, `date`, `find`, `ls`, `cat`, `wc`) are POSIX **reference**, not literal scripts — use your agent's own cross-platform file tools (read, search/glob, write, create-dir) and your knowledge of today's date instead. Creating `docs/adr/` should use your write tool, not `mkdir`.
- **Bundled files**: the fallback question files (`questions/*.md`), `agent-prompt.md`, and `adr-template.md` are referenced by paths relative to this skill's folder. The main agent reads them; the **ADR template text is injected into the subagent prompt** (subagents can't resolve skill-relative paths).
- **No subagent / interactive-question support?** The spawn-a-subagent steps assume a subagent capability, and the multiple-choice rounds assume an interactive picker (use whatever your agent provides — a subagent, per-step model selection, an options picker — and fall back only where it doesn't). On a tool without them: do the research/drafting inline yourself, and ask the question rounds as plain text with the same options.

## Execution

### Step 0 — Topic check (before pre-flight)

If no design topic was provided (the engineer ran `/architect` with no argument or an empty description): **stop and ask before doing anything else**:

"What design decision do you want to work through? Describe the feature, system, or choice you need to design in one or two sentences."

Wait for their answer. Use it as the design topic before running pre-flight.

---

### Pre-flight (main model)

Run these steps (the `git` commands are literal and behave the same on every OS; everything else, do with your agent's own file tools):

- **Freshness (teams):** if behind the remote, a teammate may have added ADRs or changed this feature. `git fetch` quietly, pick the base branch (use `main` if `git rev-parse --verify main` succeeds, otherwise `master`), then count commits behind with `git rev-list --count HEAD..origin/<base>`. If the count is >0, warn "pull first" before deciding.
- **Resolve the ADR location** = the roadmap workspace, mirrored into `docs/adr/`: single repo → `docs/adr/`; monorepo workspace → `docs/adr/<workspace>/`; repo-wide → `docs/adr/_root/`. (Determine `<workspace>` the same way as the roadmap — from the topic/path/roadmap row. Call it `ADR_DIR`.) Create that directory with your write tool if it doesn't exist.
- **Today's date** — use today's date (inject it into the ADR).
- **List existing ADRs IN THIS LOCATION** — using your file tools, list the ADR files in `$ADR_DIR` (files named `NNNN-*.md` plus any `index.md`), for numbering and detecting related decisions (numbering is per-location).
- **Check if the codebase has source files** — using your file tools, count the source files (e.g. `.ts`, `.tsx`, `.js`, `.py`, `.go`, `.rs`, `.java`), excluding `node_modules/`, `.git/`, and `dist/`. This informs how much reading the subagent should do.
- **Read project context** — this is the source of truth for the stack and the project's community skills. Read root `AGENTS.md` (fall back to `CLAUDE.md`, else MISSING), AND the nested `<area>/AGENTS.md` for this feature's area if one exists (e.g. `src/auth/AGENTS.md` for an auth feature).
- **Read the project's build approach** — the delivery strategy that governs how work is sliced into increments, and therefore how you order and slice the ADR's `## Build plan`. Look for it in **root `AGENTS.md` first**; if it isn't there, check the **roadmap header** (`docs/roadmap/`). A project records one of a family of approaches — **Tracer Bullet** (thin vertical slices that run end-to-end through every layer), **Skateboard** (ship the thinnest usable *whole* first, then grow it), **Facade** (stand up the UI shell first and wire the backend behind it later — a prototype path), **Journey** (deliver one complete user path per phase) — or a project-specific variant. **Carry whatever you find into the subagent** so the Build plan reflects it. If nothing is recorded, **note the assumption** and let your Staff/Principal judgment set the default (prefer end-to-end / Tracer-Bullet slices for production work). Don't apply a fixed per-approach recipe — you reason about what the approach implies for *this* feature when you derive the Build plan.
- **Locate the linked roadmap feature row (if any)** — cheaply scan `docs/roadmap/` filenames/headings (incl. per-workspace subdirs) for a row matching this topic; open only the single numbered file that contains it. If found, read that row's **intent + any acceptance-criteria seeds** — these seed **Stage (a)** below — and remember the file/row for the derive-tasks and linking steps. This also settles the ADR's status model (feature-linked vs standalone). If no row matches, note it (standalone-decision path) and don't create one now.
- **(Optional)** list installed skills dirs for AVAILABILITY only — `.claude/skills/`, `.agents/skills/`, `skills/`. Relevance is decided by AGENTS.md + the feature, not by name-matching this list.

From the ADR list (all paths below are relative to `$ADR_DIR`, the resolved location):
- **Next number**: highest existing number in `$ADR_DIR` + 1, zero-padded to 4 digits; `0001` if none. (An umbrella directory `NNNN-<x>/` counts as one number.) **Collision guard (teams):** re-list `$ADR_DIR` immediately before the subagent writes; if the chosen `NNNN` already exists, bump to the next free number. **Never overwrite an existing ADR** — after writing, confirm no concurrent run took the same number.
- **Filename / shape**: kebab-case slug from the topic — max 5 words, no articles, lowercase.
  - Simple decision → `$ADR_DIR/NNNN-kebab-title.md`.
  - **Umbrella** (splits into ≥2 related sub-decisions + research) → a directory `$ADR_DIR/NNNN-kebab-title/` with `index.md` (the umbrella decision, listing its children), child ADRs `NNNN-child.md` inside it, and any inventories/audits under `$ADR_DIR/NNNN-kebab-title/research/`. Decide this from the topic's breadth *before* the subagent writes; tell the subagent to use the directory shape.
- **Related ADRs**: read the first 20 lines of each existing ADR — enough to capture the title, status, and opening paragraph of Context — to check for overlap with the current design topic. Flag any that match.
- **Child-of-umbrella detection**: if the topic is a **sub-decision of an existing umbrella** (`$ADR_DIR/NNNN-<umbrella>/`) — e.g. a new decision that surfaced while building under it — place the new ADR **inside that directory** as the next child (`NNNN-child.md`) and add it to the umbrella's `index.md` list, rather than creating a new top-level ADR. This is also the path when `/develop` hits a decision mid-build: it routes here, and the child lands under its parent. Tell the engineer where it's going.
- **Update/supersede detection**: if any existing ADR clearly overlaps the current design topic (same domain, same system, same decision), **before the staged conversation**, present it to the engineer via a **decision panel** (options + free-text Other; plain-text options where the agent has no picker): "I found an existing ADR that may overlap: `[path]` — [title]. How should I treat this?" — options: **New decision — create a new ADR** · **Update the existing ADR in place** · **Supersede it — a new ADR replaces it**. Pre-select the "(recommended)" option by how strongly it overlaps (near-identical → Update or Supersede; adjacent → New). On update/supersede: set OPERATION accordingly, read the existing ADR in full, and skip the staged conversation for in-place updates.

**Community skills — read them from the project's `AGENTS.md`, not from a hardcoded name table** (skill names and stacks change). `AGENTS.md` is the source of truth for what the project uses: project-wide skills/conventions in **root `AGENTS.md`**, area-specific ones in the relevant **nested `<area>/AGENTS.md`** (maintained by `/audit` and `/sync`). So:

1. **Read root `AGENTS.md` and the nested `AGENTS.md` for this feature's area** (e.g. `src/auth/AGENTS.md` for an auth feature, `src/payments/AGENTS.md` for billing). These tell you the stack and which community skills the project relies on.
2. **Load only the skills relevant to *this* feature** — for each one those context files reference that bears on the feature, read its `SKILL.md` and inject its conventions into the subagent. Don't pull in skills the feature doesn't touch.
3. **(Available ≠ relevant.)** You may also list the installed skills dirs (`.claude/skills/`, `.agents/skills/`, `skills/`) to see what's *available* — but relevance is decided by the feature + `AGENTS.md`, not by name-matching a list. If a clearly-relevant skill is installed but **not yet referenced in `AGENTS.md`**, use it anyway and flag (ADR Follow-up) that it should be added to the right context file — **root** if it's project-wide, **nested `<area>/AGENTS.md`** if it's specific to one area.
4. **This is load-bearing for your recommendation.** Whatever the context files show the project already uses (a BaaS, an ORM, a payment provider, an auth library) is what your library/provider recommendation must build on or prefer — not an unrelated external tool. If a genuinely-better option isn't installed, note it as an ADR Follow-up suggestion rather than silently assuming it.

**Workflow skills** (never treat as community skills): `audit`, `architect`, `roadmap`, `develop`, `verify`, `test`, `review`, `harden`, `document`, `debug`, `sync`, `status` — add new workflow skills here as they're created.

---

### Scope validation (before Framing)

Before any questioning, run these two checks **in order**. Check B must run before Check A.

---

**Check B — "Already built" detection (runs first)**

Scan the design topic for phrases signalling an existing decision: "I built", "we built", "we're using", "we use", "I use", "we chose", "I chose", "already using", "already built", "just document", "document the decision we made", "decided to use", "we went with", "we're on".

If found: before anything else, tell the engineer:
present a **decision panel** (plain-text options where the agent has no picker): "This sounds like an existing decision you want to *document* rather than explore from scratch." — options: **Document it — write the ADR from what you tell me (recommended)** · **Go through the full design process** (+ Other).

If they reply `yes`:
1. Ask these three plain-text questions (not MCQ — the engineer types free text):
   - "What alternatives did you consider before choosing this approach? (Even if briefly — 'we looked at X and Y but went with Z' is enough.)"
   - "What was the main reason you chose this over the alternatives?"
   - "What tradeoffs is the team accepting with this decision? What does it make harder?"
2. Wait for their answers.
3. Take the **documentation path**: skip the staged conversation. Inject their answers as `DOCUMENTATION_CONTEXT` alongside the design topic, and inject the staged-answers slot as `"skipped — documenting an already-made decision"`. Still infer and inject the **framing** (MODE, platform, stack) from the topic + `AGENTS.md`.
4. Spawn the subagent with a note: "This is a documentation task. DOCUMENTATION_CONTEXT contains the engineer's account of the decision. Read existing code if SOURCE_FILE_COUNT > 0 to verify and supplement. Write the ADR documenting what was built — not re-evaluating options. Because this describes work that is **already shipped**, set the ADR's `**Status**:` to **`Accepted`** at creation (not `Proposed`) — the same applies whenever the linked roadmap feature is already `existing` (shipped, pre-workflow)."

If they reply `no`: proceed to Check A, then Framing and the staged conversation normally.

---

**Check A — Product vision vs. specific decision (runs second)**

A design topic is **product-scoped** if:
- It describes what the product *is* rather than what to *decide* (e.g. "a B2B SaaS that manages teams", "a marketplace for freelancers", "a social app for cyclists")
- No specific technical component, feature, or technology choice is named
- It would require 5+ separate ADRs to fully capture
- It uses business/product language, not engineering component language

A design topic is **decision-scoped** if it names a specific component, feature, or technical concern (e.g. "auth approach", "notification service", "team invitations feature", "should we use PostgreSQL or MongoDB").

**If product-scoped**: do not start the staged conversation yet. Instead:

1. Tell the engineer: "This describes a full product — /architect works one decision at a time. Let me help you pick the first foundational decision."
2. Generate 4 **foundational first-decision** options tailored to the product type and present these as your agent's interactive option picker (`AskUserQuestion` on Claude Code) — or as plain-text options with the same choices if it has none (question: "Which foundational decision should we design first?", header: "First decision"). For most products these are the tech stack/architecture, the auth/identity approach, the core domain data model, and the single most important product-specific concern — worded for what the engineer described.
3. After the engineer selects: update the design topic to that specific decision and proceed to Framing.

---

### Framing — infer, don't interrogate (no fixed question round)

**Infer** the framing from the topic + `AGENTS.md` + codebase — don't ask it (these aren't feature questions, and asking them wastes the budget). State it back in a line or two so a wrong read is cheap to correct, then spend all your questions on the feature:

- **Mode** — `FEATURE` (new feature) · `ARCHITECTURE` (foundational stack) · `ENHANCEMENT` (changing something that exists) · `CROSS-CUTTING` (a project-wide standard). Infer from the topic and whether the thing already exists in the code. Confirm only if genuinely ambiguous.
- **Platform** — web · mobile · API/backend · a mix. Infer from the stack in `AGENTS.md` (**never assume web**) — it changes the questions (mobile auth, offline, push differ from web).
- **Workspace (monorepo)** — if this is a monorepo (workspaces config, or `apps/*`/`packages/*` manifests), identify **which workspace** this feature belongs to (from the topic, the path, or the roadmap row's `Code area`; ask if unclear). Read **that workspace's** nested `AGENTS.md` for *its* stack — apps in a monorepo often differ (Next.js web, Go api, React Native mobile), so don't assume the root stack. Note the workspace in the ADR's Context (and whether the decision is app-specific or repo-wide).
- **Stack & conventions** — language, framework, DB, and the community skills the project uses, from `AGENTS.md` (the target workspace's, in a monorepo) — inferred, never asked.
- **Constraints** — team size, scale, and compliance: infer from `AGENTS.md` / the product. Raise a **per-feature** compliance question only when *this* feature touches regulated data (payments, PII, health) — not as a generic deadline/team menu.

State it: *"Reading this as a new **FEATURE** on your existing stack (from `AGENTS.md`), web — correct me if not."* Then begin the **staged design conversation** (below).

---

### Staged design conversation — gated, acceptance-criteria-first (main model)

The design is **not one long question dump** — it's an **ordered sequence of stages**, each ending in a **GATE**: you PROPOSE a strong opinion, SHOW it, and the engineer signs off via a **decision panel** before you move on. **No vital stage is silently decided or skipped** — the **data model** and the **tool choice** especially are shown and signed off, never buried in prose. What you build together, stage by stage, becomes the ADR's `## Requirements` (the acceptance-criteria spine) and `## Build plan`. **Generate everything from *this* feature** — never a fixed list; an auth feature and a reviews feature share no questions.

**Decision-panel convention — every user-facing choice is a panel.** Present every gate and every choice as an options panel: **2–4 options, exactly ONE marked "(recommended)"** with a one-line why (**never a neutral menu**), plus a free-text **"Other"** so the engineer can redirect. **Capability-first:** use your agent's interactive picker (`AskUserQuestion` on Claude Code); where the agent has no picker, degrade to the **same options as plain text**. This governs every stage gate, the stack drill-down, the web-assistance gate, and the final ADR confirmation.

**Still infer, don't interrogate.** Framing (mode, platform, stack, constraints) is inferred as above — the stages spend the budget on what only the engineer knows (requirements, rules, scope) and what expertise must settle (provider/pattern). Within each stage, sort every dimension **INFER / ASK / RECOMMEND** (see *Asks vs acts*): **INFER** silently from the prompt/codebase/`AGENTS.md`; **ASK** the engineer only what they alone know; **RECOMMEND** by proposing your pick (state it + one-line why + runner-up, never a blank menu). The gate confirms the whole stage at once.

**Your mandate (senior+ role):** you are the Staff/Principal engineer who will be blamed if this feature ships wrong. The ADR you produce is the **complete build spec** `/develop` implements from — every load-bearing decision must be settled here. Any dimension you leave blank becomes a question `/develop` is forced to ask mid-build, or worse, an assumption it guesses wrong. **Leaving a gap is the failure mode.** So be exhaustive, not minimal — cover *everything* a senior engineer would pin down before writing code.

**Before the stages — enumerate every load-bearing dimension of this feature and assign each to the stage that owns it,** so nothing load-bearing falls between stages. Walk this checklist (not all apply to every feature; add any feature-specific ones), sorting each INFER / ASK / RECOMMEND:

- **Functional scope & boundaries** — what's in, what's explicitly out, the key user flows and their happy/unhappy paths
- **Data model & persistence** — entities, fields, types, nullability, relationships, indexes, uniqueness, retention/deletion
- **Lifecycle & state machine** — states, valid transitions, who/what triggers each
- **API / interface surface** — endpoints or actions, inputs, outputs, status codes, versioning
- **Authentication & authorization** — who may do what; ownership, roles, multi-tenant scoping
- **Validation & business rules** — limits, quotas, invariants that must always hold
- **External integrations** — providers, webhooks, idempotency, reconciliation
- **Library / provider & build-vs-buy** — for any feature with a real implementation choice (auth, payments, search, storage, email, realtime), this is central and owned by **Stage (c)**. Present the **concrete options generated fresh & current at runtime** (for auth, the *mechanisms* are: the project's existing platform/BaaS auth · a hosted auth provider · a self-hosted auth library · roll-your-own — pick the specific current products at runtime, don't recite a frozen list), one-line tradeoff each, **recommend the one that aligns with the stack already in use** (from `AGENTS.md` — a platform already in the project usually wins over a new external tool), and let the engineer override. Never silently pick, never a canned list, and never ignore what's already there.
- **Failure & edge cases** — concurrency, retries, timeouts, partial failure, empty/error/loading states
- **Performance & scale** — expected volume, pagination, async-vs-sync, caching
- **Security & compliance** — PII, encryption, audit logging, rate limiting, regulatory scope
- **Observability** — what to log, metrics, alerts
- **Configuration & secrets** — new env vars, feature flags, credentials
- **UX surface (if UI in scope)** — capture the *requirements* (what each screen must show/do, states, accessibility needs); leave pixel/layout detail to `/develop`
- **Discoverability & SEO (public-facing features)** — for any publicly-indexed page: metadata, structured data (JSON-LD), OG/social cards, canonical URLs, sitemap/robots, and SSR/SSG vs client-render needs. Skip for internal/auth-walled surfaces.
- **UI design (when the topic IS a page/screen, e.g. "home page UI", "shop page UI")** — this is a real design decision and the ADR is the page's build spec. Settle:
  - **Design system** — does a `design.md` exist? If yes, it's the source of truth. If not, decide the direction (a named reference product's style, a described style, or "extract from existing UI") so `/develop` isn't inventing a look. A design system that doesn't exist yet is itself ADR-worthy (it's cross-cutting — every page depends on it).
  - **Page composition** — what sections/blocks the page contains and in what order (e.g. home: hero → featured categories → product grid → social proof → footer). This is the "what goes on the page" the engineer alone knows.
  - **Component inventory** — the reusable components the page needs (cards, nav, filters, carousel) and which already exist vs are net-new.
  - **Asset strategy** — what to do when no screenshot/design was given and the repo has no images: decide the fallback (real assets the engineer will add, or an online placeholder source — e.g. a stock-photo or avatar-placeholder service), so `/develop` doesn't stall or invent broken paths.

Then run the stages **in order**. Each is a **GATE** — you PROPOSE, SHOW, and don't advance until the panel returns **Accept**. Batch questions **up to 4 per call**, run as many rounds within a stage as it needs, and fold prior answers forward so it reads as one interview, not a form.

**Stage (a) — Requirements & acceptance criteria.** **Seed** the user stories and a first cut of acceptance criteria from the **roadmap feature row's intent + acceptance-criteria seeds** (read in pre-flight) when a row exists; otherwise draft them from the topic + framing. PROPOSE them, **ID each criterion (`AC-1`, `AC-2`, …)**, SHOW the list, and refine with the engineer. **Gate:** panel — *"These acceptance criteria are right (recommended)"* · *"Change/add a criterion — I'll say which"* · *"Missing a failure case"* · Other; loop until Accept. These ACs are **the contract `/develop` builds to and `/verify` checks** — the spine every later stage and every build task hangs off.

**Stage (b) — Data model (MANDATORY — propose → SHOW → confirm → iterate).** Never skipped for a data-backed feature, and never a silently-buried field. **PROPOSE** the entities, their fields (type, required/nullable), and relationships as a **strong opinion** — recommend a concrete model, don't ask a blank *"what's your schema?"*. **SHOW** it as an **ERD-style table or diagram**: entities, primary keys, foreign keys, and cardinality (1:1 / 1:N / N:M). **Gate:** panel — *"Data model looks right (recommended)"* · *"Change/add/remove a field or entity — I'll say what"* · *"A relationship is wrong"* · Other. **ITERATE** — revise and re-SHOW — until Accept. On sign-off, **derive the migration as build task 1** (feeds `## Build plan`).

**Stage (c) — Stack & tool selection (progressive drill-down).** Drill **category → specific option → config**, one panel per level — e.g. *backend shape?* → (a platform/BaaS → which one → which of its features) **or** (custom → database → data-access layer → auth approach → hosting). **Generate the options FRESH and CURRENT at runtime — never a hardcoded/canned list** (this category rots fastest); be honest about staleness (*"as of my knowledge; this space moves fast — verify current"*). Each level carries **exactly one recommended pick**, **aligned to the stack already in use** (from `AGENTS.md` — reuse beats sprawl; a platform already in the project usually wins over a new external tool). **Skip any level the existing stack already settles** (INFER — don't re-ask a decided layer); drill only where a real choice is open (for an ENHANCEMENT most of this is inferred; for ARCHITECTURE/greenfield it's the core of the conversation). For a **greenfield/foundational (ARCHITECTURE) stack decision**, recommend enabling **web-landscape verification** first (the gate below) so the options are current — the *recommended* pick for greenfield, and distinct from optional citation links.

  **Web-assistance gate (panel, capability-first).** Before a greenfield stack drill-down — and reused before the subagent writes citations — offer web help as a panel:
  - **question**: "Use web tools here? Landscape verification checks the *current* options/versions so recommendations aren't stale; citation links fetch-and-confirm official docs for the ADR. Both cost some extra tokens."
  - **header**: "Web assistance"
  - **options**: `Landscape verification + citation links (recommended for greenfield stack)` · `Citation links only` · `No web — named sources only (no extra tokens)` · Other
  For a non-greenfield feature on an established stack, landscape verification is unnecessary — set the recommended pick to citation-links-only or none. When landscape verification is enabled **and** your agent has web tools, run a quick current-landscape check (a web-capable subagent, or your own web tools) **before** presenting the stack panel; without web tools, proceed from your knowledge and flag the staleness. **Record the choice — the subagent-spawn step reuses it (don't re-ask).**

**Stage (d) — API / interface surface.** PROPOSE the endpoints or actions as a table (method, path/signature, key inputs, key outputs, auth requirement, key errors). **Gate:** panel — *"Surface is right (recommended)"* · *"Change/add an endpoint"* · *"Wrong auth on one"* · Other; loop until Accept.

**Stage (e) — Security & authorization model.** PROPOSE who may do what — ownership, roles, multi-tenant/org scoping — plus any compliance scope this feature triggers (payments/PII/health). **Gate:** panel — *"Authz model is right (recommended)"* · *"Change a rule"* · *"Missing a role/tenant boundary"* · Other; loop until Accept.

**Stage (f) — Edge cases & failure modes.** PROPOSE the handling for concurrency, retries, timeouts, partial failure, and empty/error/loading states. **Gate:** panel — *"Failure handling is right (recommended)"* · *"Add a case"* · *"Change a behavior"* · Other; loop until Accept.

**(UI-page features** — topic IS a page/screen: insert a **page-design stage** between (a) and (d) that PROPOSEs page composition/sections, design-system direction, component inventory, and asset strategy (the UI-design checklist bullet), SHOWs it, and gates it — the "what goes on the page" only the engineer knows.**)**

**Quality bar per stage:** every option maps to a real, feature-specific decision (never a placeholder like "how complex is the data model?"), with concrete options each carrying a one-line tradeoff; multi-select where answers aren't exclusive. **Cite the basis on any option that carries a recommendation** — append `(basis: …)`: a **project source** (`your AGENTS.md`, an ADR, an installed skill, the existing stack) or a **named practice** (`idempotency for money ops`). At stage time you have no web tools **unless landscape verification is on**, so **name the source/practice — not a URL** (the subagent adds verified links later if opted in).

**Collect the RECOMMEND items** you defer to the subagent (a call better made with full design context) as a list to inject into its prompt — it must decide each, state the pick + one-line why + the runner-up, and never echo it back as an open question.

**After all stages are signed off:** the confirmed acceptance criteria seed the ADR's `## Requirements`; the confirmed data model, API surface, and stack **derive `## Build plan`** (each task tagged with the AC it satisfies, the migration first). **Order and slice that plan through your Staff/Principal lens on the project's build approach** (read in pre-flight): reason about what the approach implies for *this* feature rather than following a fixed recipe — a Tracer-Bullet project wants the plan to stand up a working end-to-end slice through every layer before thickening it; a Skateboard project wants the thinnest usable whole first; a Facade/prototype project front-loads the UI shell and defers the wiring (the data-model migration can move later in that case); a Journey project sequences one complete user path per phase. With no approach on record, default to end-to-end slices and note the assumption. Then spawn the subagent (below).

**What good, feature-specific staged grilling looks like** (illustrations of *depth* per stage — not a script to copy; generate the equivalent, and the current options, for whatever feature you're given):
- `/architect auth` (first time, no auth yet) → **(a)** ACs for sign-in/session/reset · **(b)** the identity/session data model · **(c)** which sign-in methods (email+password · magic link · OAuth · passkeys · SSO)? then **which auth approach** — options generated fresh & current, aligned to the stack (*if the project already runs a platform with built-in auth, that's the aligned recommended pick*; vs a hosted provider, a self-hosted library, roll-your-own) → its config · **(e)** roles (customer/admin), ownership · **(f)** lockout, token-refresh failure; for mobile: token storage, biometric, deep-link callback.
- `/architect reviews` → reviews table (`userId`, `bookId`, `rating 1–5`, `body`, `createdAt`)? · **one review per user per book** (unique constraint) or many? · must the user have **borrowed/purchased** the book to review? · how is `books.rating` **aggregate recomputed** (on write · trigger · scheduled)? · edit/delete window · moderation (pre/post, who) · pagination & sort.
- `/architect home page UI` (**no design/screenshot given**) → which **sections** and in what order (hero · featured · how-it-works · testimonials · pricing · CTA · footer)? · what does **each section show/contain** (copy, data, imagery)? · build to an existing `design.md`, or pick a direction (template/described style)? · which **components** (existing vs net-new)? · **assets** — real files the engineer will add, or a placeholder source? · responsive/mobile behavior. When the UI isn't specified, *you* must extract the page's contents from the engineer — don't invent them.

Notice: each feature shares *no* questions with the others — that's the point. Every one goes deep on its own data model / rules / contents and the library or build-vs-buy choice, aligned to the existing stack.

**Fallback only:** if the feature is too vague to generate good questions from (rare — usually means the topic should have been narrowed first), use the generic mode file matching the inferred mode as scaffolding: `questions/feature.md`, `questions/architecture.md`, `questions/enhancement.md`, `questions/cross-cutting.md`.

**Skip the staged conversation** on the **"documenting a made decision"** path (Check B above) — the direction is already settled, so the stages add friction. Proceed directly to spawning the subagent with the documentation context.

**Enhancement-mode guard**: if the inferred mode is `ENHANCEMENT` AND `SOURCE_FILE_COUNT = 0`: stop before the staged conversation and tell the engineer:

"Enhancement mode reads existing code to understand what's being changed — but no source files were found. What's the situation?
- A) The code exists in a different directory — tell me the path and I'll re-check.
- B) There is no existing implementation — then this is really a new **FEATURE** (or **ARCHITECTURE**)."

Wait for their answer. If (A): re-run the source-file count for that path. If (B): switch the inferred mode and continue.

---

### Subagent spawn

After the staged conversation, read `agent-prompt.md` and `adr-template.md` (relative paths — the main agent resolves them). Fill the template and inline the ADR structure (see below) — the subagent writes the ADR from that and can't resolve skill paths itself.

**Inject only the resolved MODE's block.** `agent-prompt.md`'s `## Instructions by mode` section has four blocks (`### FEATURE mode`, `### ARCHITECTURE mode`, `### ENHANCEMENT mode`, `### CROSS-CUTTING mode`), but **only one mode runs per call.** In the filled prompt, include **only the block matching the resolved MODE** and drop the other three — they're ~200 lines the subagent never uses. Keep everything else verbatim: the persona ("Who you are / How you think / What you do NOT do"), Step 0 and Step 0b, `## Expert rules that apply to all modes`, `## Report format`, and all the context placeholders.

**Inline the ADR skeleton, not the template's reference/meta sections.** From `adr-template.md`, inline the **ADR section structure + field guidance the subagent fills** — everything between `=== ADR TEMPLATE START ===` and `=== ADR TEMPLATE END ===` (Context, Options considered, Decision, Rationale, the mode-specific design section, Consequences, Follow-up, References, etc.). You **MAY omit the trailing reference/meta sections** — `## Filename conventions`, the `## Status values` table, the umbrella-structure / child-status notes, and the `## Writing rules` commentary — those are **main-agent guidance** for status, shape, and naming (the main agent resolves the filename, shape, and initial `**Status**:` and injects them via the placeholders), not material the subagent needs to *write* the ADR body. The `**Status**:` line the subagent should write is already conveyed by the "On the initial `**Status**:` line" rule in `## Expert rules that apply to all modes`. Do **not** edit `adr-template.md` — this only changes what gets inlined.

**Web-verified links — reuse the Stage (c) web-assistance choice.** The subagent can add **web-verified reference links** (fetch-to-confirm official docs/standards), which costs extra tokens. **The web-assistance gate in Stage (c) already settled this** — if the engineer chose "citation links" (either option that includes them), give the subagent web tools; if they chose "No web," don't. **Only if Stage (c) never ran** (e.g. documentation path, or no stack stage), present the web-assistance panel now (2–4 options, one recommended, plus Other) covering citation links; landscape verification is moot at write time.

Then spawn a subagent:

- `model`: a strong model (e.g. `sonnet`/`opus` on Claude Code)
- `description: "Architect: <mode> — research and draft ADR"`
- Tools: `Read`, `Bash`, `Write`, `Edit` — **add `WebSearch`, `WebFetch` only if the engineer opted into web links** (above). The web tools verify citation links (fetch-to-confirm before linking; sourcing rules in `agent-prompt.md`). Without them — declined, no answer, or the client has no web tools — the subagent cites project sources + named practices only (no links); that's fine.
- `prompt`: filled template with all engineer answers, the inferred framing, and the injected ADR template

The **inferred MODE** (from Framing) is already one of `FEATURE` / `ARCHITECTURE` / `ENHANCEMENT` / `CROSS-CUTTING` — inject it directly.

Inject into the template:
1. Design topic (from the user's original message)
2. The **inferred framing**: MODE, platform (web/mobile/API), stack & conventions (from `AGENTS.md`), and any constraints/compliance you inferred or confirmed
2a. The **project's build approach** (read in pre-flight from `AGENTS.md`/roadmap header, or the noted default) → inject into `BUILD_APPROACH`, so the subagent orders and slices `## Build plan` in role by what the approach implies for this feature
3. All **staged-conversation answers, stage by stage** — including the **confirmed acceptance criteria** (already IDed AC-1…, to seed `## Requirements`), the **confirmed data model** (entities/fields/relationships, to seed `## Build plan` task 1), the confirmed stack/tool picks, API surface, authz model, and edge cases. If the staged conversation was skipped (documentation path), inject: `"Staged design skipped — documenting an already-made decision"` so the subagent knows this was intentional, not an error
3a. The **RECOMMEND items** → inject into `RECOMMEND_ITEMS_OR_NONE` — the specific decisions the subagent must make and justify (tool/provider aligned to the stack, session model, etc.). If none, inject `"none"`.
4. Context-file contents — `AGENTS.md` (root + the feature area's nested), or `CLAUDE.md` as fallback, or "MISSING"
5. Existing ADR list (filenames + first line of each)
6. Related ADR paths (flagged in pre-flight)
7. The resolved **ADR location** (`$ADR_DIR`), next number, and **shape** — a single file `$ADR_DIR/NNNN-title.md`, or an umbrella directory `$ADR_DIR/NNNN-title/` (`index.md` + child ADRs + `research/`). If umbrella: tell the subagent the child decisions to write and that **any inventory/audit it produces goes in `…/NNNN-title/research/`** — never in `docs/roadmap/`, never loose in the code tree. Only the umbrella `index.md` carries a `**Status**:` line (it mirrors the feature); **child ADRs omit the lifecycle Status** — they're spec content governed by the umbrella.
8. Source file count (so subagent knows if there's code to read)
9. Operation: `create` | `update` | `supersede`
10. Today's date (from pre-flight `date +%Y-%m-%d`)
11. Documentation context (if "already built" path was taken — the engineer's free-text answers about why this was chosen, alternatives, and tradeoffs)
12. Community skills — **pass paths + relevance notes, not full content (read on demand).** For each skill relevant to this feature (identified from `AGENTS.md`, per pre-flight), inject a **one-line pointer**: its name, its real project path, and a one-line note on why it's relevant here — e.g. `` `supabase` (`.claude/skills/supabase/`) — RLS + auth conventions relevant here ``. The skills live at a real path the subagent can Read, so the subagent opens a skill file **on demand, only if it materially shapes this decision** — the content stays authoritative when consulted, it's just not front-loaded in full (a project with several installed skills would otherwise dump thousands of tokens most ADRs never use). For a relevant-but-not-installed one, list its name only. If none are relevant, inject "none detected".
    - **FALLBACK — subagents that cannot read files:** on a client whose subagents lack file-read tools, inline each relevant skill's **full content** under a labelled section as before (the subagent can't fetch it on demand), so the knowledge is still present.

---

### After subagent completes

**First — did it run at all?** If the ADR file is missing or empty (the subagent errored or produced nothing), report the failure and offer to re-run — never fabricate an ADR summary. Only if the file exists, continue:

**Self-check before presenting**: Read the written ADR file. Verify it contains all required sections:
- All modes: `## Context`, `## Requirements` (IDed acceptance criteria — the confirmed spine), `## Options considered` (unless "Documenting a made decision"), `## Decision`, `## Rationale`, `## Consequences`
- Data-backed modes: `## Build plan` — ordered tasks, each tagged with the AC(s) it satisfies, migration first; **every AC traces to at least one task**
- Feature mode: `## Feature design` with the confirmed data model and Critical test scenarios (mapped to ACs) populated
- Architecture mode: `## Proposed stack` with every relevant layer filled
- Enhancement mode (non-trivial migration): `## Migration plan` with Strategy, Phases, Rollback, and Risks
- Cross-cutting mode: `## Standard definition` with Canonical pattern, Replaces, Enforcement, Rollout, and Exceptions

If a required section is missing or a field is blank/placeholder, add this line directly after the ADR path in the presentation: `⚠️ Incomplete: [section name] was not completed by the subagent — e.g. "⚠️ Incomplete: ## Feature design > Security model — left as placeholder. Request it in your feedback."`

**Design-review gate (full-weight features — optional for lean/medium, capability-first).** Before presenting a **full-tier / high-risk / compliance-touching / foundational ARCHITECTURE** ADR for confirmation, run a **fresh-model critique**: spawn a subagent on a **strong and, where possible, different model** with the drafted ADR and ask it to stress-test the design — *does it hold up? is there a materially simpler option? what failure mode is missed?* Surface its findings to the engineer alongside the ADR (as a short "Design review" note), and fix any clear issues by targeted Edit before or during confirmation. **Skip it for trivial/lean-tier** decisions, and skip where the agent has no subagent capability (note that it was skipped).

1. Tell the engineer the ADR path, a one-line preview from the subagent's report, and (if run) the design-review note:

   ```
   Draft ADR written to `docs/adr/<NNNN-title>.md`
   Decision: <Decision line from report>
   Key tradeoff: <Key tradeoff line from report>
   Design review: <one-line verdict + any issue raised, or "skipped (lean)">
   ```

   Then present the **confirmation decision panel** (capability-first: `AskUserQuestion` on Claude Code, else the same options as plain text):
   - **question**: "Accept this ADR, or change it?"
   - **header**: "ADR"
   - **options**: `Accept — looks solid (recommended)` · `Change something — I'll tell you what` · `Rethink the approach` · Other
   On **Change something**, ask what to change (this also covers overriding a ⚠️ Premise note — if the engineer disagrees with it, remove it and proceed with their direction) and apply targeted **Edit**s. On **Rethink the approach**, revisit the relevant stage(s)/options and revise. Either way, **re-present the SAME panel** and loop until the engineer picks **Accept**.

2. Do not rewrite the ADR from scratch on feedback. Use the **Edit** tool to apply targeted changes to the specific sections the engineer called out.
3. After any edits, **re-present the confirmation panel** (not a plain "reply yes") until Accept.
4. **On Accept — ratify the decision; the status you set depends on which kind of ADR this is** (see the two-way model above — the discriminator is whether a buildable roadmap feature links this ADR, which you compute in Step 5):
   - **Feature-linked ADR** (a buildable roadmap feature links it): confirmation ratifies the ADR *content* — it does **not** flip the status. The status line mirrors the feature's build lifecycle: `Proposed` = decision agreed, feature not yet built. It advances to `In Progress` (via /develop when the feature goes in-progress) and to `Accepted` (via /develop on completion, or /sync) only once the feature actually ships. So do **not** edit the status line here — a confirmed-but-unbuilt ADR correctly stays `Proposed`.
   - **Standalone decision ADR** (a foundational/stack or cross-cutting standard with **no buildable roadmap feature linking it**): ratification *is* the deliverable — there's no build phase to gate on. **Set its `**Status**:` to `Accepted` on this confirmation.** /develop won't advance it, so leaving it `Proposed` would strand it.
   - **Already-shipped documentation path**: the ADR was already born `Accepted` — leave it, and /sync reconciles the status against the roadmap.
5. **Derive tasks + link the roadmap (after confirmation).** Use the roadmap row located in pre-flight (or re-locate it cheaply by scanning roadmap filenames/headings across per-workspace subdirs; open only the **single numbered roadmap file** that contains it).
   - **If a matching roadmap row exists** → write the ADR's **`## Build plan` tasks into that feature's sub-tasks** (the derived, AC-tagged build order becomes the feature's checklist), and update the row's `ADR` cell to point at the new file, **computed as a relative path from the roadmap file to the ADR** (usually siblings): from `docs/roadmap/api/…` to `docs/adr/api/0001-x.md` the link is `[0001](../../adr/api/0001-x.md)`; to an umbrella, `[0001](../../adr/api/0001-x/index.md)`; single-repo `docs/roadmap/` → `docs/adr/` is `../adr/…`. If the feature's first sub-task is "Decision (ADR)", tick it `[x]`. Edit only the `ADR` cell, the sub-tasks, and that checkbox — **never the feature's status or other rows** (status stays `/roadmap`/`/develop`/`/sync`).
   - **If there is NO matching row** → the derived tasks stay in the ADR's `## Build plan` as the source of truth, and **ask via a panel** (capability-first): question "Track this feature on the roadmap?", header "Roadmap", options `Yes — enroll a coarse row + these tasks (recommended)` · `No — keep the tasks in the ADR Build plan` · Other. On **Yes**, enroll a coarse roadmap row for the feature and copy the Build-plan tasks into it, then link the `ADR` cell as above. On **No**, leave the roadmap untouched and note in your final message: "This ADR isn't on the roadmap — its build tasks live in `## Build plan`; run `/roadmap` later to enroll it." (Silent orphan ADRs are exactly the drift `/status` later has to surface.)

/architect is complete when the engineer confirms the ADR. For a **feature-linked** ADR the status stays `Proposed` — it becomes `Accepted` only when the feature ships, via /develop or /sync. For a **standalone decision** ADR (no linked buildable feature), confirmation sets it `Accepted` (ratification is the deliverable); an **already-shipped documentation** ADR was already `Accepted`. It does not invoke other skills.

---

### Update / Supersede path

If the task is to update or supersede an **existing** ADR:
- Pre-flight: read the existing ADR in full
- Skip the staged conversation if operation is in-place update
- Tell the subagent: `update` or `supersede`
- If supersede: subagent creates new ADR AND updates old ADR's status to `Superseded by [NNNN](NNNN-title.md)`

---

## Reference files

- ADR template: `adr-template.md`
- Research subagent prompt: `agent-prompt.md`
- The staged design conversation is **generated per feature** (see *Staged design conversation*, stages a–f) — not stored
- Generic mode files (`questions/`) are a structural fallback only, used when the feature is too vague to generate from
