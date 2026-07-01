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

Does not write code. Does not update the `AGENTS.md`/`CLAUDE.md` context files (/sync owns that).

## Asks vs acts

Asks targeted questions before spawning any subagent — but **spends the question budget on substance, not ceremony.** Every question is sorted into one of three buckets:

- **INFER** — anything the prompt or codebase already reveals: feature-vs-architecture, the stack in use, whether UI is in scope, an already-chosen provider. **Do not ask these** — derive them. Asking what you can read wastes the engineer's attention and reads as incompetent.
- **ASK** — only what the engineer alone knows: requirements, preferences, business rules, compliance scope. This is what the deep questioning is *for*.
- **RECOMMEND** — anything expertise can settle: which provider/library/pattern is best for their constraints. **Decide it and propose** — state the pick, a one-line why, and the runner-up, and let them override. Never present a neutral menu, never silently decide for them.

**Grill the engineer on the feature — ask a lot, and make every question feature-specific.** This is the heart of the skill: pin down the feature's data model, business rules, behavior, scale, library/provider choice, and (when UI is involved) what each screen contains and which sections it has. Generate the questions from *this* feature — an auth feature and a reviews feature share none — and keep asking, in as many batched rounds as it takes, until the ADR is a complete build spec. **The less the engineer specified, the more you ask.** Framing (stack, platform, team/constraints) you *infer* from `AGENTS.md` and the codebase rather than ask — spend the whole question budget on the feature itself.

**Recommendations align with the stack already in use** — if the project runs on a BaaS, prefer its auth/storage over a new external tool; reuse beats sprawl. Works for **web or mobile** alike — infer the platform, never assume web.

## Artifact ownership

**ADR files** in `docs/adr/`, created or updated by this skill only — plus any **research it produces** (inventories, audits) which live **beside the ADR they inform**, never in the roadmap folder. (The roadmap lives separately in `docs/mvp/` and is owned by `/mvp` — not an ADR.)

Two independent choices — **where** the ADR lives (repo shape) and **what shape** it takes (decision size):

- **Location = repo shape.** Single repo → `docs/adr/`. Monorepo → `docs/adr/<workspace>/` for a workspace decision, `docs/adr/_root/` for a repo-wide one (mirrors the roadmap). Numbering is **per location** (scan that dir for the next `NNNN`). Call the resolved location `$ADR_DIR`.
- **Shape = decision size, and applies the SAME in a single repo or a monorepo.** A simple decision is a single file, `$ADR_DIR/NNNN-title.md`. A **broad "strategy/foundation" decision that splits into multiple related sub-decisions** — regardless of repo type — becomes a **directory**: `$ADR_DIR/NNNN-<umbrella>/index.md` (the umbrella) + child ADRs (`NNNN-<child>.md`) + a `research/` subfolder for supporting inventories. Default to a single file; nest only when there are genuinely multiple children + research. (So a big refactor in a plain single-repo project gets `docs/adr/0001-dedup-strategy/{index.md, 0001-…, research/…}` just the same.)
- **One narrow exception into the roadmap:** after the ADR is confirmed, it fills in the matching feature's `ADR` pointer cell in `docs/mvp/…` — a single-cell link update, nothing else (status/sub-tasks stay `/mvp`/`/develop`/`/sync`).

**Artifact base.** ADRs live under `docs/` by default. If `docs/` is a *published* docs site (`docusaurus.config.*`, `.vitepress/`, `mkdocs.yml`, Astro Starlight, or Nextra detected), use `.workflow/` instead (`.workflow/adr/`) so workflow files don't ship to the site. **Always follow whichever base — `docs/` or `.workflow/` — already exists** (paths in this skill assume `docs/`).

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows:
- **Commands**: `git` is the only required CLI and behaves the same on every OS. Other shell snippets (`mkdir -p`, `date`, `find`, `ls`, `cat`, `wc`) are POSIX **reference**, not literal scripts — use your agent's own cross-platform file tools (read, search/glob, write, create-dir) and your knowledge of today's date instead. Creating `docs/adr/` should use your write tool, not `mkdir`.
- **Bundled files**: the fallback question files (`questions/*.md`), `agent-prompt.md`, and `adr-template.md` are referenced by paths relative to this skill's folder. The main agent reads them; the **ADR template text is injected into the subagent prompt** (subagents can't resolve skill-relative paths).
- **No subagent / interactive-question support?** The spawn-a-subagent steps assume a Task/subagent tool, and the multiple-choice rounds assume an interactive picker — both Claude Code features. On a tool without them: do the research/drafting inline yourself, and ask the question rounds as plain text with the same options.

