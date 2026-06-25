---
name: architect
compatibility: Built for Claude Code — uses subagents, model selection, and interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
description: "Use this skill to get expert system design guidance and document an architectural or technical decision before writing code. Run /architect when facing a meaningful choice between approaches, when designing a new feature from scratch, when selecting a tech stack for a new project, or when the triage playbook lists /architect as a step. This skill acts as a Staff Engineer and Principal Architect: it challenges bad directions, applies industry best practices, calls out named anti-patterns, and recommends the right answer rather than presenting a neutral menu of options. It runs two rounds of targeted MCQ questions, researches options, writes a draft ADR to docs/adr/, and presents it for confirmation. It owns all ADR files. Do not run /audit after /architect has written an ADR for the same scope."
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
- **ASK** — only what the engineer alone knows: requirements, preferences, business rules, compliance scope. This is what Round 1 and Round 2 are *for*.
- **RECOMMEND** — anything expertise can settle: which provider/library/pattern is best for their constraints. **Decide it and propose** — state the pick, a one-line why, and the runner-up, and let them override. Never present a neutral menu, never silently decide for them.

Round 1 is a **quick** pass for the un-inferable framing context (constraints, how settled the direction is) — not the place for depth, and not a business questionnaire. The depth lives in **Round 2**, which **generates questions specific to this feature** — no fixed list, no hardcoded domains — and asks **as many batched rounds as it takes** to pin every load-bearing dimension (data, API, auth, rules, integrations, edge cases, security, …), so the ADR is a *complete* build spec. The generic mode files exist only as a structural fallback when the feature is too vague to generate from.

## Artifact ownership

`docs/adr/NNNN-title.md` — created or updated by this skill only. **One narrow exception:** after the ADR is confirmed, it fills in the matching feature's `ADR` pointer cell in `docs/features/index.md` (a single-cell link update, not a rewrite) so the roadmap and the decision are connected. It touches nothing else in that file — status and sub-tasks stay owned by `/mvp`, `/develop`, and `/sync`.

**Artifact base.** ADRs live under `docs/` by default. If `docs/` is a *published* docs site (`docusaurus.config.*`, `.vitepress/`, `mkdocs.yml`, Astro Starlight, or Nextra detected), use `.workflow/` instead (`.workflow/adr/`) so workflow files don't ship to the site. **Always follow whichever base — `docs/` or `.workflow/` — already exists** (paths in this skill assume `docs/`).

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows:
- **Commands**: `git` is the only required CLI and behaves the same on every OS. Other shell snippets (`mkdir -p`, `date`, `find`, `ls`, `cat`, `wc`) are POSIX **reference**, not literal scripts — use your agent's own cross-platform file tools (read, search/glob, write, create-dir) and your knowledge of today's date instead. Creating `docs/adr/` should use your write tool, not `mkdir`.
- **Bundled files**: the Round-2 question files (`questions/*.md`), `agent-prompt.md`, and `adr-template.md` are referenced by paths relative to this skill's folder. The main agent reads them; the question files drive the MCQ prompts, and the **ADR template text is injected into the subagent prompt** (subagents can't resolve skill-relative paths).
- **No subagent / interactive-question support?** The spawn-a-subagent steps assume a Task/subagent tool, and the multiple-choice rounds assume an interactive picker — both Claude Code features. On a tool without them: do the research/drafting inline yourself, and ask the question rounds as plain text with the same options.

## Execution

### Step 0 — Topic check (before pre-flight)

If no design topic was provided (the engineer ran `/architect` with no argument or an empty description): **stop and ask before doing anything else**:

"What design decision do you want to work through? Describe the feature, system, or choice you need to design in one or two sentences."

Wait for their answer. Use it as the design topic before running pre-flight.

---

### Pre-flight (main model)

