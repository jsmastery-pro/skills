# 0005 · Every stage closes its own scope and spec boxes

**Status**: Accepted
**Date**: 2026-07-21
**Owner**: architect (this decision spec)

## Summary

Testing surfaced scope boxes that never got ticked: `Review it` and `Document it` had no skill instructed to tick them, and `Verify it` sometimes stayed unticked while `Test it` got ticked. Two causes: the tier work added Full tier stages (`/check review`, `/document`) and their scope boxes without giving them a ticking owner, and the closing scope update was trailing prose that a long run could drop. This spec gives every box an owner, makes the update a confirmed closing gate, and adds a `/sync` backstop.

## Context

The scope's lifecycle boxes are Design → Build (+ milestones) → Verify → Test, plus Review it and Document it on a Full tier feature. Each stage skill is supposed to tick its own box (and update the spec where it has one). A grep confirmed the gap: no skill referenced `Review it` or `Document it` at all, and `/sync`'s reconciler listed evidence only for Build/Verify/Test. So those two boxes could never be ticked by anyone. Separately, `Verify it` has an owner (`/check verify` on PASS) but the tick is the last, least salient step and gets dropped. `/check review` was also reading a spec's `rationale.md` (decision history), which it does not need and `/develop` is told to skip.

## Decision

- **Every closing box has an owner, and ticks in both files where it owns one.** `/develop` → Build milestones + `## Build plan` tasks + status; `/check verify` → `Verify it` + status; `/test` → `Test it` + status; `/check review` → `Review it` (scope only, findings live in `docs/reviews/`); `/document` → `Document it` (scope only, output is the PR/changelog). `/check review` and `/document` gain this instruction; they had none.
- **The scope+spec update is a confirmed closing gate**, not trailing prose. Each skill states in its report exactly what it ticked in each file ("Scope: `Verify it`; Spec: status → `Accepted`"), or says no scope row matched, and never finishes silently.
- **`/sync` backstops** `Review it` (a `docs/reviews/` findings file) and `Document it` (a PR body / changelog / release note), the same way it already backstops Verify/Test.
- **`/architect` creates the closing boxes to match the tier** (Verify at Lean+, Test at Medium+, Review + Document at Full), so no box exists without a stage to run it and no stage runs without a box.
- **`done` still gates on Design/Build/Verify/Test only.** `Review it`/`Document it` are tracked but not part of the `done` gate (they only appear at Full; making `done` depend on them is a separate choice, not taken here).
- **`/check review` reads the build spec, not the rationale.** It reads `index.md`'s build-spec sections (Requirements, Decision, design, Consequences), the contract to review against, not `rationale.md` unless a finding hinges on the reasoning. Matches `/develop` and saves tokens.

## Consequences

- The boxes a run completes now get ticked, in both files, reliably, and the run says so.
- A no-matching-row case becomes a visible message instead of a silent no-op.
- No behavior change to `done`; `Review it`/`Document it` are informational tracking at Full tier.

## Follow-up

Files changed: `check/modes/review.md` (spec-read scope + tick `Review it`), `document/SKILL.md` (tick `Document it`), `check/modes/verify.md` and `test/SKILL.md` and `develop/flow/build.md` (confirmed closing gate), `sync/agent-prompt.md` (backstop evidence), `architect/internal/after-subagent.md` (tier-matched closing boxes), `scope/scope-template.md` (lifecycle table). Open choice: whether a Full feature's `done` should require `Review it`/`Document it`.
