# Ticket 14: Stop the house output style from governing product copy

**Status:** needs your decision
**Phase:** 3
**Size:** M
**Depends on:** none
**Files touched:** the `OUTPUT-STYLE` contract block in all nine `SKILL.md` files, `scripts/check-portability.mjs` rule 9

## Problem

The output style block says it governs "everything this skill produces, files and messages alike", and bans hyphenated compounds outright. That is the right rule for the workflow's own prose: the scope, the specs, `AGENTS.md`, the completion reports.

It is the wrong rule for two things the workflow also produces:

1. **Product copy.** `/develop` is explicitly told to write real product copy into the user's UI: headlines, supporting lines, microcopy, a wordmark, a tagline. Under the current rule, a hero headline cannot say "state of the art" with hyphens, "best-in-class", "AI-powered", or any other ordinary compound that real marketing copy uses.
2. **User facing release prose.** `/document` writes `CHANGELOG.md` entries, release notes, and PR bodies. A changelog saying "read only" where the codebase says "read-only" is a small inaccuracy in a document about that codebase.

The intent of the rule is a plain, warm, dash free house voice for the workflow's own writing. It was not intended to reach into the customer's product surface, but as written it does.

## Evidence

The rule, identical in all nine `SKILL.md` files, for example `skills/develop/SKILL.md:10`:

> "Write everything this skill produces, files and messages alike, in plain simple language... Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`."

It carves out only code: "Code, file paths, command flags, and values other skills match on keep their hyphens."

What `/develop` is told to write under it, `skills/develop/ui/implementation.md:70`:

> "**Context and copy**: real product specific copy (headline, supporting line, honest microcopy) from the product's purpose (`AGENTS.md`, spec intent, scope), never lorem ipsum."

And `skills/develop/ui/implementation.md:82` tells it to "derive a wordmark" and "write real copy from purpose".

`/document`'s outputs are listed at `skills/document/SKILL.md:19` to `24`: PR body, `CHANGELOG.md`, `docs/releases/`, `docs/postmortems/`.

## The decision

The carve out has to be added to the shared block, which means editing all nine copies identically (checker rule 9 enforces byte identity). So the question is what the carve out says.

### Option A: carve out "content written into the user's product"

Add one clause: the rule governs the workflow's own writing (scope, specs, context files, reports, and the skill's messages to you), and does not govern text written into the user's product or repository as product content: UI copy, marketing copy, changelog and release note prose, commit messages.

Cost: one sentence times nine files. Low.

Risk: "product content" is a judgment call and a model may over apply the exemption to widen it into the workflow's own prose.

### Option B: carve out only UI copy

Narrower. Only `/develop`'s generated UI strings are exempt. `/document` keeps the house voice, on the argument that a changelog is workflow output about the change, not the product itself.

Defensible, and it is the smaller change. But it leaves the `read only` vs `read-only` oddity in changelogs describing a codebase that uses hyphens.

### Option C: leave it alone

Argue that the constraint is a feature: it produces distinctive, plain copy, and a hyphen free headline is not actually a defect.

I think this is wrong for the product copy case specifically. The user did not opt into your house style for their marketing page. But it is a real position and it costs nothing.

## My recommendation

**A**, with the exemption stated narrowly and with an example, so the model has a concrete anchor rather than a category. Something like: "This governs the workflow's own writing. Text you write into the user's product or repository as product content (UI copy, a tagline, a changelog entry, a commit subject) follows the product's own voice and normal English punctuation, not this rule."

## Done when

- The output style block carves out product facing content, identically in all nine `SKILL.md` files.
- `npm run check` rule 9 passes, confirming the nine copies are still byte identical.
- The hot path budgets did not go over. The block is repeated nine times, so every added word costs nine times.
- A spot check: `/develop`'s UI guidance and `/document`'s templates do not contradict the new carve out.

## Notes

Checker rule 11 (no hyphen in prose) scans the skill corpus itself, not the output. It is unaffected by this change and should stay as it is. Do not weaken it while editing the shared block.

If you take option A, also check the four `skills/document/templates/*.md` files. The checker comment at the top of `check-portability.mjs` notes these are "literally the prose the skill emits", so they are the place where the old rule and the new carve out are most likely to collide.
