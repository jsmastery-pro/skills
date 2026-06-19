# ADR Template

File path: `docs/adr/NNNN-kebab-case-title.md`

---

=== ADR TEMPLATE START ===
# NNNN. Title (concise, noun-phrase form — e.g. "Use PostgreSQL for primary storage")

**Date**: YYYY-MM-DD
**Status**: Proposed

## Context

<What is the problem or decision to be made? What forces are at play — technical constraints,
team capabilities, cost, performance requirements, compliance? What is the consequence of not
deciding? 2–4 paragraphs. Do not mention options here — only the problem space.>

## Options considered

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

**Chosen option**: Option N — <Name>

<One sentence stating the decision clearly.>

**Implementation skills**: `<skill-name>` (`.claude/skills/<skill-name>/`) · `<skill-name>` (`.claude/skills/<skill-name>/`)
<!-- List every installed community skill that informed this design. The engineer reads this field during implementation to know which skill conventions to apply. Omit line entirely if no community skills were used. -->

## Rationale

<Why this option over the others? Reference the specific constraints and forces from Context.
Do not repeat the pros/cons list — explain the reasoning. 1–3 paragraphs.>

<!-- Feature design mode only. Include immediately after Rationale. -->
## Feature design

**Data model sketch**:
<Entities, key fields, nullable/required, FK relationships, unique constraints>

**State transitions** (if applicable):
<e.g. order: draft → submitted → paid → fulfilled — omit if no state machine>

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /resource | POST | field:type (req) | id, status | bearer | 409, 422 |

**Key invariants**:
<Rules that must always hold — enforced at application or DB layer>

**Security model**:
<Who can read/write what — roles, ownership, public/private. Name compliance scope if applicable.>

**Configuration required**:
- `ENV_VAR_NAME` — purpose (omit section if no new env vars or credentials are needed)

**Acceptance criteria**:
- <Observable, testable outcome — what confirms the feature is complete and correct>
- <Edge case or failure that must be handled correctly>

**Critical test scenarios**:
- Happy path: <main flow end to end>
- Failure case: <most important failure — concurrency, timeout, invalid state>
- Auth/permission: <who is denied and what they receive>

<!-- Architecture mode only. Include immediately after Rationale. -->
## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Language | | |
| Framework | | |
| Primary DB | | |
| Auth | | |
| Hosting | | |
| Observability | | |

## Consequences

**Positive**:
- <what improves>

**Negative / tradeoffs**:
- <what gets worse or costs more>

**Neutral**:
- <notable side-effects — migrations needed, new patterns to learn, etc.>

## Follow-up

- [ ] <Action item or open question>
<!-- Omit section if there are no follow-up actions. -->

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
// The one right way — concrete example
```

**Replaces**:
- <Pattern that is now wrong>

**Enforcement**:
<Lint rule / TypeScript type / other — and where it is configured>

**Rollout**:
<New code immediately | single migration PR | gradual migration schedule>

**Exceptions**:
<When the standard does not apply, or "None">

=== ADR TEMPLATE END ===

---

## Filename conventions

- Format: `NNNN-kebab-case-title.md`
- NNNN: zero-padded 4-digit number, auto-incremented
- Title: lowercase, hyphens, no articles at the start ("use-postgres" not "the-use-of-postgres")
- Examples: `0001-use-postgresql-for-primary-storage.md`, `0002-adopt-feature-flags-for-rollout.md`

## Status values

| Status | Meaning |
|---|---|
| `Proposed` | Written but not yet accepted by the team |
| `Accepted` | Team has agreed to implement this decision |
| `Deprecated` | No longer applicable but not replaced |
| `Superseded by [NNNN](NNNN-title.md)` | Replaced by a newer ADR |

## Writing rules

- Context describes the problem, not the solution
- Each option must be described fairly — do not write straw-man alternatives
- Rationale must reference specific forces from Context, not just repeat pros/cons
- Consequences must include negatives — an ADR with only positives is not credible
- Follow-up items are optional but recommended for full-tier decisions
- Keep the whole ADR under ~120 lines including optional sections — if it grows beyond that, the decision scope is too large; split into two ADRs
