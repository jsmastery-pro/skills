# Ticket tracker

The work coming out of the workflow audit in [`../current-isssue.md`](../current-isssue.md).

One ticket per unit of work. Each ticket file stands alone: it carries the problem, the evidence, the fix, and how you know it is done, so you can open a fresh session on any single ticket and it has everything it needs. Nothing in a ticket depends on remembering an earlier conversation.

## How to use this

- Pick a ticket, open its file, hand the file to the agent.
- Update the `Status` line in that ticket file **and** the row in the table below when it changes.
- Statuses: `todo`, `in progress`, `blocked`, `needs your decision`, `done`, `dropped`.
- Work top to bottom within a phase. Across phases, finish Phase 1 before Phase 2 (see *Why this order*).
- Size is a rough bucket, not an estimate: `S` (a single focused edit), `M` (a few files, some judgment), `L` (open ended, needs a design decision first).

## Why this order

Phase 1 first because a test harness built before the fixes would capture the current broken output as its expected baseline. The mojibake in the report templates would become the golden file.

Phase 2 second because every defect in Phase 1 was found by reading, and almost all of them are mechanically detectable. Teaching the checker to catch them converts a one time audit into a permanent guard, cheaply. Phase 2 also covers the tier contract drift, which looks like a behavior problem but is really a cross file consistency problem a script can assert.

Phase 3 last because those items either change behavior (so you want the guards in place first) or need a decision from you before any code moves.

## Phase 1: confirmed defects

Mechanical, low risk, independently shippable. None of these change workflow behavior; they fix text that is already wrong.

| # | Ticket | Size | Status |
|---|---|---|---|
| 1 | [Mojibake in 17 report templates](ticket-1.md) | S | **done** |
| 2 | [`/check` frontmatter is missing `Edit` and `AskUserQuestion`](ticket-2.md) | S | todo |
| 3 | [Broken code fences in two skill files](ticket-3.md) | S | todo |
| 4 | [README headline diagram teaches the wrong greenfield order](ticket-4.md) | S | todo |
| 5 | [Hardcoded model name in the commit trailer](ticket-5.md) | S | todo |
| 6 | [Two skills claim ownership they violate](ticket-6.md) | S | todo |
| 7 | [Stale subagent references in `/document`](ticket-7.md) | S | todo |
| 8 | [Git integration is unreachable on brownfield](ticket-8.md) | M | todo |
| 9 | [Four small text defects](ticket-9.md) | S | todo |

## Phase 2: static guards

Turn the audit into something the build does on its own. All of this is deterministic; no model runs, no token cost.

| # | Ticket | Size | Status |
|---|---|---|---|
| 10 | [Add four lint guards to the portability checker](ticket-10.md) | M | todo |
| 11 | [Assert the tier contract is stated consistently](ticket-11.md) | M | todo |

## Phase 3: design decisions and the behavioral harness

These change how the workflow behaves, or need you to make a call first. Do not start them before Phase 2 lands.

| # | Ticket | Size | Status |
|---|---|---|---|
| 12 | [Give the tier contract one source of truth](ticket-12.md) | M | blocked by 11 |
| 13 | [Decide what `done` means at the GA tier](ticket-13.md) | S | needs your decision |
| 14 | [Stop the house output style from governing product copy](ticket-14.md) | M | needs your decision |
| 15 | [Scope and build the behavioral harness](ticket-15.md) | L | blocked by 10, 11 |

## Ticket file shape

Every ticket file uses the same headings, so a fresh session finds what it needs in a fixed place:

```markdown
# Ticket N: <title>

**Status:** todo
**Phase:** 1
**Size:** S
**Depends on:** none
**Files touched:** <paths>

## Problem
<what is wrong, in two or three sentences>

## Evidence
<file:line pointers, verified, not inferred>

## Fix
<what to change>

## Done when
<a checkable condition, not a feeling>

## Notes
<anything the next session needs and cannot see from the files>
```