## Execution

### Step 0 — Topic check (before pre-flight)

If no design topic was provided (the engineer ran `/architect` with no argument or an empty description): **stop and ask before doing anything else**:

"What design decision do you want to work through? Describe the feature, system, or choice you need to design in one or two sentences."

Wait for their answer. Use it as the design topic before running pre-flight.

---

### Pre-flight (main model)

```bash
# Freshness (teams): if behind the remote, a teammate may have added ADRs or changed this feature
git fetch --quiet 2>/dev/null
git rev-parse --verify main >/dev/null 2>&1 && BASE=main || BASE=master
git rev-list --count HEAD..origin/$BASE 2>/dev/null   # >0 → warn "pull first" before deciding

# Resolve the ADR location = the roadmap workspace, mirrored into docs/adr/:
#   single repo → docs/adr/ ; monorepo workspace → docs/adr/<workspace>/ ; repo-wide → docs/adr/_root/
# (Determine <workspace> the same way as the roadmap — from the topic/path/roadmap row. Call it ADR_DIR.)
mkdir -p "$ADR_DIR"

# Today's date — inject into ADR
date +%Y-%m-%d

# List existing ADRs IN THIS LOCATION — for numbering and detecting related decisions (numbering is per-location)
find "$ADR_DIR" -name "[0-9]*.md" -o -name "index.md" | sort

# Check if codebase has source files — informs how much reading the subagent should do
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.py" \
  -o -name "*.go" -o -name "*.rs" -o -name "*.java" \) \
  -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' | wc -l

# Read project context — this is the source of truth for the stack and the project's community skills.
#   read root AGENTS.md (fall back to CLAUDE.md, else MISSING), AND the nested <area>/AGENTS.md for
#   this feature's area if one exists (e.g. src/auth/AGENTS.md for an auth feature).

# (Optional) list installed skills dirs for AVAILABILITY only — .claude/skills/, .agents/skills/, skills/
#   relevance is decided by AGENTS.md + the feature, not by name-matching this list.
```

From the ADR list (all paths below are relative to `$ADR_DIR`, the resolved location):
- **Next number**: highest existing number in `$ADR_DIR` + 1, zero-padded to 4 digits; `0001` if none. (An umbrella directory `NNNN-<x>/` counts as one number.) **Collision guard (teams):** re-list `$ADR_DIR` immediately before the subagent writes; if the chosen `NNNN` already exists, bump to the next free number. **Never overwrite an existing ADR** — after writing, confirm no concurrent run took the same number.
- **Filename / shape**: kebab-case slug from the topic — max 5 words, no articles, lowercase.
  - Simple decision → `$ADR_DIR/NNNN-kebab-title.md`.
  - **Umbrella** (splits into ≥2 related sub-decisions + research) → a directory `$ADR_DIR/NNNN-kebab-title/` with `index.md` (the umbrella decision, listing its children), child ADRs `NNNN-child.md` inside it, and any inventories/audits under `$ADR_DIR/NNNN-kebab-title/research/`. Decide this from the topic's breadth *before* the subagent writes; tell the subagent to use the directory shape.
- **Related ADRs**: read the first 20 lines of each existing ADR — enough to capture the title, status, and opening paragraph of Context — to check for overlap with the current design topic. Flag any that match.
- **Child-of-umbrella detection**: if the topic is a **sub-decision of an existing umbrella** (`$ADR_DIR/NNNN-<umbrella>/`) — e.g. a new decision that surfaced while building under it — place the new ADR **inside that directory** as the next child (`NNNN-child.md`) and add it to the umbrella's `index.md` list, rather than creating a new top-level ADR. This is also the path when `/develop` hits a decision mid-build: it routes here, and the child lands under its parent. Tell the engineer where it's going.
- **Update/supersede detection**: if any existing ADR clearly overlaps the current design topic (same domain, same system, same decision), **before the deep questioning**, present it to the engineer: "I found an existing ADR that may be relevant: `[path]` — [title]. Is this a **new** decision (creates a new ADR) or are you **updating/superseding** the existing one?" Wait for their answer. If update or supersede: set OPERATION accordingly, read the existing ADR in full, and skip the deep questioning for in-place updates.