```bash
mkdir -p docs/adr

# Today's date — inject into ADR
date +%Y-%m-%d

# List existing ADRs — for numbering and detecting related decisions
find docs/adr -name "[0-9]*.md" | sort

# Check if codebase has source files — informs how much reading the subagent should do
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.py" \
  -o -name "*.go" -o -name "*.rs" -o -name "*.java" \) \
  -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' | wc -l

# Detect installed community skills (exclude workflow skills) — check every agent's skills dir,
# since skills install per-tool: list the subfolders of .claude/skills/, .agents/skills/, and skills/
# (use your file tools). De-duplicate by skill name.

# Read project context — AGENTS.md is canonical; fall back to CLAUDE.md (use your file tool)
#   read AGENTS.md if present, else CLAUDE.md, else treat as MISSING
```

From the ADR list:
- **Next number**: highest existing number + 1, zero-padded to 4 digits; `0001` if none exist. **Collision guard (teams):** another session or teammate may add an ADR between now and the write. Immediately before the subagent writes, re-list `docs/adr/`; if the chosen `NNNN` already exists, bump to the next free number. **Never overwrite an existing ADR file** — and after writing, confirm you didn't land on a number a concurrent run also took (if the file you wrote isn't the only one with that number, renumber yours).
- **Filename title**: from the design topic, generate a kebab-case slug — max 5 words, no articles (a/an/the), lowercase. E.g. "We need a notification system" → `notification-system-approach`. Combine: `docs/adr/NNNN-kebab-title.md`.
- **Related ADRs**: read the first 20 lines of each existing ADR — enough to capture the title, status, and opening paragraph of Context — to check for overlap with the current design topic. Flag any that match.
- **Update/supersede detection**: if any existing ADR clearly overlaps the current design topic (same domain, same system, same decision), **before asking Round 1 questions**, present it to the engineer: "I found an existing ADR that may be relevant: `[path]` — [title]. Is this a **new** decision (creates a new ADR) or are you **updating/superseding** the existing one?" Wait for their answer. If update or supersede: set OPERATION accordingly, read the existing ADR in full, and skip Round 2 questions for in-place updates.

From the community skill scan:

**Workflow skills** (never treat as community skills): `triage`, `audit`, `architect`, `mvp`, `develop`, `verify`, `test`, `review`, `harden`, `document`, `debug`, `sync`, `status`.

This list is the workflow skills in this system. As additional workflow skills are added, update this list immediately or they will appear as community skills.

**Relevant community skills**: from the installed skill list, identify any whose name matches a technology involved in the design topic. Match heuristics:

| Design topic involves | Look for skills named |
|---|---|
| Next.js, React, UI, frontend, pages | `nextjs`, `react`, `tailwind`, `shadcn`, `radix` |
| Supabase | `supabase` |
| PostgreSQL, database, DB | `postgres`, `postgresql`, `prisma`, `drizzle` |
| Auth, login, sessions | `clerk`, `auth0`, `nextauth`, `lucia` |
| Payments | `stripe`, `lemonsqueezy` |
| Deployment, hosting | `vercel`, `railway`, `fly` |
| Testing | `vitest`, `playwright`, `jest` |

For each relevant installed skill found:
1. Read its `SKILL.md` in full (or first 120 lines if longer)
2. Mark it as **installed and relevant** — inject its content into the subagent prompt
3. Note which area its conventions should live in (root `AGENTS.md` or a nested `AGENTS.md`)
4. Check if root `AGENTS.md` already references this skill under `## Context files` or `## Rules` — if not, flag it as missing from the context files

For each **relevant but NOT installed** skill:
- Note it as a suggested install — will appear in ADR Follow-up

---

### Scope validation (before Round 1)

Before asking any MCQ questions, run these two checks **in order**. Check B must run before Check A.

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
3. Set Q4-equivalent to `Documenting a made decision`. Skip Round 2. Inject their answers as `DOCUMENTATION_CONTEXT` alongside the design topic.
4. Since Round 1 was skipped entirely on this path, inject R1 placeholder values as: `ANSWER_R1_Q1=N/A (documentation path)`, `ANSWER_R1_Q2=N/A`, `ANSWER_R1_Q3=N/A`, `ANSWER_R1_Q4=Documenting a made decision`.
5. Spawn the subagent with a note: "This is a documentation task. DOCUMENTATION_CONTEXT contains the engineer's account of the decision. Read existing code if SOURCE_FILE_COUNT > 0 to verify and supplement. Write the ADR documenting what was built — not re-evaluating options."

