# Tier Decision Guide

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

Playbook: `/test` → `/document`

---

### medium
**Any** of the following:
- Cross-cutting change (multiple packages or areas)
- New external dependency or third-party integration
- Touches shared state, APIs, or data models
- Moderate blast radius or non-trivial rollback

Playbook: `/understand` → `/design` → `/test` → `/review` → `/document`

---

### full
**Any** of the following:
- Production-facing auth, payments, data migration, or compliance scope
- Large refactor or architectural change
- Breaking API change or infrastructure modification
- High blast radius; difficult or risky to reverse
- Security-sensitive surface

Playbook: `/understand` → `/design` → `/test` → `/harden` → `/review` → `/document` → `/sync`

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
