# Authoring skills

A skill file loads in full, on its path, every time it runs, so every line is a cost paid on each invocation. Write the least that still produces the behavior. Prune before you add.

## What earns a line

- **A line must change what the agent does.** If the agent would already behave that way by default, the line is cost with no benefit, delete it (the whole sentence, not a few words). Vague encouragement the model already follows ("be careful", "be thorough", "think it through") is the usual offender.
- **Instruct, don't justify.** Skills say what to do. The reasoning, the alternatives, and the history belong in the commit message and the PR that made the change, not the skill body. Keep at most a short clause of reason in the skill, and only where it stops the agent doing the wrong thing.
- **Name a concept instead of explaining it.** Standard on terms the model already knows (idempotent, invariant, race condition, YAGNI, tracer bullet) rather than spelling them out. Spell out only the terms this repo invented (`Assumed` spec, workflow tier), and only once, in one place.
- **Steps are instructions, not narrative.** No connecting paragraphs. Each step is one to three lines and ends in a checkable condition (`if X → do Y`, or a `[ ]` gate), not a description of what comes next.
- **State a rule once.** If the same rule shows up twice, cut one and point to the other. One exception: each `SKILL.md` must stand alone for distribution, so a shared block (the output style) is intentionally repeated across skills, not factored out.

## One house voice, defined once

Every skill writes in the same voice, and it is defined in one place: the shared output style block in each `SKILL.md`. It reads to the user as `you`, warm and direct, and frames every step as a recommendation they may skip, never an order. That block governs everything a skill produces, summaries and generated files (scope, specs, `verify.md`) alike. So do not hand write polished paragraphs into a template: a template carries the facts and the shape in terse cues, and the agent renders them in the house voice at write time. Restating the voice inside a template is duplicated cost that the budget then charges on every run.

## Completion summaries: lead with the essentials

The report a skill prints at the end is read by a human scanning fast, so it leads with what matters and points to the files for the rest (the durable record already lives in the scope, the spec, `verify.md`, `docs/reviews/`, the commit/PR). One shape, every skill:

- **Headline** (one line): what happened and the single outcome that matters.
- **Next**: the one command to run, or the pending decision.
- **Heads up**: blockers, or anything the engineer must review or decide, **only when there is one** (never a manufactured section).
- A **pointer**, not a restatement: name the file that holds the detail.

Cut the field dump and the checklist of yeses (`Semantic HTML: correct`, `Keyboard: navigable`) · that is confirmation noise or already in a file, not something to reprint or relocate. Keep only the fields that are actionable for that skill (a PASS/FAIL verdict and its gaps, findings to fix, items invented for the engineer to review).

## When to add a file

Only when a piece of content is both **rarely needed and long** (a big migration rollout, an unusual edge case). Move it to a file the skill reads only when that case arises, so it stays off the common path. Do not split content that is short or common, inline it. When you do split, make the trigger explicit so the agent never misses it ("if X, read `Y` before continuing").

## Before committing a skill edit

- Run `npm run check` (cross tool portability + hot path size budgets). A path near budget means prune first, not raise the ceiling or add another file.
- Re read the diff for lines that change nothing, and for a rule now stated twice.
- A prune should not change behavior. If a cut might, say so and confirm it with a validation run.

## On size

The budgets keep skills lean as they grow; a warning means prune, not that the limit is too low. Our skills interlock and carry modes, so they run larger than a single purpose skill. The target is "cut to what is needed", never a fixed line count.