**Community skills — read them from the project's `AGENTS.md`, not from a hardcoded name table** (skill names and stacks change). `AGENTS.md` is the source of truth for what the project uses: project-wide skills/conventions in **root `AGENTS.md`**, area-specific ones in the relevant **nested `<area>/AGENTS.md`** (maintained by `/audit` and `/sync`). So:

1. **Read root `AGENTS.md` and the nested `AGENTS.md` for this feature's area** (e.g. `src/auth/AGENTS.md` for an auth feature, `src/payments/AGENTS.md` for billing). These tell you the stack and which community skills the project relies on.
2. **Load only the skills relevant to *this* feature** — for each one those context files reference that bears on the feature, read its `SKILL.md` and inject its conventions into the subagent. Don't pull in skills the feature doesn't touch.
3. **(Available ≠ relevant.)** You may also list the installed skills dirs (`.claude/skills/`, `.agents/skills/`, `skills/`) to see what's *available* — but relevance is decided by the feature + `AGENTS.md`, not by name-matching a list. If a clearly-relevant skill is installed but **not yet referenced in `AGENTS.md`**, use it anyway and flag (ADR Follow-up) that it should be added to the right context file — **root** if it's project-wide, **nested `<area>/AGENTS.md`** if it's specific to one area.
4. **This is load-bearing for your recommendation.** Whatever the context files show the project already uses (a BaaS, an ORM, a payment provider, an auth library) is what your library/provider recommendation must build on or prefer — not an unrelated external tool. If a genuinely-better option isn't installed, note it as an ADR Follow-up suggestion rather than silently assuming it.

**Workflow skills** (never treat as community skills): `triage`, `audit`, `architect`, `mvp`, `develop`, `verify`, `test`, `review`, `harden`, `document`, `debug`, `sync`, `status` — add new workflow skills here as they're created.

---

### Scope validation (before Framing)

Before any questioning, run these two checks **in order**. Check B must run before Check A.

---

**Check B — "Already built" detection (runs first)**

Scan the design topic for phrases signalling an existing decision: "I built", "we built", "we're using", "we use", "I use", "we chose", "I chose", "already using", "already built", "just document", "document the decision we made", "decided to use", "we went with", "we're on".

If found: before anything else, tell the engineer:
"This sounds like an existing decision you want to document rather than explore from scratch. I can write the ADR directly from what you tell me. Reply `yes` to document it, or `no` to go through the full design process."

If they reply `yes`:
1. Ask these three plain-text questions (not MCQ — the engineer types free text):
   - "What alternatives did you consider before choosing this approach? (Even if briefly — 'we looked at X and Y but went with Z' is enough.)"
   - "What was the main reason you chose this over the alternatives?"
   - "What tradeoffs is the team accepting with this decision? What does it make harder?"
2. Wait for their answers.
3. Take the **documentation path**: skip the deep questioning. Inject their answers as `DOCUMENTATION_CONTEXT` alongside the design topic, and inject the deep-questioning slot as `"skipped — documenting an already-made decision"`. Still infer and inject the **framing** (MODE, platform, stack) from the topic + `AGENTS.md`.
4. Spawn the subagent with a note: "This is a documentation task. DOCUMENTATION_CONTEXT contains the engineer's account of the decision. Read existing code if SOURCE_FILE_COUNT > 0 to verify and supplement. Write the ADR documenting what was built — not re-evaluating options."

If they reply `no`: proceed to Check A, then Framing and the deep questioning normally.

---

**Check A — Product vision vs. specific decision (runs second)**

A design topic is **product-scoped** if:
- It describes what the product *is* rather than what to *decide* (e.g. "a B2B SaaS that manages teams", "a marketplace for freelancers", "a social app for cyclists")
- No specific technical component, feature, or technology choice is named
- It would require 5+ separate ADRs to fully capture
- It uses business/product language, not engineering component language

A design topic is **decision-scoped** if it names a specific component, feature, or technical concern (e.g. "auth approach", "notification service", "team invitations feature", "should we use PostgreSQL or MongoDB").

**If product-scoped**: do not start the deep questioning yet. Instead:

