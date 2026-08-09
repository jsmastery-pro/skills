# Ticket 12: Give the tier contract one source of truth

**Status:** blocked by ticket 11
**Phase:** 3
**Size:** M
**Depends on:** ticket 11 (its check tells you how much drift there actually is)
**Files touched:** the tier statements across `scope`, `architect`, `develop`, `check`, `test`

## Problem

Ticket 11 makes the five copies of the tier rule stay in agreement. This ticket asks whether there should be five copies at all.

The constraint that makes this non trivial: skills install as independent folders (`npx skills add` drops each one into the agent's skills directory), so one skill cannot read another skill's file. A rule two skills must both obey genuinely cannot live in a single shared file. That is why the output style block is duplicated across all nine `SKILL.md` files on purpose, pinned byte identical by checker rule 9.

So the question is not "can we deduplicate" (we cannot) but "what is the smallest correct duplicated form".

## Fix

Three candidate shapes. Pick one after seeing what ticket 11's check reports.

### Option A: marked contract block, pinned byte identical

Extend the existing `CONTRACT_BLOCK` mechanism. Wrap the tier table in `<!-- TIER-CONTRACT:START -->` / `<!-- TIER-CONTRACT:END -->` markers and put the identical block in each skill that needs it. Rule 9 already enforces byte identity across copies, so the machinery exists and needs no new code.

Cost: the block loads in every skill that carries it, on every run. Six of nine hot paths are already over 90 percent of budget, so this is not free.

### Option B: each skill carries only its own row

A skill does not need the whole table. `/test` needs to know it closes `done` at Beta and GA. `/check verify` needs to know it closes at Alpha. `/develop` needs to know it closes at Prototype. `/architect` is the only one that needs the full box mapping, because it is the only one that writes the boxes.

Give each skill the one line it actually uses, and keep the full table in `scope-template.md`, which `/scope` and `/architect` already read. Ticket 11's checker then asserts each per skill line against the table.

Cheapest in tokens. Recommended, unless ticket 11 shows the drift is happening inside a single skill rather than across them.

### Option C: stop deriving the tier in five places

The deeper version. Right now every skill re computes "effective tier = feature tag, else project default, else inferred". Instead, have `/architect` resolve it once at spec capture and write the resolved tier onto the feature row, so downstream skills read a value rather than re deriving a rule.

This is the only option that removes the class of bug rather than policing it. It is also the only one that changes artifact format, so it needs a migration story for scopes written by the current version.

## Decision needed from you

Which option, and whether the format change in option C is acceptable this close to a published `2.0.0`.

My read: option B now, option C when you next make a breaking scope format change. Option A costs budget you do not have.

## Done when

- The tier contract exists in exactly one authoritative place.
- Every other mention is either a pointer, or a single line the checker verifies against that place.
- No skill restates the full tier table unless it is the authoritative copy.
- `npm run check` passes, and the hot path budgets did not go up to accommodate this.

## Notes

Read `scripts/check-portability.mjs` rule 9 and its comment block before designing anything here. It already contains the reasoning about why duplication is intentional in this repo, and the answer to this ticket is probably an application of it rather than a new idea.
