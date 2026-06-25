# Tier Decision Guide

## Before triage — new product or new slice

`/triage` sizes **one change**. If the engineer is starting a whole product or a fresh batch of features ("I want to build X"), that isn't one change — point them to **`/mvp`** first to produce the feature roadmap (`docs/features/index.md`), then triage each feature off that list one at a time.

In the playbooks below, `/architect` runs **only when a load-bearing decision is owed** (a new provider, data model, or cross-cutting pattern). For a medium/full change that reuses already-decided patterns, `/develop`'s ADR gate will confirm none is needed and skip straight to building.

## Greenfield vs brownfield order (`/audit` vs `/architect`)

The first two steps **invert** depending on whether code exists yet:

- **Brownfield** (existing codebase): `/audit` → `/architect` → … — understand what's there *before* deciding the change. This is the order shown in the playbooks below.
- **Greenfield** (new project): `/mvp` → `/architect` → `/audit` → `/develop` → … — decide the foundational stack **first** (`/architect`'s ARCHITECTURE ADR), *then* `/audit` seeds the root `AGENTS.md` from that decision. Running `/audit` before the stack is chosen would seed an empty/placeholder stack.

Either way the stack stays correct: `/audit` reconciles root `AGENTS.md`'s `## Stack` from the architecture ADR whenever it runs, and `/sync` flags it if root drifts from the ADR — so a wrong order self-corrects on the next pass.

## Task shape — build vs fix

Before sizing the tier, decide what *kind* of task this is — they take different paths:

- **Build** (a feature, change, or addition): use the tiered playbooks below.
- **Fix** (something is broken, failing, throwing, or behaving wrong — "fix the bug where…", "X errors when…", "the test fails", "it's not working"): this is a **defect**, not a build. Route it to **`/debug`** (root-cause investigation) first, then `/test` (regression) → `/sync`. Don't send a bug down the build playbook — `/develop` assumes you know what to build; `/debug` assumes you don't yet know why it broke.
  - Fix playbook: `/debug` → `/test` → `/sync` (add `/verify` if the fix touches a user-facing flow; escalate to `/architect` only if the bug exposes a flawed decision rather than a coding mistake).

The tiers below still apply to a fix for **severity/process** (a payments bug is `full`), but the *skill path* is the fix playbook, not build.

## Tier definitions

### just-do-it
**All** of the following must be true:
- Change is a one-liner, typo fix, config value, or copy update
- Fully reversible with a single revert
- No production risk if wrong
- Affects one file, no shared systems

Playbook: *(no skills — act directly)*

---

### lean
**Most** of the following are true, and **none** of the `full` triggers apply:
- Well-understood, self-contained change
- Single area of the codebase
- Low blast radius; easy to revert
- Does not touch auth, payments, migrations, or shared infra

Playbook: `/develop` → `/verify` → `/test` → `/document`

---

### medium
**Any** of the following:
- Cross-cutting change (multiple packages or areas)
- New external dependency or third-party integration
- Touches shared state, APIs, or data models
- Moderate blast radius or non-trivial rollback

Playbook: `/audit` → `/architect` → `/develop` → `/verify` → `/test` → `/review` → `/document`

---

### full
**Any** of the following:
- Production-facing auth, payments, data migration, or compliance scope
- Large refactor or architectural change
- Breaking API change or infrastructure modification
- High blast radius; difficult or risky to reverse
- Security-sensitive surface

Playbook: `/audit` → `/architect` → `/develop` → `/verify` → `/test` → `/harden` → `/review` → `/document` → `/sync`

`/debug` is **on-demand**, not a playbook step: invoke it whenever `/verify` or `/test` surfaces a failure, or any time behavior is wrong and the cause isn't obvious.

`/status` is also **on-demand**: run it to orient before starting (especially when resuming a paused session or working in a shared repo) — it reports git state, roadmap progress, and collaboration hazards (behind the remote, a feature someone else is mid-build on).

---

## Severity definitions

| Severity | Meaning |
|---|---|
| low | Wrong outcome is annoying but harmless and easy to fix |
| medium | Wrong outcome degrades a feature or delays users |
| high | Wrong outcome breaks a user-facing flow or causes data loss |
| critical | Wrong outcome causes an outage, data breach, or compliance violation |

## Escalation rule

When uncertain between two tiers, always pick the higher one. Never downgrade based on confidence alone — only downgrade when the task description explicitly rules out every trigger for the higher tier.

## Ambiguous range resolution

Some tasks sit between two tiers. Resolve as follows:

| Ambiguous case | Resolution |
|---|---|
| Seems lean but touches an API | medium |
| Seems medium but touches auth or payments | full |
| Seems medium but has a data migration | full |
| New dependency with no security surface | medium |
| New dependency that handles credentials or PII | full |

When in doubt, go full. A cautious playbook costs an hour; an under-triaged production incident costs much more.

## Common patterns

| Pattern | Tier |
|---|---|
| Fix a typo in a UI label | just-do-it |
| Update a hardcoded config value | just-do-it |
| Fix a failing test (logic error, no behaviour change) | just-do-it |
| Add a new isolated UI component | lean |
| Add logging to an existing service | lean |
| Upgrade a dependency (patch or minor, no breaking changes) | lean |
| Add a new API endpoint (internal) | medium |
| Add a new external API integration | medium |
| Update a database schema (additive) | medium |
| Upgrade a dependency (major version with breaking changes) | medium |
| Change a feature flag default (production) | medium |
| Refactor auth middleware | full |
| Add a third-party payment provider | full |
| Migrate a large data set | full |
| Remove or rename a public API field | full |

## Re-triage rule

If unexpected complexity surfaces mid-task (e.g. a lean task turns out to touch shared infra), stop and re-run `/triage` with the updated understanding before continuing. Never silently upgrade scope without a new triage confirmation.
