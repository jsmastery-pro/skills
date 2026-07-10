# Postmortem Template

Write a blameless incident postmortem to `docs/postmortems/<DATE>-<slug>.md`. Build it from INCIDENT_FACTS (the engineer's account) plus any root cause detail in the diff or a /debug record. Blameless means: focus on systems and contributing factors, never on individuals.

## Structure

```markdown
# Postmortem: <short incident title> (<DATE>)

| | |
|---|---|
| **Severity** | <SEV1 to SEV4 / critical to low> |
| **Duration** | <start → resolution, with timezone> |
| **User impact** | <who was affected and how, be specific and quantified if known> |
| **Status** | Resolved / Monitoring |

## Summary

<3 to 5 sentences a busy reader can absorb: what happened, the impact, the root cause, and the fix.>

## Timeline

_All times <timezone>._

- **<time>**: <event: what happened or was observed>
- **<time>**: <detection: how the team found out>
- **<time>**: <key diagnostic or mitigation step>
- **<time>**: <resolution>

## Root cause

<The actual technical cause, the chain from trigger to failure. Distinguish the trigger from the underlying weakness that let it become an incident.>

## Contributing factors

- <what made it worse, slower to detect, or harder to fix, e.g. missing alert, no timeout, unclear ownership>

## What went well

- <fast detection, clean rollback, good tooling (credit the system, not heroes)>

## Action items

| Action | Type | Owner | Priority |
|---|---|---|---|
| <specific, verifiable fix> | Prevent / Detect / Mitigate | <role/team> | <P0 to P2> |

## Lessons

<The durable takeaway. If a spec or a concrete follow-up should come out of this, name it.>
```

Rules:
- Blameless throughout, "the deploy lacked a health check", never "X forgot to add a health check".
- The timeline is facts with timestamps, not analysis. Keep analysis in Root cause / Contributing factors.
- Every action item is specific and assignable, and tagged Prevent (stop recurrence), Detect (find it faster), or Mitigate (reduce impact). No vague "be more careful".
- If the root cause maps to a systems failure mode, recommend a concrete follow-up action; if a past decision contributed, note the spec.
- Only state facts present in INCIDENT_FACTS or the change; mark genuine unknowns as "Unknown, to investigate" rather than guessing.
