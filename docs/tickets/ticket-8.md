# Ticket 8: Git integration is unreachable on brownfield

**Status:** todo
**Phase:** 1
**Size:** M
**Depends on:** none
**Files touched:** `skills/audit/modes/whole-repo.md`, `skills/audit/modes/gapfill.md`, possibly `skills/audit/SKILL.md` and `skills/audit/agent-prompt.md`

## Problem

The `## Git` block in `AGENTS.md` is what turns on branching and committing for the whole workflow. `/develop` reads it to decide whether to branch and commit, `/test` and `/sync` read it to decide whether to offer a commit, `/document` reads it to gate PR behavior.

The question that produces that block is asked in exactly one place: the greenfield audit path. An existing codebase running `/audit` is never offered it. Since an absent block means off, every brownfield user gets git integration permanently disabled unless they hand write the block into `AGENTS.md` themselves, and nothing tells them the block exists.

Brownfield is one of the two documented entry points to the workflow, so this is roughly half the audience.

## Evidence

The only place the question is asked, `skills/audit/modes/greenfield.md:18`:

> "Git integration (recorded as the `## Git` block in AGENTS.md): let the workflow branch per feature, commit as milestones land, and drive PRs (`on`, suggested for solo/most) · manage git yourself (`off`)..."

Searching the other phase mode files for git finds nothing relevant:

```bash
grep -n -i "git" skills/audit/modes/whole-repo.md skills/audit/modes/gapfill.md skills/audit/modes/area.md
```

returns one unrelated hit about excluding `.git` from a glob.

The consumers that go dark as a result:

- `skills/develop/SKILL.md:58` reads `## Git` to decide branching and committing.
- `skills/develop/flow/git.md:3` "Read this only when the nearest `AGENTS.md` `## Git` block says `integration: on`."
- `skills/test/SKILL.md:187` and `skills/sync/agent-prompt.md:177` gate their commit offer on it.

## Fix

Ask the git integration question in the brownfield paths too.

Phase 2 (whole repo scan) is the clear case: it is documented as acting immediately with no questions, so adding one needs a deliberate call. Phase 2 already writes a fresh root `AGENTS.md`, which is exactly when the block should be seeded, so the question belongs there.

Phase 4 (gap fill) is the subtler case: a project may already have a root `AGENTS.md` with no `## Git` block, and gap fill's whole job is adding what is missing without clobbering. Adding the block when it is absent fits that mandate.

Phase 3 (area scan) should stay out of it. It documents one area and has no business setting a project wide policy.

Two decisions to make before editing:

1. Does Phase 2 keep its "acts immediately, no questions" property? If that property is load bearing, the alternative is to infer a sensible default from the repo (existing branch naming, commit message conventions, whether there is a remote) and record it, then tell the engineer in the report how to change it. Recommended: ask. It is one question, it is a durable policy, and a wrong silent default writes commits the engineer did not want.
2. Should the brownfield default be `on` or `off`? Greenfield suggests `on`. On an existing repo with established conventions and possibly other contributors, `off` is the safer default. Recommended: offer both with `off` marked recommended for brownfield, the reverse of greenfield, and say why in the option description.

Also update `skills/audit/SKILL.md:37` ("Acts vs asks"), which currently states Phase 2 asks no questions.

## Done when

- Running `/audit` on an existing codebase with no root `AGENTS.md` offers the git integration choice and records the result as a `## Git` block.
- Running `/audit` on a project whose root `AGENTS.md` has no `## Git` block offers to add one.
- `skills/audit/SKILL.md` "Acts vs asks" describes what the phases now actually do.
- `npm run check` passes, including the `audit phase path` budget, which is currently at 89.1 percent.

## Notes

Watch the budget. The `audit phase path` group has about 2.9KB of headroom and its comment records that it was already raised once for the tool consent gate. If the new question does not fit, take the space out of the phase mode file rather than raising the ceiling.

The git question text already exists in `greenfield.md:18`. Reuse it rather than writing a second version, or it becomes another rule stated twice that can drift.
