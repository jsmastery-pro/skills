---
name: architect
compatibility: Built for Claude Code — uses subagents, model selection, and interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Task, AskUserQuestion
description: "Use this skill to make and document an architectural or technical decision before writing code. Run /architect when facing a meaningful choice between approaches, designing a feature or page from scratch, choosing a tech stack, or when /develop says a decision is owed. A Staff/Principal Engineer that challenges bad directions, names anti-patterns, asks deep feature-specific questions, and recommends the right answer rather than a neutral menu — then writes a complete-build-spec ADR to docs/adr/ for your confirmation. Owns all ADR files."
---

## Output style (plain words, no dashes)

Write everything this skill produces (the ADR it writes, and every message shown to the engineer) in plain, simple language. Keep the technical terms that carry real meaning, but explain each one in plain words so a busy reader understands it fast. Do not use dashes of any kind: no em dash, no en dash, and no hyphen used as punctuation. Use short sentences, commas, or parentheses instead. Clear beats clever.

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

**Project preference — walk it phase by phase; suggest, don't decide.** For the **stack**, the **data model**, and the **tool/provider choice**, this engineer wants to **go through each phase themselves and pick** (for a stack: application type, framework, database, auth, deployment, API, and so on), with the AI **offering a suggested option at each phase**. So present each phase as its own question with your suggested pick marked, and let them choose. The failure to avoid is **bundling**: dumping a complete data model, a full stack, or a pre-baked acceptance-criteria set into one panel and asking only "accept or change." Ask one phase at a time, suggest a pick, they decide.

**Grill the engineer on the feature — ask a lot, and make every question feature-specific.** This is the heart of the skill: pin down the feature's data model, business rules, behavior, scale, library/provider choice, and (when UI is involved) what each screen contains and which sections it has. Generate the questions from *this* feature — an auth feature and a reviews feature share none — and keep asking, in as many batched rounds as it takes, until the ADR is a complete build spec. **The less the engineer specified, the more you ask.** Framing (stack, platform, team/constraints) you *infer* from `AGENTS.md` and the codebase rather than ask — spend the whole question budget on the feature itself.

**Recommendations align with the stack already in use** — if the project runs on a BaaS, prefer its auth/storage over a new external tool; reuse beats sprawl. Works for **web or mobile** alike — infer the platform, never assume web.

## Artifact ownership

**ADR files** in `docs/adr/`, created or updated by this skill only — plus any **research it produces** (inventories, audits) which live **beside the ADR they inform**, never in the roadmap folder. (The roadmap lives separately in `docs/roadmap/` and is owned by `/roadmap` — not an ADR.)

Two independent choices — **where** the ADR lives (repo shape) and **what shape** it takes (decision size):

