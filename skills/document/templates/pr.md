# PR Template

Produce a title and body. Always return both as text (the skill shows them in the chat). Touch `gh` only per **GH_ACTION**: `none` → chat only; `gh pr create` → create the PR with this body; `gh pr edit` → update the existing PR's body. Never invent a different gh command.

## Title

One line, imperative mood, ≤ 72 chars. Match the project's commit convention if `AGENTS.md` specifies one (e.g. `feat:`, `fix:`). Examples: `feat: add rate limiting to the orders API`, `fix: prevent double-charge on retried checkout`.

## Body structure

```markdown
## What

<1 to 3 sentences: what this PR does, in plain terms.>

## Why

<The motivation. Link the spec if one governs this change, e.g. "Implements docs/specs/0007-rate-limiting.md". Reference the issue/ticket if known.>

## Changes

- <key change, grouped logically, not a raw commit dump>
- <key change>

## How to test / verify

- <the steps or commands a reviewer runs to confirm it works>
- <what they should observe>

## Risk & rollout

<Blast radius, migrations, feature flags, or rollback notes. Write "Low risk, no migrations, no flags." when that's true.>

## Notes for reviewers

<Anything that helps the review: a tricky decision, a deliberate tradeoff, an area wanting extra eyes. Omit if nothing.>
```

Rules:
- Group changes by intent, not by file or commit. A reviewer wants the story, not `git log`.
- Keep "What" skimmable. A busy reviewer reads it first.
- If review findings exist for this change, reference accepted residual risks under "Risk & rollout".
- Do not invent test steps. Derive them from the actual tests or the change's behaviour.
