# Ticket 7: Stale subagent references in `/document`

**Status:** todo
**Phase:** 1
**Size:** S
**Depends on:** none
**Files touched:** `skills/document/SKILL.md`

## Problem

`/document` was refactored so the main thread writes the document itself, with a read only `scout` allowed to do heavy diff reading and nothing more. Two instructions from the previous design survived the refactor and still tell the skill to hand work to a writer subagent that no longer exists in the flow.

A model reading the file gets contradictory instruction about who does the writing. The postmortem case is the one that matters: the surviving line is the guardrail against inventing an incident timeline, and it is currently addressed to nobody.

## Evidence

The current design, `skills/document/SKILL.md:91`:

> "Follow `agent-prompt.md` and write the document yourself. **Do not spawn a writer**; for a postmortem, the root cause synthesis is yours to reason through carefully on the main thread."

The leftovers:

- `skills/document/SKILL.md:85` "Pass the resolved range/version to the subagent."
- `skills/document/SKILL.md:87` "The subagent must not invent timeline entries or causes beyond what they give."

## Fix

Rewrite both lines to address the main thread.

Line 85 becomes a note to carry the resolved range and version forward into the write step, where it is already listed as input 7 at `skills/document/SKILL.md:100`.

Line 87 is the important one. It is a real constraint that must survive, not be deleted: the writer must not invent timeline entries or causes beyond what the engineer supplied. Reword it to bind the main thread. Check whether `skills/document/agent-prompt.md` already carries the same rule; if it does, point at it instead of restating it, per the "state a rule once" convention in `docs/conventions.md`.

While in the file, sweep for any other pre refactor language. Search `skills/document/` for "subagent", "spawn", and "pass to", and confirm each remaining hit refers to the `scout` doing diff reading and nothing else.

## Done when

- No line in `skills/document/` assigns writing, synthesis, or a constraint to a subagent.
- The "do not invent timeline entries or causes" rule still exists and is addressed to whoever actually writes.
- `npm run check` passes.

## Notes

Worth a quick look at the same class of leftover in the other refactored skills. `/architect`, `/sync`, `/audit`, and `/test` all moved writing to the main thread at some point. Search each for "the subagent" and confirm every hit refers to a read only helper. If you find more, note them here rather than expanding this ticket.
