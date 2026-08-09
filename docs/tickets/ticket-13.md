# Ticket 13: Decide what `done` means at the GA tier

**Status:** needs your decision
**Phase:** 3
**Size:** S
**Depends on:** none, but the edit should follow ticket 11 so the contract table records the answer
**Files touched:** `skills/scope/scope-template.md`, `skills/test/SKILL.md`, `skills/check/modes/review.md`, `docs/workflow-guide.md`

## Problem

At the GA tier, a feature is marked `done` by `/test`, but two boxes remain unticked afterwards: `Review it` and `Document it`.

So at GA, `/check review` ticks a box on a feature that is already `done`, and `/test` simultaneously offers `done` and suggests running `/check review` next. Nothing in the docs states that this is intentional, and the phrase used to describe it ("the tier's last stage") is not accurate at GA, where the last stage and the last box are different things.

This may be a deliberate design (done means the code is proven; review and documentation are post merge concerns). If so it needs to be said. If not, it is a real contradiction in the tier that matters most.

## Evidence

The tier says `/test` closes GA:

- `skills/scope/SKILL.md:55` "What closes `done` (the last required stage marks it): `Prototype` → `/develop`; `Alpha` → `/check verify`; `Beta`/`GA` → `/test`."
- `skills/scope/scope-template.md:105` "the tier's last stage (`Prototype` → after `/develop`; `Alpha` → after `/check verify`; `Beta`/`GA` → after `/test`) is the suggested point to call it done".
- `docs/workflow-guide.md:216` same claim.

The boxes say otherwise:

- `skills/architect/internal/after-subagent.md:71` a GA feature gets `Verify it`, `Test it`, `Review it (fresh model)`, and `Document it`.

The two behaviors in the same paragraph:

- `skills/test/SKILL.md:187` offers `done` on a passing suite, and its report template at line 195 says "all pass → `/check review` if a `Review it` box remains".
- `skills/check/modes/review.md:137` ticks `Review it` with no notion that the feature may already be `done`.

## The decision

Three coherent answers. Pick one.

### A. `done` at GA stays at `/test`, and that is intentional

`done` means the code is built, verified, and tested. Review and documentation are post `done` activities that happen before merge but do not gate the feature's completeness.

Then: say so explicitly in `scope-template.md` and the workflow guide, stop calling `/test` "the tier's last stage" at GA, and add a line to `/check review` acknowledging it may be ticking a box on a `done` feature.

### B. `done` at GA moves to `/document`

The last box closes the feature, consistently across all four tiers. "The tier's last stage" becomes literally true everywhere.

Then: `/test` stops offering `done` at GA, `/document` starts offering it, and `/document` gains the scope status edit and spec status mirror that `/test` currently owns.

Costs more: `/document` is currently the lightest skill and this makes it a closer.

### C. GA drops `Review it` and `Document it` from the feature's boxes

Treat review and documentation as change level activities (they operate on a diff or a branch, not on a feature), not feature level boxes. GA then closes at `/test` like Beta, and differs from Beta only in that it recommends running review and document before merge.

This is arguably the most honest description of what those two skills actually do: `/check review` reviews a branch diff, and `/document` writes a PR body. Neither is really per feature.

## My recommendation

**C**, then **A** as the fallback.

`/check review` scopes itself from the git diff, not from a feature (`skills/check/modes/review.md:80` to `88`). `/document` writes from branch commits (`skills/document/SKILL.md:71`). Both are branch shaped, not feature shaped. Making them feature checkboxes was probably a symmetry that does not hold, and the `done` contradiction is a symptom of that rather than the disease.

If you want to keep the boxes for visibility, take A and just write down that `done` precedes them on purpose.

## Done when

- One of the three answers is chosen and recorded in the tier contract table (ticket 11).
- No file says "the tier's last stage" where that is not true.
- `/test` and `/check review` agree about whether a reviewed feature can already be `done`.
- `docs/workflow-guide.md:216` and `README.md:63` reflect the chosen answer.

## Notes

Whichever you pick, this is a user visible semantic, so it belongs in the changelog for the next release, not just in the skills.
