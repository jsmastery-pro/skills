# Ticket 6: Two skills claim ownership they violate

**Status:** todo
**Phase:** 1
**Size:** S
**Depends on:** none
**Files touched:** `skills/document/SKILL.md`, `skills/check/modes/review.md`, `skills/check/modes/verify.md`

## Problem

`/document` and `/check review` both state in their Artifact ownership section that they write nothing beyond their own output, then later instruct themselves to edit the scope file. `/check verify` edits both the scope and a spec status line while its ownership section says it owns no durable files at all.

This matters more here than it would in a normal codebase. The whole trust model of the workflow is that ownership is fixed and each file has exactly one writer. The ownership tables are what a model reads to decide whether it is allowed to touch something. A table that is wrong in the permissive direction is a bug; a table that is wrong in the restrictive direction, as here, teaches the model that an instruction later in the same file is a violation.

## Evidence

### `/document`

- `skills/document/SKILL.md:30` "PR text, `CHANGELOG.md`, `docs/releases/`, `docs/postmortems/` (owned by this skill). It writes nothing else."
- `skills/document/SKILL.md:111` report template includes "Scope: ticked `Document it`".
- `skills/document/SKILL.md:114` "and ticks the `Document it` box per the closing gate above, the only scope edit it makes". Note this refers to a "closing gate above" that is not actually written anywhere in the file, which is a second, smaller defect in the same place.

### `/check review`

- `skills/check/modes/review.md:13` "Owns review findings (`docs/reviews/`). Does not write code, tests, specs, or the `AGENTS.md`/`CLAUDE.md` context files."
- `skills/check/modes/review.md:23` "`docs/reviews/<YYYY-MM-DD>-<branch>.md`, created by this skill only."
- `skills/check/modes/review.md:137` "Tick the scope box (closing gate). ... tick its `Review it` box".

### `/check verify`

- `skills/check/modes/verify.md:17` "Owns no durable files. Chat output only".
- `skills/check/modes/verify.md:140` to `146` ticks the scope `Verify it` box, ticks steps inside the feature's `verify.md`, and mirrors the spec `**Status**:` line to `Accepted`.

## Fix

Correct the three ownership statements so they describe what the skills actually do. The scope edits are legitimate and intentional; the tables are what is wrong.

For each, state the narrow grant explicitly rather than deleting the restriction. The restriction is doing useful work, it is just incomplete. Shape:

> Owns `<its own artifact>`. One narrow exception into the scope: ticks this feature's `<box name>` box in `docs/scope/`, and nothing else there. Writes no code, tests, or specs.

For `/check verify` also name the spec status line explicitly, since that is a write into a file `/architect` owns and it deserves to be visible in the table, the way `/develop` already does it at `skills/develop/SKILL.md:26`.

While in `document/SKILL.md`, either write the missing closing gate that line 114 refers to, or change line 114 to stop referring to one. Match the shape `/test` and `/check` use: state what you ticked in the report, and say so plainly when no scope row matched.

## Done when

- No skill file contains an ownership claim contradicted by an instruction in the same skill.
- Each of the three skills names its scope edit in its ownership section.
- `skills/document/SKILL.md` either has the closing gate it references, or no longer references one.
- `npm run check` passes.

## Notes

Cross check `docs/workflow-guide.md:57` to `62`, the "Who owns which file" table. It does not list the scope ticks made by `/check verify`, `/check review`, `/test`, or `/document` either. Fix that table in the same pass so the doc and the skills agree.