If they reply `no`: proceed to Check A and then Round 1 normally.

---

**Check A — Product vision vs. specific decision (runs second)**

A design topic is **product-scoped** if:
- It describes what the product *is* rather than what to *decide* (e.g. "a B2B SaaS that manages teams", "a marketplace for freelancers", "a social app for cyclists")
- No specific technical component, feature, or technology choice is named
- It would require 5+ separate ADRs to fully capture
- It uses business/product language, not engineering component language

A design topic is **decision-scoped** if it names a specific component, feature, or technical concern (e.g. "auth approach", "notification service", "team invitations feature", "should we use PostgreSQL or MongoDB").

**If product-scoped**: do not ask Round 1 yet. Instead:

1. Tell the engineer: "This describes a full product — /architect works one decision at a time. Let me help you pick the first foundational decision."
2. Based on the product type, generate 4 first-decision options and ask via `AskUserQuestion`:
   - question: "Which foundational decision should we design first?"
   - header: "First decision"
   - Options must be specific and relevant to the stated product type. Tailor them to what the engineer described:
     - **B2B SaaS**: Tech stack and deployment architecture / Multi-tenancy model (how organisations are isolated) / Auth and identity approach / Core domain data model (teams, users, roles)
     - **E-commerce**: Tech stack and deployment / Product catalogue and inventory model / Payment and checkout approach / Auth and user accounts
     - **Mobile app**: Tech stack and backend approach / Offline behaviour and sync strategy / Auth and identity / Push notification approach
     - **Data platform / analytics**: Ingestion architecture / Storage and warehouse strategy / Processing approach (batch vs stream) / Serving and query layer
     - **Generic fallback**: Tech stack and deployment architecture / Auth and identity approach / Core domain data model / [most important product-specific concern]
3. After the engineer selects: update the design topic to that specific decision and proceed to Round 1.

---

### Round 1 — Foundational questions (main model calls `AskUserQuestion`)

**Infer before asking.** Q1 (decision type) and Q2 (users) are usually derivable from the topic + codebase — infer them and *skip the question*. Only ask Q1/Q2 when genuinely ambiguous. **Q3 (constraints) and Q4 (settledness) are user-only — always ask these.** State your inferences back to the engineer in one line ("Reading this as a *feature* for *B2B* users — correct me if not") so a wrong inference is cheap to fix.

**Q1 — What type of decision is this?** (single-select — infer if possible)
- `Feature design` — designing a new feature from scratch
- `Architecture selection` — choosing tech stack or foundational architecture
- `System enhancement` — improving or changing something existing
- `Cross-cutting standard` — a pattern that affects the whole codebase (error handling, auth, logging)

**Q2 — Who are the primary users?** (single-select)
- `End consumers (B2C)` — public users, variable scale, UX matters most
- `Business users (B2B)` — company/internal users, power features matter
- `Developers (API / SDK)` — technical consumers, DX and reliability matter
- `Internal team only` — small fixed audience, rough edges acceptable

**Q3 — Which constraints matter most?** (multi-select)
- `Tight deadline` — speed of delivery is critical
- `Small team or limited expertise` — team is ≤ 5 engineers and/or must stay in known territory; minimize operational overhead
- `Cost or budget` — infra, licensing, or operational cost is a real constraint
- `Compliance / security` — GDPR, SOC2, HIPAA, or similar requirement applies

**Q4 — How settled is the direction?** (single-select)
- `Open exploration` — no preference; need full analysis and recommendation
- `Leaning one way` — have a preference but need validation and alternatives
- `Specific candidates` — choosing between 2–3 named options
- `Documenting a made decision` — decision is final; just write the ADR

---

