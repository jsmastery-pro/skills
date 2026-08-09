# Ticket 2: `/check` frontmatter is missing `Edit` and `AskUserQuestion`

**Status:** todo
**Phase:** 1
**Size:** S
**Depends on:** none
**Files touched:** `skills/check/SKILL.md`

## Problem

`/check` declares a tool set that cannot perform the work its own mode files instruct. It is the only skill in the suite that edits files without declaring `Edit`, and the only one that presents an option panel without declaring `AskUserQuestion`.

The edits it is told to make are the most delicate in the workflow: ticking a single checkbox in a shared scope file and rewriting one status line in a spec. With `Write` but no `Edit`, the only way to do that is to rewrite the whole file, which is exactly the clobbering the ownership model exists to prevent.

## Evidence

Declared tools, `skills/check/SKILL.md:3`:

```
allowed-tools: Bash, Read, Grep, Glob, Write, Agent
```

What the mode files require:

- `skills/check/modes/verify.md:140` tick the feature's `Verify it` box in `docs/scope/`.
- `skills/check/modes/verify.md:142` mirror the spec's `**Status**:` line from `In Progress` to `Accepted`, described as surgical.
- `skills/check/modes/verify.md:140` also tick each passing step inside the feature's `verify.md`.
- `skills/check/modes/review.md:137` tick the feature's `Review it` box.
- `skills/check/modes/review.md:44` "Present via your agent's interactive option picker (`AskUserQuestion` on Claude Code)".

Every other skill that edits files declares `Edit`: audit, architect, document, debug, develop, scope, sync, test.

## Fix

Change line 3 of `skills/check/SKILL.md` to:

```
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
```

Then confirm nothing else in the check skill assumed the narrower grant. Search `skills/check/` for any claim that it never edits files, and reconcile the wording with what it actually does (the artifact ownership wording is ticket 6, keep the two tickets separate but do not leave a direct contradiction behind).

## Done when

- `skills/check/SKILL.md:3` declares `Edit` and `AskUserQuestion`.
- `npm run check` passes.
- No line in `skills/check/` claims the skill cannot edit files while another line instructs it to.

## Notes

Worth deciding as a policy question while you are here: should the checker assert that a skill's declared tools cover the tools its body names? That is ticket 10, guard 3. This ticket is only the one line fix.
