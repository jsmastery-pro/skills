# Spec Template

File path: `docs/specs/NNNN-kebab-case-title.md`

---

=== SPEC TEMPLATE START ===
# NNNN. Title (concise, noun-phrase form, e.g. "Adopt a relational database for primary storage")

**Date**: YYYY-MM-DD
**Status**: Proposed

## Summary

<!-- HUMAN QUICK READ (plain words, no dashes). Everyone reads this first, technical or not. -->
<Plain language overview in 2 to 4 short sentences. Say what this decision is, why it was made,
and what it means for building. A busy reader (technical or not) should get the gist in about 20
seconds. Explain any technical term in plain words (a short gloss in parentheses). Use no dashes
of any kind.>

## Context

<!-- DECISION RECORD (the WHY, human context; in a directory spec this section lives in rationale.md, not index.md; /develop skips it) -->
<What is the problem or decision to be made? What forces are at play (technical constraints,
team capabilities, cost, performance requirements, compliance)? What is the consequence of not
deciding? 2 to 4 paragraphs. Do not mention options here, only the problem space.>

## Requirements

<!-- BUILD SPEC (the WHAT, /develop builds to this; /check verify checks against it) -->
<!-- The contract. Seed the user stories + acceptance criteria from the scope feature's intent
     and its acceptance-criteria seeds when a scope row exists, then refine with the engineer.
     Acceptance criteria are the contract /develop builds to and /check verify checks. -->

**User stories**:
- As a <role>, I want <capability> so that <outcome>.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: <observable, testable outcome that must hold for the feature to be correct>
- **AC-2**: <the key edge case or failure that must be handled, e.g. "retry after timeout returns the same result (idempotent)">
- **AC-N**: <…>

<!-- Every task in ## Build plan references the AC(s) it satisfies, and every scenario in
     Critical test scenarios maps to an AC. No AC without a build task; no build task without an AC. -->

## Options considered

<!-- DECISION RECORD (the WHY, human context; in a directory spec this section lives in rationale.md, not index.md; /develop skips it) -->
### Option 1: <Name>

<One paragraph describing this option.>

**Pros**:
- <benefit>

**Cons**:
- <drawback or tradeoff>

### Option 2: <Name>

<One paragraph describing this option.>

**Pros**:
- <benefit>

**Cons**:
- <drawback or tradeoff>

<!-- Add Option 3 / Option 4 if relevant. Maximum 4 options. Omit section entirely only
     when documenting a decision already made with no alternatives considered. -->

## Decision

<!-- BUILD SPEC (the WHAT, /develop reads this) -->
**Chosen option**: Option N: <Name>

<One sentence stating the decision clearly.>

**Implementation skills**: `<skill-name>` (`<owner>/<repo>`, `<skills-dir>/<skill-name>/`) · `<skill-name>` (`<owner>/<repo>`, `<skills-dir>/<skill-name>/`)
<!-- Every installed community skill that informed this design; the engineer reads it during implementation. `<skills-dir>` is the project's real skills dir (`.claude/skills/`, `.agents/skills/`, or `skills/`), never hardcoded; `<owner>/<repo>` is the tool-agnostic identity. Omit the line if no community skills were used. -->

## Rationale

<!-- DECISION RECORD (the WHY, human context; in a directory spec this section lives in rationale.md, not index.md; /develop skips it) -->
<Why this option over the others? Reference the specific constraints and forces from Context.
Do not repeat the pros/cons list, explain the reasoning. 1 to 3 paragraphs.>

<!-- Feature design mode only. Include immediately after Rationale. -->
<!-- BUILD SPEC (the WHAT, /develop reads this) -->
## Feature design

**Data model sketch**:
<Entities, key fields, nullable/required, FK relationships, unique constraints>

**State transitions** (if applicable):
<e.g. order: draft → submitted → paid → fulfilled. Omit if no state machine>

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /resource | POST | field:type (req) | id, status | bearer | 409, 422 |

**Value sourcing** (every value each action produces, computes, or displays names where it comes from; a required value with no named source is an undecided input, resolve it before this spec is done, do NOT leave the build to invent it):
| Action | Value produced / displayed | Source |
|---|---|---|
| <action> | <the value> | <an input param · a DB column · derived from X · decided in spec N> |
<!-- List every value each acceptance criterion needs this action to produce, not just the obvious ones. The point is to expose inputs the API table omits: a value the AC requires whose source is not an input, a column, or a prior decision is a gap. Diverse illustrations (pattern, not a checklist): a read that must show "the user's local day" names where the timezone comes from; a total shown to a user names the rounding/currency rule's source; a per-tenant list names how the tenant is resolved. Keep it procedural: trace each produced value to a named source; never work from a fixed list of "sources to check". -->

**Key invariants**:
<Rules that must always hold, enforced at application or DB layer>

**Security model**:
<Who can read/write what. Roles, ownership, public/private. Name compliance scope if applicable.>

**Configuration required**:
- `ENV_VAR_NAME`: purpose (omit section if no new env vars or credentials are needed)