### Round 2 — Deep questions (main model generates, then calls `AskUserQuestion`)

**Generate the questions from the feature — do not read them from a list.** The whole point is that the questions are specific to whatever is being designed. A fixed question bank is what made the old version feel generic. So:

**Your mandate (senior+ role):** you are the Staff/Principal engineer who will be blamed if this feature ships wrong. The ADR you produce is the **complete build spec** `/develop` implements from — every load-bearing decision must be settled here. Any dimension you leave blank becomes a question `/develop` is forced to ask mid-build, or worse, an assumption it guesses wrong. **Leaving a gap is the failure mode.** So be exhaustive, not minimal — cover *everything* a senior engineer would pin down before writing code.

**Step A — Enumerate every load-bearing dimension of this feature.** Walk this checklist (not all apply to every feature; add any feature-specific ones). For each, decide whether you can settle it yourself or must ask:

- **Functional scope & boundaries** — what's in, what's explicitly out, the key user flows and their happy/unhappy paths
- **Data model & persistence** — entities, fields, types, nullability, relationships, indexes, uniqueness, retention/deletion
- **Lifecycle & state machine** — states, valid transitions, who/what triggers each
- **API / interface surface** — endpoints or actions, inputs, outputs, status codes, versioning
- **Authentication & authorization** — who may do what; ownership, roles, multi-tenant scoping
- **Validation & business rules** — limits, quotas, invariants that must always hold
- **External integrations** — providers, webhooks, idempotency, reconciliation
- **Failure & edge cases** — concurrency, retries, timeouts, partial failure, empty/error/loading states
- **Performance & scale** — expected volume, pagination, async-vs-sync, caching
- **Security & compliance** — PII, encryption, audit logging, rate limiting, regulatory scope
- **Observability** — what to log, metrics, alerts
- **Configuration & secrets** — new env vars, feature flags, credentials
- **UX surface (if UI in scope)** — capture the *requirements* (what each screen must show/do, states, accessibility needs); leave pixel/layout detail to `/develop`

**Step B — Sort each dimension into INFER / ASK / RECOMMEND** (see *Asks vs acts*):
- **INFER** — answer it yourself from the prompt/codebase/AGENTS.md. Do not ask.
- **ASK** — only the engineer knows it (requirements, business rules, preferences, scope boundaries). These become questions.
- **RECOMMEND** — expertise decides it (provider/library/pattern/architecture). The subagent makes the call and justifies it; do **not** ask.

**Step C — Ask every ASK question, in as many batched rounds as it takes.** This is the heart of the skill — do not truncate to hit a number.
- Group the ASK questions by dimension and present them via `AskUserQuestion`, **up to 4 per call**. Run **multiple rounds** until every un-inferable, decision-relevant question is answered. A non-trivial feature legitimately needs 2–4 rounds (e.g. round 1 scope & data, round 2 auth & rules, round 3 integrations & edge cases). Stop only when there is genuinely nothing left that the engineer alone can settle — not at an arbitrary cap.
- Quality bar per question: maps to a real, feature-specific decision (never a generic placeholder like "how complex is the data model?"); concrete options drawn from the actual choices, each with a one-line tradeoff; multi-select where answers aren't exclusive.
- Between rounds, briefly fold prior answers in ("Given org-scoped roles, the next questions are about invitation flow…") so the rounds feel like one coherent interview, not a form.
- Before finishing: re-scan the Step A checklist and confirm no load-bearing dimension is still unanswered. If one is, ask it.

**Step D — Collect the RECOMMEND items** (the decisions you deferred to the subagent) as a list to inject into its prompt — it must decide each, state the pick + one-line why + the runner-up, and never echo it back as an open question.

**Fallback only:** if the feature is too vague to generate good questions from (rare — usually means Round 1 should have narrowed it), use the generic mode file keyed on Q1 as scaffolding: `questions/feature.md`, `questions/architecture.md`, `questions/enhancement.md`, `questions/cross-cutting.md`.

