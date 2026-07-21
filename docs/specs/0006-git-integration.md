# 0006 · Optional git integration woven through the workflow

**Status**: Accepted
**Date**: 2026-07-21
**Owner**: architect (this decision spec)

## Summary

The workflow reads git (freshness checks, diff scoping) and `/document` can open a PR, but nothing branches or commits as you build, so the engineer manages git by hand. This adds opt-in git integration woven through the phases: branch per feature, commit as milestones land, drive the PR, all off a single project setting. It is off by default, asked once, and every outward op still confirms.

## Context

Git maps naturally onto a feature loop that is already feature oriented (scope features → spec → build). What was missing is the active half: create/checkout a branch, commit increments, and drive the PR from the loop. The read/safety half (behind count, uncommitted work, teammate detection, diff scoping, `/document`'s `gh pr create`) already exists and this builds on it, not over it.

Two hard constraints shaped the design. **Ownership:** `AGENTS.md` is written by `/audit` (created) and `/sync` (maintained); other skills read it. **Size budgets:** `develop` and `scope` sit at their hot path ceilings, so develop's git detail must load only when git is on, not on every build.

## Decision

- **Opt in, asked once, remembered.** `/audit` asks whether to handle git for the project and records a `## Git` block in `AGENTS.md` (`integration: on|off`, `branch prefix`, `commit: per-milestone|end-of-build|manual`). Every other skill reads it. Absent or `off` → the workflow does no active git; the engineer manages branches/commits/PRs, and the read only freshness warnings still apply where a repo exists.
- **Branch per feature.** When integration is on and `/develop` is about to build on the default branch (`main`/`master`), it offers to create/checkout `<prefix><feature-slug>` from the scope feature. On a feature branch already, it reuses it. Resuming a feature checks out its branch.
- **Commit as milestones land.** Per the `commit` setting, `/develop` commits each milestone (mapped to the scope milestone ticks), `/test` commits the suite. Messages are **one line Conventional Commit subjects** (`feat(auth): add session persistence`) plus the required `Co-Authored-By` trailer; no prose body. The narrative lives in the PR (`/document`), not in each commit (single source).
- **PR is confirmed and owned by `/document`.** It already writes the body; it pushes and opens/updates the PR only on explicit confirmation (outward action), degrading to printing the body when `gh` is absent.
- **Safety contract:** never commit on the default branch (branch first); local ops (branch, commit) are offers with a recommendation; push and PR always confirm; git is the one hard dependency, `gh` optional.
- **Placement (budget aware):** develop's git handling lives in a deferred `develop/flow/git.md`, read only when the setting is on (off the common build path). Each skill carries a short gated pointer; the conventions are single sourced per skill the way the output style block is.

## Consequences

- Solo and team engineers get branch/commit/PR handled by the loop, matching the feature structure, without leaving the workflow.
- Nothing git happens silently: off by default, one opt in, outward ops confirmed.
- One line commits keep history scannable; the PR carries the why.
- Off projects pay nothing (no git detail loads; no budget cost).

## Follow-up

Files: `docs/specs/0006`, `develop/flow/git.md` (new) + a gated pointer in `develop/SKILL.md`, `audit` (the opt in question + `## Git` template line), `document/SKILL.md` (confirmed push/PR gated on the setting), `test/SKILL.md` and `sync` (gated commit offers). Open: whether `/develop` should be able to enable integration itself when `/audit` never set it (currently absent → off), which needs an ownership tweak since `/develop` cannot write `AGENTS.md`.