- **Location = repo shape.** Single repo → `docs/adr/`. Monorepo → `docs/adr/<workspace>/` for a workspace decision, `docs/adr/_root/` for a repo-wide one (mirrors the roadmap). Numbering is **per location** (scan that dir for the next `NNNN`). Call the resolved location `$ADR_DIR`.
- **Shape = decision size, and applies the SAME in a single repo or a monorepo.** A simple decision is a single file, `$ADR_DIR/NNNN-title.md`. A decision that needs a **directory** — because it splits into related sub-decisions, or carries `research/`, or grows a `verify.md` — always uses **`index.md` as its top file**: `$ADR_DIR/NNNN-title/index.md` (+ any child ADRs `NNNN-<child>.md` + a `research/` subfolder). **Never double the name** (`NNNN-title/NNNN-title.md`) — the directory carries the number, the top file is `index.md`, whether it is an umbrella or a single decision with supporting files. Default to a single file; go to the directory shape whenever there are child decisions **or** bulky research **or** a `verify.md` to sit beside it (e.g. a big single-decision audit gets `docs/adr/0001-dedup-strategy/{index.md, research/…}`).

  **Every file is discoverable from the decision that owns it — no orphan research.** In a directory ADR:
  - the **top file is always `index.md`** (for an umbrella it is the umbrella decision; for a single decision with supporting files it is the ADR itself). When there are children or research, it opens with a **`## Structure`** manifest that lists and links **every** child ADR and **every** research file — one line each: what it is + which decision it supports — so reading it maps the whole directory.
  - each **child ADR** links its own evidence in a **`## References`** section.
  - **research filenames are prefixed by the child they support**: `research/NNNN-<topic>.md` (matching the child's number), or `research/_shared-<topic>.md` for umbrella-wide evidence. So a developer building child `0001` reads `0001-*.md`, follows its `## References`, and the `0001-` prefix confirms which research is theirs.
  - **Children stay flat by default; promote on demand.** A child is a flat file (`0001-payment-provider.md`); promote it to its own folder (`0001-payment-provider/{index.md, research/…}`) **only when it accumulates multiple research/asset files**. Most children stay flat — nesting is the exception (avoids overloading `index.md` and deepening the tree for nothing).
  - **The child ADR is self-sufficient to build from; `research/` is optional depth** — the evidence/audit trail, not required reading. `/develop` builds from the child ADR and opens a research file only when it needs the underlying data, so research isn't loaded into context by default. **Cross-child contracts** (how two children connect) live in the umbrella `index.md`, so a task spanning two children gets the glue from the one map it already read.
- **One narrow exception into the roadmap:** after the ADR is confirmed, it updates the matching feature to the **built-ready shape** — ticks `Design it (ADR)`, links the ADR on the pointer line, defines **2 to 5 build milestones rolled up from the ADR's `## Build plan`** (the atomic tasks stay in the ADR, only the rollup goes here), adds the `Build it` / `Verify it` / `Test it` boxes, moves the feature to `in-progress`, and enrolls any follow-up the ADR surfaced. It **never dumps the atomic task list into the roadmap**. With no matching feature, /architect offers to enroll one (see the derive-tasks step).

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
- **Read the build approach for THIS feature** — the delivery strategy that governs how work is sliced into increments, and therefore how you order and slice the ADR's `## Build plan`. Read it with precedence: **this feature's roadmap-row `Approach` override if the feature's row declares one, else the project default** — look in **root `AGENTS.md` first**, else the **roadmap header** (`docs/roadmap/`). This mirrors the ADR-overrides-`AGENTS.md` precedence: a feature that declares its own approach (e.g. a Facade prototype in an otherwise Skateboard project) is built by ITS approach, while every other feature uses the project default. A project (or feature) records one of a family of approaches — **Tracer Bullet** (thin vertical slices that run end-to-end through every layer), **Skateboard** (ship the thinnest usable *whole* first, then grow it), **Facade** (stand up the UI shell first and wire the backend behind it later — a prototype path), **Journey** (deliver one complete user path per phase) — or a project-specific variant. **Carry whatever you find into the subagent** so the Build plan reflects it. If neither the feature nor the project records an approach, **note the assumption** and let your Staff/Principal judgment set the default (prefer end-to-end / Tracer-Bullet slices for production work). Don't apply a fixed per-approach recipe — you reason about what the approach implies for *this* feature when you derive the Build plan.
- **Locate the linked roadmap feature (if any)** — cheaply scan `docs/roadmap/` filenames/headings (incl. per-workspace subdirs) for a feature matching this topic; open only the single roadmap file that contains it (`roadmap.md`, or the matching `<epic>.md` in a split). If found, read that row's **intent + any acceptance-criteria seeds** — these seed **Stage (a)** below — and remember the file/row for the derive-tasks and linking steps. This also settles the ADR's status model (feature-linked vs standalone). If no row matches, note it (standalone-decision path) and don't create one now.
- **(Optional)** list installed skills dirs for AVAILABILITY only — `.claude/skills/`, `.agents/skills/`, `skills/`. Relevance is decided by AGENTS.md + the feature, not by name-matching this list.

From the ADR list (all paths below are relative to `$ADR_DIR`, the resolved location):
- **Next number**: highest existing number in `$ADR_DIR` + 1, zero-padded to 4 digits; `0001` if none. (An umbrella directory `NNNN-<x>/` counts as one number.) **Collision guard (teams):** re-list `$ADR_DIR` immediately before the subagent writes; if the chosen `NNNN` already exists, bump to the next free number. **Never overwrite an existing ADR** — after writing, confirm no concurrent run took the same number.
- **Filename / shape**: kebab-case slug from the topic — max 5 words, no articles, lowercase.
  - Simple decision → `$ADR_DIR/NNNN-kebab-title.md`.
  - **Umbrella** (splits into ≥2 related sub-decisions + research) → a directory `$ADR_DIR/NNNN-kebab-title/` with `index.md` (the umbrella decision, listing its children), child ADRs `NNNN-child.md` inside it, and any inventories/audits under `$ADR_DIR/NNNN-kebab-title/research/`. Decide this from the topic's breadth *before* the subagent writes; tell the subagent to use the directory shape.
- **Related ADRs**: read the first 20 lines of each existing ADR — enough to capture the title, status, and opening paragraph of Context — to check for overlap with the current design topic. Flag any that match.
- **Child-of-umbrella detection**: if the topic is a **sub-decision of an existing umbrella** (`$ADR_DIR/NNNN-<umbrella>/`) — e.g. a new decision that surfaced while building under it — place the new ADR **inside that directory** as the next child (`NNNN-child.md`) and add it to the umbrella's `index.md` list, rather than creating a new top-level ADR. This is also the path when `/develop` hits a decision mid-build: it routes here, and the child lands under its parent. Tell the engineer where it's going.
- **Update/supersede detection**: if any existing ADR clearly overlaps the current design topic (same domain, same system, same decision), **before the staged conversation**, present it to the engineer via a **decision panel** (plain-text options where the agent has no picker; the picker adds Other automatically): "I found an existing ADR that may overlap: `[path]`, [title]. How should I treat this?", options: **New decision (create a new ADR)** · **Update the existing ADR in place** · **Supersede it (a new ADR replaces it)**. Pre-select the "(recommended)" option by how strongly it overlaps (near-identical → Update or Supersede; adjacent → New). On update/supersede: set OPERATION accordingly, read the existing ADR in full, and skip the staged conversation for in-place updates.

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
present a **decision panel** (plain-text options where the agent has no picker): "This sounds like an existing decision you want to *document* rather than explore from scratch.", options: **Document it (write the ADR from what you tell me) (recommended)** · **Go through the full design process**.

If they reply `yes`:
1. Ask these three plain-text questions (not MCQ — the engineer types free text):
   - "What alternatives did you consider before choosing this approach? (Even if briefly, 'we looked at X and Y but went with Z' is enough.)"
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

1. Tell the engineer: "This describes a full product. /architect works one decision at a time. Let me help you pick the first foundational decision."
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

State it: *"Reading this as a new **FEATURE** on your existing stack (from `AGENTS.md`), web (correct me if not)."* Then begin the **staged design conversation** (below).

---

### Staged design conversation — gated, acceptance-criteria-first (main model)

The design is an **ordered sequence of stages**, and you **walk it one dimension at a time**: one question per real choice (for a stack decision that is application type, then framework, then database, then auth, then hosting, then API shape, and so on, each on its own). In each question you **offer the current, real options and mark your suggested pick with a one-line why, but the engineer chooses** — you suggest, you do not decide for them. **Never bundle a whole decision (the entire acceptance-criteria set, the full data model, or the full stack) into one accept-or-change panel** — that is exactly what the engineer flagged as wrong ("it just gives everything in a box"). Build the spec up **from their per-question answers**, and confirm the assembled result in the **final ADR review** (the data model also gets a light confirm at the end of its own walk, since a wrong one cascades). **No vital dimension is silently decided or skipped.** What you build together becomes the ADR's `## Requirements` and `## Build plan` (for a decision-only ADR, the `## Proposed stack`). **Generate every question from *this* topic** — an auth feature, a reviews feature, and a stack decision share none.

**Every choice is one question, and you may suggest a pick.**
- **One dimension per question.** Ask each real choice on its own (framework, then database, then auth, and so on). **Never** roll several decisions, or a whole pre-baked list, into a single accept-or-change panel — that bundling is the "everything in a box" failure.
- **Offer options with a suggested pick.** Present 2 to 4 current, real options and mark the one you would suggest with a short why. **Do not add an "Other" option yourself** — the picker appends a free-text Other automatically, so a manual one just doubles it (only in a plain-text fallback with no picker do you offer a free-text option). The suggestion helps the engineer decide fast, but **they choose** — you are walking them through the decision, not making it for them.
- **Confirm panels at the end of a stage** (the assembled data model, accept the ADR, References consent, an overlapping ADR) carry one suggested option; the picker adds the Other automatically.
- **Capability-first:** use your agent's interactive picker (`AskUserQuestion` on Claude Code); where the agent has no picker, degrade to the **same options as plain text**.

**Still infer the framing, but ASK the design inputs.** Framing (mode, platform, the stack *already in the repo*, constraints) is inferred as above — don't interrogate what you can read. The stages then spend the budget **asking** what the engineer owns: the requirements, the data model, the rules, the scope, and the stack/tool choices for anything not already settled. Within each stage, sort every dimension **INFER / ASK / RECOMMEND** (see *Asks vs acts* and the project preference there): **INFER** silently from the prompt/codebase/`AGENTS.md`; **ASK** the engineer for the design inputs (data model, stack, provider, methods, rules) one phase at a time, offering a suggested pick they can take or change; **RECOMMEND** the small internal implementation details they don't want to weigh in on. Confirmation of the assembled spec happens in the final ADR review, not as a bundled per-stage gate.

**Your mandate (senior+ role):** you are the Staff/Principal engineer who will be blamed if this feature ships wrong. The ADR you produce is the **complete build spec** `/develop` implements from — every load-bearing decision must be settled here. Any dimension you leave blank becomes a question `/develop` is forced to ask mid-build, or worse, an assumption it guesses wrong. **Leaving a gap is the failure mode.** So be exhaustive, not minimal — cover *everything* a senior engineer would pin down before writing code.

**Before the stages — enumerate every load-bearing dimension of this feature and assign each to the stage that owns it,** so nothing load-bearing falls between stages. Walk this checklist (not all apply to every feature; add any feature-specific ones), sorting each INFER / ASK / RECOMMEND:

- **Functional scope & boundaries** — what's in, what's explicitly out, the key user flows and their happy/unhappy paths
- **Data model & persistence** — entities, fields, types, nullability, relationships, indexes, uniqueness, retention/deletion
- **Lifecycle & state machine** — states, valid transitions, who/what triggers each
- **API / interface surface** — endpoints or actions, inputs, outputs, status codes, versioning
- **Authentication & authorization** — who may do what; ownership, roles, multi-tenant scoping
- **Validation & business rules** — limits, quotas, invariants that must always hold
- **External integrations** — providers, webhooks, idempotency, reconciliation
- **Library / provider & build-vs-buy** — for any feature with a real implementation choice (auth, payments, search, storage, email, realtime), this is central and owned by **Stage (c)**. Present the **concrete options generated fresh & current at runtime** (for auth, the *mechanisms* are: the project's existing platform/BaaS auth · a hosted auth provider · a self-hosted auth library · roll-your-own — pick the specific current products at runtime, don't recite a frozen list), one-line tradeoff each, mark the one you would suggest (prefer reuse of the stack already in use, from `AGENTS.md`), and **let the engineer choose.** Never silently pick, never a canned list, and never ignore what's already there.
- **Failure & edge cases** — concurrency, retries, timeouts, partial failure, empty/error/loading states
- **Performance & scale** — expected volume, pagination, async-vs-sync, caching
- **Security & compliance** — PII, encryption, audit logging, rate limiting, regulatory scope
- **Observability** — what to log, metrics, alerts
- **Configuration & secrets** — new env vars, feature flags, credentials
- **UX surface (if UI in scope)** — capture the *requirements* (what each screen must show/do, states, accessibility needs); leave pixel/layout detail to `/develop`
- **Discoverability & SEO (public-facing features)** — for any publicly-indexed page: metadata, structured data (JSON-LD), OG/social cards, canonical URLs, sitemap/robots, and SSR/SSG vs client-render needs. Skip for internal/auth-walled surfaces.
- **UI design (when the topic IS a page/screen, e.g. "home page UI", "shop page UI")** — this is a real design decision and the ADR is the page's build spec. Settle:
  - **Design source — ASK, never assume.** Do not auto-pick the source (not even "a Figma MCP is connected, so use it"). Ask the engineer *"How should I get the design for this?"* as a panel and let them choose (**no pre-picked recommendation**): **From Figma** (use, or offer to connect, the Figma MCP to pull the real tokens, spacing, components, and frames) · **From a screenshot or images I'll give you** · **From the existing `design.md` / current UI** · **No design yet, suggest a direction** (only if they pick this do you propose a style). The picker adds its own Other. **Record the chosen source in the ADR** (for Figma, which file and frames) so `/develop` uses the same one. If they pick Figma but no MCP is connected, point them to connect it (see *Tool skills & MCP*), then proceed.
  - **Design system** — does a `design.md` exist (or a design-tool MCP as above)? If yes, it's the source of truth. If not, decide the direction so `/develop` isn't inventing a look. A design system that doesn't exist yet is itself ADR-worthy (it's cross-cutting — every page depends on it).
  - **Page composition** — what sections/blocks the page contains and in what order (e.g. home: hero → featured categories → product grid → social proof → footer). This is the "what goes on the page" the engineer alone knows.
  - **Component inventory** — the reusable components the page needs (cards, nav, filters, carousel) and which already exist vs are net-new.
  - **Asset strategy** — what to do when no screenshot/design was given and the repo has no images: decide the fallback (real assets the engineer will add, or an online placeholder source — e.g. a stock-photo or avatar-placeholder service), so `/develop` doesn't stall or invent broken paths.

