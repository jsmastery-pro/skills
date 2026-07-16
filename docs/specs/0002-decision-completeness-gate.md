# 0002 · The gate checks decision completeness, not the builder's introspection

**Status**: Accepted
**Date**: 2026-07-16
**Owner**: architect (this decision spec)

## Summary

Spec [0001](0001-develop-assumed-spec-gate.md) closed the case where `/develop`'s gate fires and the override leaves the decision only in the chat. A subscriber (Oleh, 2026-07) found the deeper case: **the gate can fail to fire at all.** `/develop` can see a genuine, load bearing, spec contradicting decision, classify it as a "local implementation detail," and build it silently, so no gate, no `/architect`, and no `Assumed` spec. This spec hardens the mechanism in layers, none of which is an invariant, and corrects the copy that promised one.

## Context

The gate in `/develop` (spec 0001, `develop/SKILL.md` Step 0) asks the build model to introspect: *"would I have to invent something the engineer hasn't decided?"* The `Assumed` spec fix and the workflow tiers both rest on the same load bearing vs local implementation split. That split is judged by the same model that is motivated to finish the build.

Oleh built a reading streak feature (Next.js + Postgres/Drizzle + Clerk) and ran `/architect` then `/develop` verbatim. `/architect` held up well at the first order: from a naive brief with no mention of timezones it still specced the local day boundary, idempotency, a computed from log model, and lazy reset, unprompted. But the spec left a load bearing gap: an acceptance criterion required the read path to compute "the user's local day," yet the spec named no source for the user's timezone (no input, no column). `/develop` filled it silently, deriving "today" from the timezone stored on the user's most recent read row, a rule the spec never contains. That produces a real correctness bug (the write path uses the live device timezone; the read path uses the last stored one, so they disagree the moment a user travels). `/develop`'s own notes admitted it saw the gap and classified it as a local choice rather than routing back.

This is exactly the failure `develop/SKILL.md` predicts in its own words: the gate is the build model judging itself; second order choices get waved through as "wiring already decided pieces"; "false negatives are the failure mode, building a real decision without noticing." A prompt gate is a heuristic, not a physical invariant, and our copy overpromised.

## Options considered

1. **Hardcode the specific gap** (e.g. "always require a timezone source"). Rejected: it overfits to this one repro and misses the next differently shaped gap; it would look like a fix and be theater.
2. **Rely on a smarter gate prompt.** Rejected alone: still the motivated builder introspecting; Oleh showed that exact loop failing.
3. **Layered defense in depth (chosen).** Move the judgment off the motivated builder and convert it, where possible, from introspection into a visible, checkable artifact. No single layer is an invariant; stacked fallible layers plus honest copy is the goal.

## Decision

Four changes, general (never keyed to timezones; that is only an illustration), layered weakest to strongest, plus a copy correction.

### 1. `/architect` records the source of every produced value (root cause, `spec-template.md`)

The spec's design section must, for each action or read path, name the **source of every value it produces, computes, or displays** (an input param, a DB column, derived from X, or decided in spec N). A required value with no named source is a design gap `/architect` resolves before writing (ASK when only the engineer knows, RECOMMEND otherwise). This converts an invisible omission into a blank cell, near mechanical to spot. Illustration only: a streak read that must show "the user's local day" has to name where the timezone comes from.

### 2. `/develop`'s gate flips to positive input coverage (mechanical backstop, `develop`)

Before building each code path, enumerate the values it must produce (from the acceptance criteria and design), and for each required input ask the mechanical question: **does the spec name its source?** Any unnamed source is an owed decision, route to the gate (`/architect` or an `Assumed` spec), never "local." Tighten the definition: a "local implementation detail" is only a choice among options the spec's named sources already permit (a loop style, a helper name). Anything that determines a value's source, or a behavior an acceptance criterion constrains, is load bearing by definition, however small it looks.

### 3. An independent cross model decision critic (the real backstop, `/architect`)

`/architect` already has a read only cross check hook (`internal/after-subagent.md`). Upgrade it: at `full` weight it runs automatically on a different model (recommended at Medium), with a decision completeness mandate: *list every value each action produces whose source the spec does not name, and every decision the builder will have to make that this spec does not settle.* `/architect` resolves the gaps before the spec is finalized. This is the same cross model principle already trusted for code in `/check review`, applied to decision completeness, held by a model not motivated to finish the build.

### 4. Honest copy (`README`, `workflow-guide`)

No prompt gate is "physical." Reword absolute claims ("won't invent a decision and hide it," and any "physically cannot" marketing copy) to what is true: a strong, layered gate (design time value sourcing, a mechanical input coverage check on every build, and an independent cross model decision critic at Medium and up) that catches the vast majority, not an absolute guarantee. Behavioral correctness is caught by the `/check verify` and `/test` layers, which is where a real guarantee lives.

## Consequences

- The specific hole Oleh found is closed by (1) at design time and (2) at build time; (3) makes the guarantee as strong as an LLM system honestly can, held by an independent model; (4) stops promising an invariant.
- **This remains defense in depth, not an invariant.** Each layer is still an LLM judgment and can miss. The most robust piece is (1), because it is a visible artifact with a checkable completeness property, not a vibe check.
- **No hardcoding.** All rules are procedural (any produced value, any unnamed source), illustrated with 2 to 3 diverse examples, never a canonical checklist of sources to tick. Drift toward such a checklist would be overfitting and is out of bounds.
- (3) adds model cost, so it is tier gated: on at `full`, offered at Medium, off at `Vibe`/`Lean` (which rely on the mechanical gate). This uses the workflow depth dial from the tier work.

## Follow-up

Files this decision changes:
- `skills/architect/spec-template.md`: value to source requirement in the design section.
- `skills/architect/agent-prompt.md` and `internal/design-conversation.md`: the value sourcing expert rule and interview checklist item.
- `skills/architect/internal/after-subagent.md`: the auto running, decision completeness cross check at `full`/Medium.
- `skills/develop/SKILL.md` and `flow/build.md`: the positive input coverage gate and the tightened local vs load bearing definition.
- `README.md`, `docs/workflow-guide.md`: honest copy.
