# Ticket 11: Assert the tier contract is stated consistently

**Status:** todo
**Phase:** 2
**Size:** M
**Depends on:** ticket 10 (same file, land it first to avoid conflicts)
**Files touched:** `scripts/check-portability.mjs`, plus whichever skill files the check finds disagreeing

## Problem

The workflow tier (`Prototype`, `Alpha`, `Beta`, `GA`) is the single most cross cutting rule in the suite. It decides three separate things: which checkbox rows a feature gets, which skill closes `done`, and what each skill suggests as the next step.

That rule is currently written out in prose in at least five skills, independently. Nothing keeps the five copies in agreement, and they have already drifted. Whichever statement the model read most recently is the one it follows.

This looks like a behavior problem but it is a cross file consistency problem, which means a script can catch it. That is why it is in Phase 2 and not Phase 3.

## Evidence

The rule is asserted in all of these:

- `skills/scope/SKILL.md:52` to `57`, the canonical definition (design time effect, verification tail, what closes `done`).
- `skills/scope/scope-template.md:102`, `105`, `112`, `113`, the lifecycle table and legend.
- `skills/scope/modes/plan.md:67` to `85`, the tier panel and its option descriptions.
- `skills/architect/internal/after-subagent.md:20` to `23` (cross check recommendation by tier) and `:71` (which closing boxes to write).
- `skills/develop/SKILL.md:24` and `skills/develop/flow/build.md:99`, `121`, `123`.
- `skills/check/modes/verify.md:140` to `142`.
- `skills/test/SKILL.md:187`.

The drift already visible:

`skills/scope/SKILL.md:19` says `/architect` fills in the shape ending with "`Verify it: /check verify <feature>` and `Test it: /test <feature>`", with no mention of the GA boxes.

`skills/architect/internal/after-subagent.md:71` gets it right: `Verify it` at Alpha and up, `Test it` at Beta and up, plus `Review it` and `Document it` at GA, and none at Prototype.

Both describe the same action by the same skill. One of them is wrong.

## Fix

Two parts, in order.

### Part 1: write the contract down once, as data

Add a single declared table, in one place, that states for each of the four tiers:

- which closing boxes the feature gets, in order
- which skill closes `done`
- whether the cross model spec critic is recommended

`skills/scope/scope-template.md` is the natural home, since it is already the format reference and both `/scope` and `/architect` read it. Alternatively a small `tier-contract.md` that the checker parses and the skills point at.

### Part 2: assert every other statement agrees

Add a checker rule that extracts the tier claims from each skill and compares them to the declared table. The realistic version is not full natural language parsing. Something narrower that still catches real drift:

- For each file mentioning a tier name, find sentences that also name a box (`Verify it`, `Test it`, `Review it`, `Document it`) or a closing skill (`/check verify`, `/test`, `/develop`), and assert the pairing matches the table.
- Fail loudly on a pairing the table does not contain, for example a sentence pairing `GA` with a box list ending at `Test it`.

Accept that this guard will be approximate. It only has to catch the class of drift that has already happened, which is a skill listing the wrong set of boxes for a tier.

## Done when

- One file declares the tier contract as a table, and it is the only place the full contract is spelled out.
- Every skill that mentions tier behavior either points at that table or states something the checker confirms agrees with it.
- `skills/scope/SKILL.md:19` and `skills/architect/internal/after-subagent.md:71` agree.
- `npm run check` fails if you edit any skill to state a tier pairing the table does not contain. Test this by breaking it deliberately.

## Notes

Do not attempt the deeper fix in this ticket. Making the skills genuinely share one source of truth, rather than each restating a checked copy, is ticket 12, and it runs into a real constraint: skills install as independent folders, so they cannot import a shared file. The checker pinning duplicated blocks is exactly how the existing rule 9 (`CONTRACT_BLOCK`) already solves this for the output style. Read that rule before designing this one; the same marker comment mechanism may be the whole answer.