Then **walk the stages in order as one continuous, step-by-step interview.** Ask each dimension as its **own question** with a suggested pick, take the engineer's answer, and move to the next. **Do NOT lead any stage with a proposed bundle** — not a full acceptance-criteria list, not a full endpoint table, not a full authz model — for accept-or-change. That "everything in a box" is exactly what the engineer rejected; it applies to **every** stage, not just the stack and the data model. Assemble the spec **as you go** from their per-question answers. Batch closely-related questions **up to 4 per call**, run as many rounds as a stage needs, and fold prior answers forward so it reads as one interview. The engineer confirms the **assembled** result in the **final ADR review** (the one place a whole artifact is shown for accept-or-change); the data model additionally gets a light confirm at the end of its own walk, because a wrong data model cascades. No other stage shows an upfront bundle.

**Stage (a) — Requirements (ask step by step, then DERIVE the acceptance criteria).** **Do not open with a finished acceptance-criteria list to accept or change** — that is the exact bundle the engineer rejected. Instead **ask the requirements one question at a time**, seeding each from the roadmap row's intent + seeds when present and suggesting an answer the engineer can take or change: what core job the feature does, the main (happy-path) flow, the key rules and limits, and the important failure cases. From their answers, **derive** the acceptance criteria (`AC-1`, `AC-2`, …) as you go — they are **the contract `/develop` builds to and `/verify` checks**, the spine every later stage and build task hangs off — but the engineer reviews the assembled ACs in the **final ADR**, not as a mid-flow bundle.

