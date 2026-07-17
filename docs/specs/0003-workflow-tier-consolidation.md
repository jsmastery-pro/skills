# 0003 · One workflow tier, not two overlapping scales

**Status**: Accepted
**Date**: 2026-07-16
**Owner**: architect (this decision spec)

## Summary

The tier work (the `Vibe`/`Lean`/`Medium`/`Full` project **Workflow** depth) and the pre existing per feature **Weight** (`lean`/`medium`/`full`) ended up as two overlapping scales sharing three of the same words, which is confusing. This spec unifies them into a single **workflow tier** concept, makes the cross model decision critic always asked with a strong recommendation at `Medium`/`Full` (rather than auto running it, and its findings go to the engineer to decide), links value sourcing to verify steps, and reconciles the "no fixed tiers" messaging. It is a consolidation pass on the changes in specs 0001 and 0002, done before adding anything new.

## Context

Across recent work we added a project **Workflow** depth (`Vibe`/`Lean`/`Medium`/`Full`) on top of the existing per feature **Weight** (`lean`/`medium`/`full`). Both measured the same thing, how much process a feature warrants, and both drove overlapping behavior (fresh model review, `Needs spec` likelihood, the verification tail). A reader seeing `Weight: full` and `Workflow: Full` could not tell them apart. Separately, spec 0002 gated the decision critic to auto run only at `full`, but the bug that motivated it was a `Medium` feature, so the guarantee did not cover the tier where it lives. And the value sourcing table (0002) and the verify steps were disconnected, even though behavioral verification is the real correctness guarantee, not the design time gate.

## Decision

1. **One scale.** Retire "Weight" as a separate concept. There is a single **workflow tier** (`Vibe`/`Lean`/`Medium`/`Full`) with a project default (recommended once, `/scope` Step 5b, on the `**Workflow:**` header line) and a per feature override (a heading tag like `· Full`, shown only when it differs; no tag = inherit). The effective tier drives design time rigor (`Needs spec` likelihood, the decision critic), the post `/develop` verification tail, and what closes `done`.
2. **The critic is always offered, never auto run** (spec 0002 amended). `/architect` asks whether to run it, recommending `Another model` strongly at `Medium` and `Full` (where these bugs live), offering it at `Lean`, recommending Skip at `Vibe`. It never runs or skips the check on the engineer's behalf, and the gaps it finds are presented to the engineer with a recommended fix for them to decide, never auto resolved. Rationale: the check exists to keep the engineer aware of load bearing decisions, so both running it and resolving its findings are the engineer's calls (with the AI always recommending its best answer). Every user facing question the workflow asks must carry exactly one recommended option.
3. **Value sourcing feeds verify.** `/develop` derives a verify step from each row of the spec's Value sourcing table, so the behavioral layer exercises each sourced value (especially the input that would break it: timezone, locale, currency, tenant). This is what catches a mis sourced value even when the gate missed it.
4. **Messaging.** `CLAUDE.md` no longer says "no fixed tiers"; it says there is no mandated playbook and the tier is a recommended default you override, never a forced track.

## Consequences

- One rigor dial per feature, not two overlapping ones; the vocabulary collision is gone.
- The decision critic now covers the tier where the motivating bug sat.
- Correctness is backstopped by verify steps generated from the same value sourcing that the gate checks, closing the loop between the design time gate and the behavioral guarantee.
- This was a consolidation pass, done deliberately before adding new capability, to keep the fast recent changes internally consistent. End to end validation on a real project is still owed (run a stress feature through the whole loop).

## Follow-up

Files changed: `scope/SKILL.md`, `scope/scope-template.md`, `scope/modes/{plan,replan,add,plan-greenfield}.md` (tier rename); `architect/SKILL.md`, `architect/internal/after-subagent.md` (Medium critic); `develop/flow/build.md`, `check/modes/verify.md` (effective tier + value sourcing verify steps); `CLAUDE.md` (messaging); `docs/specs/0002` (amended). Owed: an end to end run of a stress feature to validate tier aware `done` and the two gates together.