**Skip Round 2 entirely** when Q4 from Round 1 is `Documenting a made decision` — the direction is already settled, and deep-dive questions add friction with no benefit. Proceed directly to spawning the subagent.

**Enhancement mode guard**: if Q1="System enhancement" was selected in Round 1 AND SOURCE_FILE_COUNT=0: stop before Round 2. Tell the engineer:

"Enhancement mode reads existing code to understand what's being changed — but no source files were found in this project. What's the situation?
- A) The code exists in a different directory — tell me the path and I'll re-check.
- B) There is no existing implementation — in that case, [Feature design] or [Architecture selection] is the right starting point."

Wait for their answer. If (A): re-run the source file count for the given path. If (B): update Q1 to match their corrected intent and continue.

---

### Round 2 → Subagent spawn

After both rounds, read `agent-prompt.md` and `adr-template.md` (relative paths — the main agent resolves them). Fill the template **and inline the full `adr-template.md` text into the prompt** — the subagent writes the ADR from that structure and can't resolve skill paths itself. Then spawn:

- `model: "sonnet"`
- `description: "Design: <mode> — research and draft ADR"`
- Tools: `Read`, `Bash`, `Write`, `Edit`
- `prompt`: filled template with all engineer answers, context, the determined mode, and the injected ADR template

**Map Q1 answer to the exact MODE string to inject:**

| Q1 answer | MODE to inject |
|---|---|
| `Feature design` | `FEATURE` |
| `Architecture selection` | `ARCHITECTURE` |
| `System enhancement` | `ENHANCEMENT` |
| `Cross-cutting standard` | `CROSS-CUTTING` |

Inject into the template:
1. Design topic (from the user's original message)
2. All Round 1 answers (Q1–Q4)
3. All Round 2 answers — if Round 2 was skipped, inject: `"Round 2 skipped — [reason: Documenting a made decision / already-built documentation task]"` so the subagent knows this was intentional, not an error
3a. The **RECOMMEND items** generated in Round 2 (Step D) → inject into `RECOMMEND_ITEMS_OR_NONE` — the specific decisions the subagent must make and justify (provider, session strategy, etc.). If none were generated, inject `"none"`.
4. Context-file contents — `AGENTS.md` (canonical), or `CLAUDE.md` as fallback, or "MISSING"
5. Existing ADR list (filenames + first line of each)
6. Related ADR paths (flagged in pre-flight)
7. Next ADR number and file path
8. Source file count (so subagent knows if there's code to read)
9. Operation: `create` | `update` | `supersede`
10. Today's date (from pre-flight `date +%Y-%m-%d`)
11. Documentation context (if "already built" path was taken — the engineer's free-text answers about why this was chosen, alternatives, and tradeoffs)
12. Community skills: for each relevant installed skill, inject its full content under a labelled section. For each relevant but missing skill, list its name only. If no community skills are relevant, inject "none detected".

---

### After subagent completes

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
4. **Link the roadmap (after confirmation).** If `docs/features/index.md` exists and has a row for this feature, update that row's `ADR` cell to point at the new file (e.g. `[0007](../adr/0007-auth-approach.md)`) and, if the feature's first sub-task is "Decision (ADR)", tick it `[x]`. Edit only that cell/checkbox — never status or other rows. If there's no matching row, skip silently (an ad-hoc decision outside the roadmap).

/architect is complete when the engineer confirms the ADR. It does not invoke other skills.

---

### Update / Supersede path

If the task is to update or supersede an **existing** ADR:
- Pre-flight: read the existing ADR in full
- Skip Round 2 questions if operation is in-place update
- Tell the subagent: `update` or `supersede`
- If supersede: subagent creates new ADR AND updates old ADR's status to `Superseded by [NNNN](NNNN-title.md)`

---

## Reference files

- ADR template: `adr-template.md`
- Research subagent prompt: `agent-prompt.md`
- Round 2 questions are **generated per feature** (see Round 2, Steps A–D) — not stored
- Generic mode files (`questions/`) are a structural fallback only, used when the feature is too vague to generate from