**Stage (b) — Data model (MANDATORY — ASK → assemble → SHOW → confirm → iterate).** Never skipped for a data-backed feature. **ASK, don't guess the model.** The entities and their fields are the engineer's domain knowledge, so **elicit them in batched questions** rather than opening with a finished schema: first what **entities** the feature needs, then for each entity its **fields** (name, type, required or nullable), then the **relationships** (which entity relates to which, and the cardinality 1:1 / 1:N / N:M), then the **rules and constraints** (uniqueness, retention, invariants that must always hold). Offer example options inside a question to make answering fast, but **do NOT present a complete pre-filled ERD for them to accept or reject** — that is the "everything in a box" the engineer rejected. Then **assemble** the model from their answers and **SHOW** it back as an **ERD-style table**: entities, primary keys, foreign keys, cardinality. **Gate (a confirm panel, so it carries a recommended option):** *"This matches what I described (recommended)"* · *"Change/add/remove a field or entity"* · *"A relationship is wrong"*. **ITERATE** — revise and re-SHOW — until Accept. On sign-off, **derive the migration as build task 1** (feeds `## Build plan`).

**Stage (c) — Stack & tool walk (one layer per question, you suggest, the engineer picks).** As the architect, **you drive the walk automatically** — work through the stack **one layer at a time, each layer its own question**, in a sensible dependency order, and the engineer should not have to ask you to move to the next layer. **Which layers apply is your judgment from the platform and topic, not a fixed script** — a web app, a mobile app, an API service, and a data pipeline do not share the same layers, so derive the real set for the decision in front of you (drop what doesn't apply, add what does). A typical **web-app** walk, as an illustration only and not a mandatory checklist, is: application type / architecture pattern → language → framework → database / persistence → auth approach → hosting / deployment → background jobs → email / notifications → file storage / search → observability → API shape (REST / GraphQL / RPC / server actions). For each layer you do walk, present the **current, real options** and **mark the one you would suggest** (one-line why, prefer reuse of what the project already runs), then let the engineer choose. **Generate the options FRESH and CURRENT at runtime — never a hardcoded/canned list** (this category rots fastest); be honest about staleness (*"as of my knowledge; this space moves fast, verify current"*). **Skip any layer the existing stack already settles** (INFER from `AGENTS.md` — don't re-ask a decided layer). Drill only where a real choice is open: for an ENHANCEMENT most layers are inferred; **for an ARCHITECTURE / greenfield stack decision this layer-by-layer walk IS the whole conversation** (see the ARCHITECTURE note below the stages). For a greenfield stack decision, checking the current tool landscape keeps the options fresh, so the References consent panel below folds that in (the web option runs a current landscape check before the stack questions).

  **References consent (one panel, capability-first).** There is ONE ask here, not two competing ones (the old web assistance gate and the references ask are now a single question). Before the stack drill down for a greenfield decision (so current options can be checked), and reused later before the subagent writes the References, ask this single question and record the outcome as `REFERENCES_LEVEL`:
  - **question**: "Add a References section to the ADR (where the recommendations come from, and optionally links)? The full reasoning (the Rationale) stays either way. For a greenfield stack decision the web option also checks the current tool landscape so the options are not stale. Web fetches cost some extra tokens."
  - **header**: "References"
  - **options**:
    - `No references, keep it clean (recommended)` (the ADR keeps its full Rationale but writes no References section and adds no `(basis: ...)` citations) sets `REFERENCES_LEVEL = none`
    - `Sources only (named project sources and practices, no web fetch)` (a References section with named project sources and practices, no links) sets `REFERENCES_LEVEL = sources`
    - `Sources plus web verified links (fetches pages to confirm the links, costs some extra tokens)` (sources plus web verified links; for a greenfield stack decision this also runs the current landscape check) sets `REFERENCES_LEVEL = sources+links`
  **For a greenfield/foundational ARCHITECTURE stack decision, set the recommended pick to `Sources plus web verified links` instead**, so the current landscape is verified before you present the options; for a non-greenfield feature on an established stack, keep `No references, keep it clean` as the recommended pick (landscape verification is unnecessary there). When `sources+links` is chosen **and** your agent has web tools and this is a greenfield stack decision, run a quick current-landscape check (a web capable subagent, or your own web tools) **before** presenting the stack panel; without web tools, proceed from your knowledge and flag the staleness. **Record `REFERENCES_LEVEL` (`none` | `sources` | `sources+links`), the subagent spawn step reuses it, do not re-ask.**

  **Tool skills & MCP servers — offer to install the Agent Skill AND connect the MCP server (once the tool picks are settled; capability-first, consent-gated).** **This offer is mandatory, not optional** — once tool choices are set, run it; do **not** silently skip it or downgrade it to a passive ADR follow-up. For each **newly-chosen** tool (framework, database, auth library, provider, and so on) not already covered or declined, offer **both** its Agent Skill (so the build follows its conventions) **and** its MCP server (so later stages get live access to the real system). MCP (Model Context Protocol) is a cross-tool standard; if a relevant server is already connected its tools just appear available, so **use them** and don't re-offer.
  - **Detect fresh, never hardcode.** For a skill: `npx skills find <tool>` (the `skills` CLI's search; `--owner <org>` if known; it's interactive, so if you can't drive it non-interactively fall through to a **web search** for "<tool> agent skill", and confirm a candidate with `npx skills add <owner>/<repo> --list`). For an MCP: a web search for "<tool> MCP server", or your agent's connector list. Found neither, or no capability → skip the active offer. Never keep a hardcoded list of which tools have a skill or server — it rots.
  - **Skip the known.** Don't offer what `npx skills list` or `AGENTS.md` shows already installed, or what `AGENTS.md` records as previously **declined** (this is the no-nag rule).
  - **Offer once, the engineer chooses (no agent pick, no auto-install/connect).** Present a single panel per tool: "<tool> has an Agent Skill (`<owner>/<repo>`) and an MCP server. How do you want to set it up?" with these options, **none marked recommended** — only include the ones that actually exist for this tool: **Install the skill and connect the MCP** · **Install the skill only** · **Connect the MCP only**. The picker's own Other covers *neither / skip / something else*. Capability-first picker; plain text where there's none.
  - **Act on the pick.** For a skill: `npx skills add <owner>/<repo> -y` (to the project's agent). For an MCP: **connecting is a user config step** (their MCP settings, e.g. `claude mcp add …`) — you can't do it for them, so point them there and note the tools are used automatically once connected.
  - **Record.** Skills installed → pass to the subagent for the ADR's `## Decision` **Implementation skills** field and flag for `AGENTS.md`. Servers connected → flag for `AGENTS.md`'s `MCP servers:` line. Anything **declined / skipped** → flag it for the `Agent skills:` / `MCP servers:` `declined:` list so a later stage does not re-offer (root for project-wide tech, the nested area doc for area-specific — `/audit`/`/sync` own writing `AGENTS.md`).
  - **No search/install/connect capability?** Fall back to the passive behavior — add an ADR `## Follow-up` naming the skill and/or MCP the engineer could add for this tool.

**Stage (d) — API / interface surface (walk each endpoint).** Ask the surface **one endpoint at a time**, not as an upfront full table: first which surfaces the feature needs, then for each its method, inputs, outputs, auth requirement, and key errors, suggesting a shape the engineer can take or change. Assemble the surface as you go.

**Stage (e) — Security & authorization (walk each rule).** Ask who may do what **rule by rule** — ownership, roles, multi-tenant/org scoping — and name any compliance scope this feature triggers (payments/PII/health), suggesting an answer per question. Assemble the authz model from the answers; no upfront full model to accept or reject.

**Stage (f) — Edge cases & failure modes (walk each case).** Ask the handling **one failure at a time** — concurrency, retries, timeouts, partial failure, and empty/error/loading states — suggesting a sensible default the engineer can change. Assemble the handling from the answers.

**(UI-page features** — topic IS a page/screen: insert a **page-design stage** between (a) and (d) that **walks** page composition/sections, design-system direction, component inventory, and asset strategy (the UI-design checklist bullet) **one question at a time**, suggesting a pick each — the "what goes on the page" only the engineer knows. No upfront full layout to accept or reject.**)**

**(ARCHITECTURE stack decisions** — the topic IS choosing the stack/foundation (e.g. `/architect stack & architecture`): **do NOT lead with Stage (a) acceptance criteria as a set to confirm.** The conversation **is the Stage (c) stack walk** — go layer by layer (application type → framework → database → auth → hosting → API → observability, and so on), **one question each**, suggesting a pick and letting the engineer choose. Any light acceptance criteria and a data-model sketch are **derived from the chosen stack afterward**, not gated up front. The engineer wants to walk the decision phase by phase, not approve a bundle. Stages (b), (d), (e), (f) collapse into "derived from the chosen stack" here; the walk is the work. **After the stack walk, ALWAYS run the Tool skills & MCP offer (Stage c's offer) for the tools you just chose** — a stack decision picks the most tools (framework, database, auth, ORM, hosting), so this is exactly where it matters most. Do **not** skip it or defer it to a `/audit` follow-up; run the offer before spawning the subagent.**)**

**Quality bar per stage:** every option maps to a real, feature-specific decision (never a placeholder like "how complex is the data model?"), with concrete options that each carry a one-line tradeoff; multi-select where answers are not exclusive. **Keep the option list itself clean:** one question per dimension, the real options with **your suggested pick marked** and a one-line why (the picker adds the free-text Other automatically, so don't list your own). The engineer still chooses; you never bundle several decisions into one panel. Do not put a `(basis: …)` tag or a source citation in the option labels. The source and reasoning behind a recommendation belong in the written ADR (its Rationale, which always stays, and its References section when the engineer opts in), not in the live panel the engineer picks from.

**Collect the RECOMMEND items** you defer to the subagent (a call better made with full design context) as a list to inject into its prompt — it must decide each, state the pick + one-line why + the runner-up, and never echo it back as an open question.

**After all stages are signed off** (buildable feature ADR): the confirmed acceptance criteria seed the ADR's `## Requirements`; the confirmed data model, API surface, and stack **derive `## Build plan`** (each task tagged with the AC it satisfies, the migration first). **For a decision-only ADR** (an ARCHITECTURE stack decision or a CROSS-CUTTING standard) there is **no `## Requirements`/`## Build plan`** to derive: the spec is the decision itself (`## Proposed stack` / `## Standard definition`), and the feature that executes the decision (e.g. the scaffold sub-task) derives its steps at `/develop` time. **Order and slice that plan through your Staff/Principal lens on the feature's build approach** (read in pre-flight — the feature's row override, else the project default): reason about what the approach implies for *this* feature rather than following a fixed recipe — a Tracer-Bullet project wants the plan to stand up a working end-to-end slice through every layer before thickening it; a Skateboard project wants the thinnest usable whole first; a Facade/prototype project front-loads the UI shell and defers the wiring (the data-model migration can move later in that case); a Journey project sequences one complete user path per phase. With no approach on record, default to end-to-end slices and note the assumption. Then spawn the subagent (below).

**What good, feature-specific staged grilling looks like** (illustrations of *depth* per stage — not a script to copy; generate the equivalent, and the current options, for whatever feature you're given):
- `/architect auth` (first time, no auth yet) → **(a)** ACs for sign-in/session/reset · **(b)** the identity/session data model · **(c)** which sign-in methods (email+password · magic link · OAuth · passkeys · SSO)? then **which auth approach** — options generated fresh & current, aligned to the stack (*if the project already runs a platform with built-in auth, that's the aligned recommended pick*; vs a hosted provider, a self-hosted library, roll-your-own) → its config · **(e)** roles (customer/admin), ownership · **(f)** lockout, token-refresh failure; for mobile: token storage, biometric, deep-link callback.
- `/architect reviews` → reviews table (`userId`, `bookId`, `rating 1–5`, `body`, `createdAt`)? · **one review per user per book** (unique constraint) or many? · must the user have **borrowed/purchased** the book to review? · how is `books.rating` **aggregate recomputed** (on write · trigger · scheduled)? · edit/delete window · moderation (pre/post, who) · pagination & sort.
- `/architect home page UI` (**no design/screenshot given**) → which **sections** and in what order (hero · featured · how-it-works · testimonials · pricing · CTA · footer)? · what does **each section show/contain** (copy, data, imagery)? · build to an existing `design.md`, or pick a direction (template/described style)? · which **components** (existing vs net-new)? · **assets** — real files the engineer will add, or a placeholder source? · responsive/mobile behavior. When the UI isn't specified, *you* must extract the page's contents from the engineer — don't invent them.

Notice: each feature shares *no* questions with the others — that's the point. Every one goes deep on its own data model / rules / contents and the library or build-vs-buy choice, aligned to the existing stack.

**Fallback only:** if the feature is too vague to generate good questions from (rare — usually means the topic should have been narrowed first), use the generic mode file matching the inferred mode as scaffolding: `questions/feature.md`, `questions/architecture.md`, `questions/enhancement.md`, `questions/cross-cutting.md`.

**Skip the staged conversation** on the **"documenting a made decision"** path (Check B above) — the direction is already settled, so the stages add friction. Proceed directly to spawning the subagent with the documentation context.

**Enhancement-mode guard**: if the inferred mode is `ENHANCEMENT` AND `SOURCE_FILE_COUNT = 0`: stop before the staged conversation and tell the engineer:

"Enhancement mode reads existing code to understand what's being changed, but no source files were found. What's the situation?
- A) The code exists in a different directory. Tell me the path and I'll re-check.
- B) There is no existing implementation. Then this is really a new **FEATURE** (or **ARCHITECTURE**)."

Wait for their answer. If (A): re-run the source-file count for that path. If (B): switch the inferred mode and continue.

---

### Subagent spawn

After the staged conversation, read `agent-prompt.md` and `adr-template.md` (relative paths — the main agent resolves them). Fill the template and inline the ADR structure (see below) — the subagent writes the ADR from that and can't resolve skill paths itself.

**Inject only the resolved MODE's block.** `agent-prompt.md`'s `## Instructions by mode` section has four blocks (`### FEATURE mode`, `### ARCHITECTURE mode`, `### ENHANCEMENT mode`, `### CROSS-CUTTING mode`), but **only one mode runs per call.** In the filled prompt, include **only the block matching the resolved MODE** and drop the other three — they're ~200 lines the subagent never uses. Keep everything else verbatim: the persona ("Who you are / How you think / What you do NOT do"), Step 0 and Step 0b, `## Expert rules that apply to all modes`, `## Report format`, and all the context placeholders.

**Inline the ADR skeleton, not the template's reference/meta sections.** From `adr-template.md`, inline the **ADR section structure + field guidance the subagent fills** — everything between `=== ADR TEMPLATE START ===` and `=== ADR TEMPLATE END ===` (Summary, Context, Options considered, Decision, Rationale, the mode-specific design section, Consequences, Follow-up, References, etc.). You **MAY omit the trailing reference/meta sections** — `## Filename conventions`, the `## Status values` table, the umbrella-structure / child-status notes, and the `## Writing rules` commentary — those are **main-agent guidance** for status, shape, and naming (the main agent resolves the filename, shape, and initial `**Status**:` and injects them via the placeholders), not material the subagent needs to *write* the ADR body. The `**Status**:` line the subagent should write is already conveyed by the "On the initial `**Status**:` line" rule in `## Expert rules that apply to all modes`. Do **not** edit `adr-template.md` — this only changes what gets inlined.

**References and links — reuse the Stage (c) References consent (`REFERENCES_LEVEL`).** The subagent writes the References section and `(basis: ...)` citations only at the level the engineer chose. **The References consent panel in Stage (c) already settled this:**
- `none`: the subagent writes NO `## References` section and adds NO `(basis: ...)` citations anywhere; the Rationale still stays.
- `sources`: a `## References` section with named Project sources and Practices only, no Links, and no web tools.
- `sources+links`: sources plus web verified links; give the subagent web tools so it fetches to confirm each link before writing it.

**Only if Stage (c) never ran** (for example the documentation path, or no stack stage), present the References consent panel now (the same one panel, recommended pick `No references, keep it clean`) and set `REFERENCES_LEVEL` from it; the landscape check is moot at write time.

Then spawn a subagent:

- `model`: a strong model (e.g. `sonnet`/`opus` on Claude Code)
- `description: "Architect: <mode> — research and draft ADR"`
- Tools: `Read`, `Bash`, `Write`, `Edit`. **Add `WebSearch`, `WebFetch` only when `REFERENCES_LEVEL` is `sources+links`** (above). The web tools verify links (fetch to confirm before linking; sourcing rules in `agent-prompt.md`). When `REFERENCES_LEVEL` is `sources`, the subagent cites named project sources and practices only (no links, no web tools). When it is `none`, the subagent writes no References section and no `(basis: ...)` citations at all.
- `prompt`: filled template with all engineer answers, the inferred framing, and the injected ADR template

The **inferred MODE** (from Framing) is already one of `FEATURE` / `ARCHITECTURE` / `ENHANCEMENT` / `CROSS-CUTTING` — inject it directly.

Inject into the template:
1. Design topic (from the user's original message)
2. The **inferred framing**: MODE, platform (web/mobile/API), stack & conventions (from `AGENTS.md`), and any constraints/compliance you inferred or confirmed
2a. The **feature's build approach** (read in pre-flight with precedence — this feature's roadmap-row `Approach` override if its row declares one, else the project default from `AGENTS.md`/roadmap header, else the noted default) → inject into `BUILD_APPROACH`, so the subagent orders and slices `## Build plan` in role by what the approach implies for this feature
3. All **staged-conversation answers, stage by stage** — including the **confirmed acceptance criteria** (already IDed AC-1…, to seed `## Requirements`), the **confirmed data model** (entities/fields/relationships, to seed `## Build plan` task 1), the confirmed stack/tool picks, API surface, authz model, and edge cases. If the staged conversation was skipped (documentation path), inject: `"Staged design skipped — documenting an already-made decision"` so the subagent knows this was intentional, not an error
3a. The **RECOMMEND items** → inject into `RECOMMEND_ITEMS_OR_NONE` — the specific decisions the subagent must make and justify (tool/provider aligned to the stack, session model, etc.). If none, inject `"none"`.
3b. The **References level** from the Stage (c) References consent → inject into `REFERENCES_LEVEL` (one of `none` | `sources` | `sources+links`). This governs whether the subagent writes a `## References` section and `(basis: ...)` citations, and at what depth (see the sourcing rules in `agent-prompt.md`). If Stage (c) never ran and you have not asked yet, default to `none`.
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
- All modes: `## Summary` (the plain-words human quick read, no dashes), `## Context`, `## Requirements` (IDed acceptance criteria — the confirmed spine), `## Options considered` (unless "Documenting a made decision"), `## Decision`, `## Rationale`, `## Consequences`
- Data-backed modes: `## Build plan` — ordered tasks, each tagged with the AC(s) it satisfies, migration first; **every AC traces to at least one task**
- Feature mode: `## Feature design` with the confirmed data model and Critical test scenarios (mapped to ACs) populated
- Architecture mode: `## Proposed stack` with every relevant layer filled
- Decision-only ADRs (Architecture, Cross-cutting): **no `## Build plan` of implementation steps and no invented meta-ACs** — the spec is `## Proposed stack` / `## Standard definition`, and the feature that executes the decision (e.g. the scaffold sub-task) derives its steps at `/develop` time. If a scaffold-style build plan appears in a stack ADR, strip it before presenting.
- Enhancement mode (non-trivial migration): `## Migration plan` with Strategy, Phases, Rollback, and Risks
- Cross-cutting mode: `## Standard definition` with Canonical pattern, Replaces, Enforcement, Rollout, and Exceptions

If a required section is missing or a field is blank/placeholder, add this line directly after the ADR path in the presentation: `⚠️ Incomplete: [section name] was not completed by the subagent, e.g. "⚠️ Incomplete: ## Feature design > Security model was left as a placeholder. Request it in your feedback."`

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
   - **options**: `Accept, looks solid (recommended)` · `Change something, I'll tell you what` · `Rethink the approach`
   On **Change something**, ask what to change (this also covers overriding a ⚠️ Premise note — if the engineer disagrees with it, remove it and proceed with their direction) and apply targeted **Edit**s. On **Rethink the approach**, revisit the relevant stage(s)/options and revise. Either way, **re-present the SAME panel** and loop until the engineer picks **Accept**.

2. Do not rewrite the ADR from scratch on feedback. Use the **Edit** tool to apply targeted changes to the specific sections the engineer called out.
3. After any edits, **re-present the confirmation panel** (not a plain "reply yes") until Accept.
4. **On Accept — ratify the decision; the status you set depends on which kind of ADR this is** (see the two-way model above — the discriminator is whether a buildable roadmap feature links this ADR, which you compute in Step 5):
   - **Feature-linked ADR** (a buildable roadmap feature links it): confirmation ratifies the ADR *content* — it does **not** flip the status. The status line mirrors the feature's build lifecycle: `Proposed` = decision agreed, feature not yet built. It advances to `In Progress` (via /develop when the feature goes in-progress) and to `Accepted` (via /develop on completion, or /sync) only once the feature actually ships. So do **not** edit the status line here — a confirmed-but-unbuilt ADR correctly stays `Proposed`.
   - **Standalone decision ADR** (a foundational/stack or cross-cutting standard with **no buildable roadmap feature linking it**): ratification *is* the deliverable — there's no build phase to gate on. **Set its `**Status**:` to `Accepted` on this confirmation.** /develop won't advance it, so leaving it `Proposed` would strand it.
   - **Already-shipped documentation path**: the ADR was already born `Accepted` — leave it, and /sync reconciles the status against the roadmap.
5. **Derive tasks + link the roadmap (after confirmation).** Use the roadmap feature located in pre-flight (or re-locate it cheaply by scanning roadmap filenames/headings across per-workspace subdirs; open only the **single roadmap file** that contains it — `roadmap.md`, or the matching `<epic>.md`).
   - **If this is a decision-only ADR** (an ARCHITECTURE stack decision or a CROSS-CUTTING standard, which by rule has no `## Build plan`) → there are **no build tasks to copy.** Just link the row's `ADR` cell (relative path, as below), tick the `Decision (ADR)` sub-task `[x]`, and **leave the execution sub-task(s) untouched** (e.g. the `Scaffold (/develop)` sub-task on the Stack and architecture feature) so `/develop` derives those steps from the decision at build time. Do not write scaffold or implementation steps into the row here, that is the double-spec bug this avoids.
   - **If a matching roadmap feature exists (buildable feature ADR)** → **update the feature to the built-ready shape.** This is the roadmap's main living update: it happens every time an ADR is captured. Make exactly these edits, nothing else:
     1. **Tick `Design it (ADR)`** `[x]` and remove the `· needs a decision` tag from the heading (it is decided now).
     2. **Link the ADR** on the feature's pointer line, **computed as a relative path from the roadmap file to the ADR**: from `docs/roadmap/api/…` to `docs/adr/api/0001-x.md` is `[0001](../../adr/api/0001-x.md)`; to a **directory ADR** (umbrella or single-with-files), `[0001](../../adr/api/0001-x/index.md)`; single-repo `docs/roadmap/` → `docs/adr/` is `../adr/…`.
     3. **Define the build milestones — a rollup, never the atomic dump.** Add a `- [ ] Build it: /develop <feature>` box, and under it **2 to 5 milestone sub-items** rolled up from the ADR's `## Build plan` by grouping its atomic tasks into coherent chunks (by AC cluster or by layer, whatever reads as a real unit of work), each tagged with the ACs it covers. **The atomic tasks and their per-task detail stay in the ADR's `## Build plan`** — the roadmap carries only the rollup. The 2-to-5 is a guideline you reason about, not a rule: if it won't fit in about five milestones the feature is too big and should be split. **Never a fixed milestone list — derive them from THIS ADR's Build plan.**
     4. **Add `- [ ] Verify it: /verify <feature>` and `- [ ] Test it: /test <feature>`** boxes after Build.
     5. **Move the feature's status to `in-progress`** (designing is progress) in the At-a-glance table and beside the heading.
     6. **Enroll what the ADR surfaced.** If a `## Follow-up` item is really a separate feature (not part of this one), add it as a new roadmap feature tagged `from ADR NNNN`, so the plan grows as decisions are made. Deferred, non-blocking follow-ups go to the Deferred list.

     Edit only this feature (and any newly-enrolled follow-up) — never touch other features' contents. The result stays **coarse** (a milestone rollup, not a task dump) while **every box is a command or a tracked milestone**, so a reader always sees Design → Build (+ milestones) → Verify → Test.
   - **If there is NO matching feature** → the atomic tasks stay in the ADR's `## Build plan`, and **ask via a panel** (capability-first): question "Track this feature on the roadmap?", header "Roadmap", options `Yes, enroll it` · `No, keep it in the ADR only`. On **Yes**, enroll a coarse roadmap feature (heading + intent + `Done when:` line) and give it the same built-ready shape as above (Design ticked + ADR link + the milestone rollup + Verify + Test boxes). On **No**, leave the roadmap untouched and note in your final message: "This ADR isn't on the roadmap. Its build tasks live in `## Build plan`; run `/roadmap` later to enroll it." (Silent orphan ADRs are exactly the drift `/status` later has to surface.)

6. **Spoken summary in chat (plain words, no dashes).** After the engineer accepts and the roadmap is linked, show a short plain language summary in chat so they get it fast (follow *Output style* above: plain words, gloss any jargon, no dashes). In a few short sentences cover what the ADR decided, why in one line, and what happens next (the build tasks it produced, and which skill to run next). A template:

   ```
   Done. Here is the quick version.
   What we decided: <one plain sentence>.
   Why: <one plain sentence>.
   What is next: run /clear to start a fresh session (it reads this ADR from disk, so nothing is lost and the long design chat you just had stops costing tokens), then /develop <feature> to build it.
   ```

   Keep it plain and skip the jargon, or gloss it in parentheses. This is the human read of the decision, separate from the ADR file's own `## Summary`.

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