1. Tell the engineer: "This describes a full product — /architect works one decision at a time. Let me help you pick the first foundational decision."
2. Generate 4 **foundational first-decision** options tailored to the product type and ask via `AskUserQuestion` (question: "Which foundational decision should we design first?", header: "First decision"). For most products these are the tech stack/architecture, the auth/identity approach, the core domain data model, and the single most important product-specific concern — worded for what the engineer described.
3. After the engineer selects: update the design topic to that specific decision and proceed to Framing.

---

### Framing — infer, don't interrogate (no fixed question round)

**Infer** the framing from the topic + `AGENTS.md` + codebase — don't ask it (these aren't feature questions, and asking them wastes the budget). State it back in a line or two so a wrong read is cheap to correct, then spend all your questions on the feature:

- **Mode** — `FEATURE` (new feature) · `ARCHITECTURE` (foundational stack) · `ENHANCEMENT` (changing something that exists) · `CROSS-CUTTING` (a project-wide standard). Infer from the topic and whether the thing already exists in the code. Confirm only if genuinely ambiguous.
- **Platform** — web · mobile · API/backend · a mix. Infer from the stack in `AGENTS.md` (**never assume web**) — it changes the questions (mobile auth, offline, push differ from web).
- **Workspace (monorepo)** — if this is a monorepo (workspaces config, or `apps/*`/`packages/*` manifests), identify **which workspace** this feature belongs to (from the topic, the path, or the roadmap row's `Code area`; ask if unclear). Read **that workspace's** nested `AGENTS.md` for *its* stack — apps in a monorepo often differ (Next.js web, Go api, React Native mobile), so don't assume the root stack. Note the workspace in the ADR's Context (and whether the decision is app-specific or repo-wide).
- **Stack & conventions** — language, framework, DB, and the community skills the project uses, from `AGENTS.md` (the target workspace's, in a monorepo) — inferred, never asked.
- **Constraints** — team size, scale, and compliance: infer from `AGENTS.md` / the product. Raise a **per-feature** compliance question only when *this* feature touches regulated data (payments, PII, health) — not as a generic deadline/team menu.

State it: *"Reading this as a new **FEATURE** on your **Next.js + Supabase** stack (web) — correct me if not."* Then begin the deep questioning.

---

### Deep questioning — feature-specific, technical (main model generates, then calls `AskUserQuestion`)

**Generate the questions from the feature** — specific to whatever is being designed, never from a fixed list.

**Your mandate (senior+ role):** you are the Staff/Principal engineer who will be blamed if this feature ships wrong. The ADR you produce is the **complete build spec** `/develop` implements from — every load-bearing decision must be settled here. Any dimension you leave blank becomes a question `/develop` is forced to ask mid-build, or worse, an assumption it guesses wrong. **Leaving a gap is the failure mode.** So be exhaustive, not minimal — cover *everything* a senior engineer would pin down before writing code.

**Step A — Enumerate every load-bearing dimension of this feature.** Walk this checklist (not all apply to every feature; add any feature-specific ones). For each, decide whether you can settle it yourself or must ask:

- **Functional scope & boundaries** — what's in, what's explicitly out, the key user flows and their happy/unhappy paths
- **Data model & persistence** — entities, fields, types, nullability, relationships, indexes, uniqueness, retention/deletion
- **Lifecycle & state machine** — states, valid transitions, who/what triggers each
- **API / interface surface** — endpoints or actions, inputs, outputs, status codes, versioning
- **Authentication & authorization** — who may do what; ownership, roles, multi-tenant scoping
- **Validation & business rules** — limits, quotas, invariants that must always hold
- **External integrations** — providers, webhooks, idempotency, reconciliation
- **Library / provider & build-vs-buy** — for any feature with a real implementation choice (auth, payments, search, storage, email, realtime), this is central. Present the **concrete, current options** (e.g. for auth: the project's existing BaaS auth · Clerk · Auth.js/NextAuth · Better Auth · roll-your-own) with a one-line tradeoff each, **recommend the one that aligns with the stack already in use** (from `AGENTS.md` — a BaaS already in the project usually wins over a new external tool), and let the engineer override. Never silently pick, and never ignore what's already there.
- **Failure & edge cases** — concurrency, retries, timeouts, partial failure, empty/error/loading states
- **Performance & scale** — expected volume, pagination, async-vs-sync, caching
- **Security & compliance** — PII, encryption, audit logging, rate limiting, regulatory scope
- **Observability** — what to log, metrics, alerts
- **Configuration & secrets** — new env vars, feature flags, credentials
- **UX surface (if UI in scope)** — capture the *requirements* (what each screen must show/do, states, accessibility needs); leave pixel/layout detail to `/develop`
- **Discoverability & SEO (public-facing features)** — for any publicly-indexed page: metadata, structured data (JSON-LD), OG/social cards, canonical URLs, sitemap/robots, and SSR/SSG vs client-render needs. Skip for internal/auth-walled surfaces.
- **UI design (when the topic IS a page/screen, e.g. "home page UI", "shop page UI")** — this is a real design decision and the ADR is the page's build spec. Settle:
  - **Design system** — does a `design.md` exist? If yes, it's the source of truth. If not, decide the direction (a template like Stripe/Raycast/Linear, a described style, or "extract from existing UI") so `/develop` isn't inventing a look. A design system that doesn't exist yet is itself ADR-worthy (it's cross-cutting — every page depends on it).
  - **Page composition** — what sections/blocks the page contains and in what order (e.g. home: hero → featured categories → product grid → social proof → footer). This is the "what goes on the page" the engineer alone knows.
  - **Component inventory** — the reusable components the page needs (cards, nav, filters, carousel) and which already exist vs are net-new.
  - **Asset strategy** — what to do when no screenshot/design was given and the repo has no images: decide the fallback (real assets the engineer will add, or an online placeholder source like Unsplash/Picsum/pravatar), so `/develop` doesn't stall or invent broken paths.

**Step B — Sort each dimension into INFER / ASK / RECOMMEND** (see *Asks vs acts*):
- **INFER** — answer it yourself from the prompt/codebase/AGENTS.md. Do not ask.
- **ASK** — only the engineer knows it (requirements, business rules, preferences, scope boundaries). These become questions.
- **RECOMMEND** — expertise decides it (provider/library/pattern/architecture). The subagent makes the call and justifies it; do **not** ask.

**Step C — Ask every ASK question, in as many batched rounds as it takes.** This is the heart of the skill — do not truncate to hit a number.
- Group the ASK questions by dimension and present them via `AskUserQuestion`, **up to 4 per call**. Run **multiple rounds** until every un-inferable, decision-relevant question is answered. A non-trivial feature legitimately needs 2–4 rounds (e.g. round 1 scope & data, round 2 auth & rules, round 3 integrations & edge cases). Stop only when there is genuinely nothing left that the engineer alone can settle — not at an arbitrary cap.
- Quality bar per question: maps to a real, feature-specific decision (never a generic placeholder like "how complex is the data model?"); concrete options drawn from the actual choices, each with a one-line tradeoff; multi-select where answers aren't exclusive.
- **Cite the basis on options that carry a recommendation.** Where an option is "the recommended way," append a short `(basis: …)` — a **project source** (`your AGENTS.md`, an ADR, an installed skill, the existing stack) or a **named practice** (`idempotency for money ops`). At question time you have no web tools, so **name the source/practice — never a URL**. The subagent web-verifies any links later, in the ADR.
- Between rounds, briefly fold prior answers in ("Given org-scoped roles, the next questions are about invitation flow…") so the rounds feel like one coherent interview, not a form.
- Before finishing: re-scan the Step A checklist and confirm no load-bearing dimension is still unanswered. If one is, ask it.

**Step D — Collect the RECOMMEND items** (the decisions you deferred to the subagent) as a list to inject into its prompt — it must decide each, state the pick + one-line why + the runner-up, and never echo it back as an open question.

**What good, feature-specific grilling looks like** (illustrations of *depth* — not a script to copy; generate the equivalent for whatever feature you're given):
- `/architect auth` (first time, no auth yet) → which sign-in methods (email+password · magic link · OAuth providers · passkeys · SSO)? · expected scale (hundreds / thousands / millions of users)? · **which library** — present options aligned to the stack (*you already use Supabase → Supabase Auth is the aligned default*; vs Clerk, Auth.js, Better Auth, roll-your-own) and recommend · session model · roles (customer/admin)? · password reset & verification? · for mobile: token storage, biometric, deep-link callback.
- `/architect reviews` → reviews table (`userId`, `bookId`, `rating 1–5`, `body`, `createdAt`)? · **one review per user per book** (unique constraint) or many? · must the user have **borrowed/purchased** the book to review? · how is `books.rating` **aggregate recomputed** (on write · trigger · scheduled)? · edit/delete window · moderation (pre/post, who) · pagination & sort.
- `/architect home page UI` (**no design/screenshot given**) → which **sections** and in what order (hero · featured · how-it-works · testimonials · pricing · CTA · footer)? · what does **each section show/contain** (copy, data, imagery)? · build to an existing `design.md`, or pick a direction (template/described style)? · which **components** (existing vs net-new)? · **assets** — real files the engineer will add, or a placeholder source? · responsive/mobile behavior. When the UI isn't specified, *you* must extract the page's contents from the engineer — don't invent them.

Notice: each feature shares *no* questions with the others — that's the point. Every one goes deep on its own data model / rules / contents and the library or build-vs-buy choice, aligned to the existing stack.

**Fallback only:** if the feature is too vague to generate good questions from (rare — usually means the topic should have been narrowed first), use the generic mode file matching the inferred mode as scaffolding: `questions/feature.md`, `questions/architecture.md`, `questions/enhancement.md`, `questions/cross-cutting.md`.

**Skip the deep questioning** on the **"documenting a made decision"** path (Check B above) — the direction is already settled, so deep-dive questions add friction. Proceed directly to spawning the subagent with the documentation context.

**Enhancement-mode guard**: if the inferred mode is `ENHANCEMENT` AND `SOURCE_FILE_COUNT = 0`: stop before the deep questioning and tell the engineer:

"Enhancement mode reads existing code to understand what's being changed — but no source files were found. What's the situation?
- A) The code exists in a different directory — tell me the path and I'll re-check.
- B) There is no existing implementation — then this is really a new **FEATURE** (or **ARCHITECTURE**)."

Wait for their answer. If (A): re-run the source-file count for that path. If (B): switch the inferred mode and continue.

---

### Subagent spawn

After the deep questioning, read `agent-prompt.md` and `adr-template.md` (relative paths — the main agent resolves them). Fill the template **and inline the full `adr-template.md` text into the prompt** — the subagent writes the ADR from that structure and can't resolve skill paths itself. Then spawn:

- `model: "sonnet"`
- `description: "Architect: <mode> — research and draft ADR"`
- Tools: `Read`, `Bash`, `Write`, `Edit`, `WebSearch`, `WebFetch` — the web tools are for **verifying** citation links (the subagent must fetch-to-confirm before linking; see the sourcing rules in `agent-prompt.md`). If the client has no web tools, the subagent cites project sources + named practices only (no links) — that's fine.
- `prompt`: filled template with all engineer answers, the inferred framing, and the injected ADR template

The **inferred MODE** (from Framing) is already one of `FEATURE` / `ARCHITECTURE` / `ENHANCEMENT` / `CROSS-CUTTING` — inject it directly.

Inject into the template:
1. Design topic (from the user's original message)
2. The **inferred framing**: MODE, platform (web/mobile/API), stack & conventions (from `AGENTS.md`), and any constraints/compliance you inferred or confirmed
3. All **deep-questioning answers** — if the deep questioning was skipped (documentation path), inject: `"Deep questioning skipped — documenting an already-made decision"` so the subagent knows this was intentional, not an error
3a. The **RECOMMEND items** (Step D) → inject into `RECOMMEND_ITEMS_OR_NONE` — the specific decisions the subagent must make and justify (library/provider aligned to the stack, session model, etc.). If none, inject `"none"`.
4. Context-file contents — `AGENTS.md` (root + the feature area's nested), or `CLAUDE.md` as fallback, or "MISSING"
5. Existing ADR list (filenames + first line of each)
6. Related ADR paths (flagged in pre-flight)
7. The resolved **ADR location** (`$ADR_DIR`), next number, and **shape** — a single file `$ADR_DIR/NNNN-title.md`, or an umbrella directory `$ADR_DIR/NNNN-title/` (`index.md` + child ADRs + `research/`). If umbrella: tell the subagent the child decisions to write and that **any inventory/audit it produces goes in `…/NNNN-title/research/`** — never in `docs/mvp/`, never loose in the code tree.
8. Source file count (so subagent knows if there's code to read)
9. Operation: `create` | `update` | `supersede`
10. Today's date (from pre-flight `date +%Y-%m-%d`)
11. Documentation context (if "already built" path was taken — the engineer's free-text answers about why this was chosen, alternatives, and tradeoffs)
12. Community skills: for each skill relevant to this feature (identified from `AGENTS.md`, per pre-flight), inject its full content under a labelled section. For a relevant-but-not-installed one, list its name only. If none are relevant, inject "none detected".

---

### After subagent completes

**First — did it run at all?** If the ADR file is missing or empty (the subagent errored or produced nothing), report the failure and offer to re-run — never fabricate an ADR summary. Only if the file exists, continue:

**Self-check before presenting**: Read the written ADR file. Verify it contains all required sections:
- All modes: `## Context`, `## Options considered` (unless "Documenting a made decision"), `## Decision`, `## Rationale`, `## Consequences`
- Feature mode: `## Feature design` with Acceptance criteria and Critical test scenarios populated
- Architecture mode: `## Proposed stack` with every relevant layer filled
- Enhancement mode (non-trivial migration): `## Migration plan` with Strategy, Phases, Rollback, and Risks
- Cross-cutting mode: `## Standard definition` with Canonical pattern, Replaces, Enforcement, Rollout, and Exceptions

If a required section is missing or a field is blank/placeholder, add this line directly after the ADR path in the presentation: `⚠️ Incomplete: [section name] was not completed by the subagent — e.g. "⚠️ Incomplete: ## Feature design > Security model — left as placeholder. Request it in your feedback."`

1. Tell the engineer the ADR path and a one-line preview from the subagent's report:

   ```
   Draft ADR written to `docs/adr/<NNNN-title>.md`
   Decision: <Decision line from report>
   Key tradeoff: <Key tradeoff line from report>
   ```

   Then: "Review the file and reply:
   - `yes` — accept as-is
   - Specific feedback — I'll apply surgical edits and confirm
   - `override premise` — if you disagree with a ⚠️ Premise note, I'll remove it and proceed with your direction"

2. Do not rewrite the ADR from scratch on feedback. Use the **Edit** tool to apply targeted changes to the specific sections the engineer called out.
3. After any edits, confirm: "ADR updated. Confirm with `yes` or give further feedback."
4. **On `yes` (acceptance) — ratify the decision.** Flip the ADR's status line from `**Status**: Proposed` to `**Status**: Accepted` (one Edit). This is what makes the decision *agreed* — `/develop` builds from `Accepted` ADRs and warns on `Proposed` ones, so leaving it `Proposed` would block/nag downstream. (Do **not** flip on the documentation path if the engineer wants it left as a record only — but default to `Accepted` on confirmation.)
5. **Link the roadmap (after acceptance).** If a roadmap under `docs/mvp/` (scan the dir, incl. per-workspace subdirs) has a row for this feature, update that row's `ADR` cell to point at the new file, **computed as a relative path from the roadmap file to the ADR** (both are scoped the same way, so they're usually siblings): from `docs/mvp/api/…` to `docs/adr/api/0001-x.md` the link is `[0001](../../adr/api/0001-x.md)`; to an umbrella, `[0001](../../adr/api/0001-x/index.md)`; single-repo `docs/mvp/` → `docs/adr/` is `../adr/…`. If the feature's first sub-task is "Decision (ADR)", tick it `[x]`. Edit only that cell/checkbox — never status or other rows. If there's **no matching row** (an ad-hoc decision outside the roadmap), don't edit the roadmap — but **note it** in your final message: "This ADR isn't tied to a roadmap feature — run `/mvp` to add a row if you're tracking this as a feature." (Silent orphan ADRs are exactly the drift `/status` later has to surface.)

/architect is complete when the engineer confirms the ADR (now `Accepted`). It does not invoke other skills.

---

### Update / Supersede path

If the task is to update or supersede an **existing** ADR:
- Pre-flight: read the existing ADR in full
- Skip the deep questioning if operation is in-place update
- Tell the subagent: `update` or `supersede`
- If supersede: subagent creates new ADR AND updates old ADR's status to `Superseded by [NNNN](NNNN-title.md)`

---

## Reference files

- ADR template: `adr-template.md`
- Research subagent prompt: `agent-prompt.md`
- The deep questioning is **generated per feature** (see Deep questioning, Steps A–D) — not stored
- Generic mode files (`questions/`) are a structural fallback only, used when the feature is too vague to generate from