<!-- Acceptance criteria are NOT restated here; they live once, IDed, in ## Requirements (the contract).
     Reference their IDs (AC-N) from the test scenarios below and from ## Build plan tasks. -->

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: <main flow end to end>, verifies **AC-N**
- Failure case: <most important failure, such as concurrency, timeout, invalid state>, verifies **AC-N**
- Auth/permission: <who is denied and what they receive>, verifies **AC-N**

<!-- Architecture mode only. Include immediately after Rationale. -->
<!-- BUILD SPEC (the WHAT, /develop reads this) -->
## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Language | | |
| Framework | | |
| Primary DB | | |
| Auth | | |
| Hosting | | |
| Observability | | |

<!-- BUILD SPEC (the WHAT, /develop builds these in order; /check verify checks the AC each satisfies) -->
## Build plan

<!-- Ordered build tasks DERIVED from the surface above (data model, API, stack) and the acceptance
     criteria in ## Requirements. Each task names the AC(s) it satisfies, so every AC traces to at least
     one task and every task traces to an AC. The ORDER and slicing reflect the project's build approach
     (Tracer Bullet, Skateboard, Facade, Journey, or a variant, read in pre-flight), reasoned about for
     this feature rather than by a fixed recipe. The data-model migration is normally task 1 (from the
     confirmed data model) and stays early; a UI-first Facade/prototype approach may lead with the shell.
     When a scope feature row links this spec, these tasks are also written into that row's sub-tasks;
     with no scope row, they live here as the source of truth (see /architect's derive-tasks step). -->

1. <Build task, e.g. "Create the migration for the confirmed data model">, satisfies **AC-1**
2. <Build task>, satisfies **AC-2**, **AC-3**
N. <Build task>, satisfies **AC-N**

## Consequences

<!-- BUILD SPEC (the WHAT, /develop reads this: the constraints the build must honor) -->
**Positive**:
- <what improves>

**Negative / tradeoffs**:
- <what gets worse or costs more>

**Neutral**:
- <notable side-effects, migrations needed, new patterns to learn, etc.>

## Follow-up

- [ ] <Action item or open question>
<!-- Omit section if there are no follow-up actions. -->

## References

<!-- INCLUDED ONLY WHEN THE ENGINEER OPTED IN (REFERENCES_LEVEL is `sources` or `sources+links`).
     When REFERENCES_LEVEL is `none`, omit this whole section AND add no (basis: ...) citations
     anywhere in the spec. The Rationale (the reasoning itself) still stays; only the citations and
     links are gated, so a `none` document reads clean.
     What this decision is grounded in. Group as below; omit empty groups. NEVER fabricate a URL,
     name the source/practice instead. The *Links* group appears only at the `sources+links` level,
     and every link in it must have been web verified during the Stage (c) landscape / tool-discovery
     check (at `sources` there is no Links group). No link is fetched at write time or re-fetched
     later; these links are here for a human to follow. -->

**Project sources** (verifiable, in this repo):
- <e.g. `AGENTS.md`, the auth convention · spec 0003 · an installed community skill · already on the project's BaaS>

**Practices & standards**:
- <named practice/principle the decision rests on, e.g. idempotency keys for money ops · strangler pattern · OWASP session guidance>

**Links** (web verified only, `sources+links` level only):
- <Title: https://real-fetched-url> · <or "none verified">

<!-- Enhancement mode only, when migration is non-trivial. -->
## Migration plan

**Strategy**: <strangler | big bang | feature-flagged | no migration needed>
**Phases**:
1. <Phase 1>
2. <Phase 2>
**Rollback**: <how to revert if a phase fails>
**Risks**: <what could go wrong>

<!-- Cross-cutting mode only. Include immediately after Rationale. -->
## Standard definition

**Canonical pattern**:
```<language>
// The one right way, concrete example
```

**Replaces**:
- <Pattern that is now wrong>

**Enforcement**:
<Lint rule / compile-time type / other, and where it is configured>

**Rollout**:
<New code immediately | single migration PR | gradual migration schedule>

**Exceptions**:
<When the standard does not apply, or "None">

=== SPEC TEMPLATE END ===

---

## Filename conventions

- Format: `NNNN-kebab-case-title.md`
- NNNN: zero padded 4 digit number, incremented automatically
- Title: lowercase, hyphens, no articles at the start (`use-object-storage` not `the-use-of-object-storage`)
- Examples: `0001-adopt-relational-db-for-primary-storage.md`, `0002-adopt-feature-flags-for-rollout.md`

## Status values

The spec's status mirrors its feature's build lifecycle (scope: planned→`Proposed`, in-progress→`In Progress`, done→`Accepted`):

| Status | Meaning |
|---|---|
| `Proposed` | spec written, decision agreed, feature NOT yet built. Set by /architect at creation. |
| `In Progress` | The feature governed by this spec is being built. Set by /develop when the feature goes in-progress. |
| `Accepted` | The feature is built and verified (scope `done`), the "done and dusted" state. A spec is NOT `Accepted` until its feature ships. Set by /develop on completion or reconciled by /sync. |
| `Superseded by [NNNN](NNNN-title.md)` | Replaced by a newer spec |

**Which status behavior applies depends on whether a buildable scope feature links this spec:**
- **Feature linked spec** (a `docs/scope/` row's `spec` cell points to it) → **feature mirrored**: `Proposed` → `In Progress` → `Accepted`, tracking the feature's build lifecycle (table above). Confirmation ratifies content but does not set `Accepted`; /develop advances it.
- **Standalone decision spec** (a foundational/stack or cross cutting standard with **no linked buildable feature**) → **decision status**: `Proposed` when written, then **`Accepted` once the engineer ratifies it** (on confirmation). There's no build phase to gate on, so it is not feature mirrored.
- **spec documenting already shipped work** (the "already built" path, or a feature already `existing`) → **born `Accepted`**, it describes reality that already exists.

**Umbrella child specs carry no lifecycle status.** In an umbrella directory (`NNNN-<x>/`), only the `index.md` has a `**Status**:` line, it mirrors the feature. The **child specs are spec content**, so **omit the `**Status**:` line on children** (they're governed by the umbrella). `/develop` and `/sync` advance the umbrella `index.md`'s status only, never a child's.

**A directory spec splits build spec from reasoning.** A directory spec (`NNNN-<x>/`) always contains exactly two core files, plus optional extras:
- **`index.md`**: the build spec `/develop` reads: `## Summary`, `## Requirements`, `## Decision`, the design/spec section, `## Build plan`, `## Consequences`, `## Follow-up`, and a one line `## Rationale` pointer to `rationale.md`. For an umbrella, `index.md` also opens with a **`## Structure`** section listing and linking every child spec (one line each: what it is + which decision it supports) and holds any **cross child contract**.
- **`rationale.md`**: everything in the decision record that `/develop` does not need: `## Context`, `## Options considered`, `## Rationale`, the `## References` section, and any supporting evidence (inventories, audits, a landscape scan). There is no separate `research/` folder; bulky evidence goes here, under its own subheading. This is read by humans and by `/architect` on update or supersede, never during a build.
- Optional: **`verify.md`** (verify steps), and **child specs** `NNNN-<child>.md` for an umbrella (each sufficient on its own to build from, each with a short inline rationale rather than its own `rationale.md`; promote a child to its own directory only if it grows heavy).

## Audience split: build spec vs decision record

A spec serves two audiences, and its sections divide cleanly between them:

- **Build spec** (what `/develop` reads to build): **`## Requirements`** (the acceptance criteria contract), **`## Decision`**, the design/spec section (**`## Feature design`** for a FEATURE spec, **`## Proposed stack`** for an ARCHITECTURE spec, or the equivalent spec table, e.g. `## Standard definition`), **`## Build plan`** (the ordered tasks derived from the surface + acceptance criteria), and **`## Consequences`** (the constraints the build must honor). This is the WHAT, the implementable spec. The **acceptance criteria in `## Requirements` are the contract `/develop` builds to and `/check verify` checks.**
- **Decision record** (human / future decision maker context, the WHY): **`## Context`**, **`## Options considered`**, **`## Rationale`**, and the **`## References`** section. This is decision history, not build input; `/develop` skips it. (**`## Summary`** stays with the build spec in `index.md`, it is the human quick read that orients before the spec.)

Where each audience's sections physically live depends on the spec shape:
- **Single file spec** (`NNNN-title.md`): both audiences share the one file; the decision record sections stay inline, written tight. Small specs are not split.
- **Directory spec** (`NNNN-title/`): the build spec is `index.md`, the decision record moves to `rationale.md`. The full reasoning is never removed, only relocated so a build never loads it.

## Writing rules

- **Be concise: state each point once.** This spec is loaded by later builds, so words cost tokens every time. Write tight technical prose: prefer bullets and short sentences over long paragraphs with many clauses, never repeat the same point across Context, Rationale, and Consequences, and never pad. Brevity applies to the reasoning most; the build spec sections stay complete but trimmed of waffle.
- Summary is the human quick read: plain words, 2 to 4 short sentences, no dashes; it comes first so everyone gets the gist fast
- Context describes the problem, not the solution; keep it to the forces that actually shaped the choice
- **`## Options considered`**: describe each option fairly (no straw men) but compactly, a one to two sentence description plus a tight pros/cons of only the load bearing tradeoffs, not an essay per option
- Rationale must reference specific forces from Context, not just repeat pros/cons; a few sentences, not paragraphs
- Consequences must include negatives, a spec with only positives is not credible
- Follow-up items are optional but recommended for high risk or foundational decisions
- **One decision per spec: keep it focused and scannable.** Length follows the decision, not a line count: don't pad, and never cut a required design field (data model, state machine, full API table, security model, acceptance criteria) to make the record shorter. If it needs *multiple independent decisions*, or the design won't fit cleanly in one scannable spec, split it into an **umbrella spec + child specs** (the directory shape) rather than letting one file sprawl.
