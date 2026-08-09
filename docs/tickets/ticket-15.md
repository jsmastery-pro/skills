# Ticket 15: Scope and build the behavioral harness

**Status:** blocked by tickets 10 and 11
**Phase:** 3
**Size:** L
**Depends on:** tickets 10 and 11 (they remove the statically checkable work, so this ticket only has to cover what is left)
**Files touched:** new, likely `fixtures/` and `scripts/`

## Problem

`npm test` runs the portability linter and nothing else. It checks bytes, dashes, frontmatter, and file sizes. It cannot tell you whether the workflow actually behaves the way the skills describe.

The things it cannot see are the things that would actually hurt a user:

- Does `/develop`'s Step 0 gate fire when a required value has no named source, or does the build model rationalize it as wiring and proceed?
- Does `/check verify` ever emit PASS without having launched the app, which its own Step 4c calls "the one output this skill must never produce"?
- Does a `Prototype` feature actually get closed at `/develop`, and does an `Alpha` feature actually not?
- Does `/architect` write the right closing boxes for the feature's tier?
- Does an `Assumed` spec ever reach `Accepted` without `/architect` ratifying it?

For a product whose entire value proposition is "the agent behaves this way", there is currently no way to answer any of those except by running it manually and looking.

There is a second, related cost. Six of nine hot paths are over 90 percent of their byte budget. The obvious response is to trim the skills. But trimming instruction text is exactly the change most likely to silently break behavior, and right now there is no way to tell whether a trim broke anything. So the budget pressure and the missing harness compound: you cannot safely do the thing the budgets are telling you to do.

## The hard part, stated up front

`/architect`, `/scope`, and `/audit` are interactive. They run multi round option panels and block waiting for an answer. You cannot assert on them without a scripted response layer, and once you have one you are testing the skill against a fixed dialogue rather than against a real user.

Every run also costs real tokens against a large model. This will never run on every commit. Designing it as if it will is the main way this ticket goes wrong.

So the useful version is **not** "run the skills and snapshot the output". It is a small number of high value assertions, run on demand.

## Suggested shape

### Fixtures

A handful of tiny repos under `fixtures/`, each pre seeded with the artifacts the skill under test would read (a scope file, a spec, an `AGENTS.md`), and each with a documented right answer.

Start with these five, one per assertion that matters most:

| Fixture | Skill under test | The assertion |
|---|---|---|
| `gate-owed` | `/develop` | A spec whose acceptance criteria require a value with no named source. The gate must fire and the run must end at the panel without writing code. |
| `gate-not-owed` | `/develop` | A spec that names every source. The gate must not fire. Guards against a gate so tight it blocks ordinary work. |
| `verify-unrunnable` | `/check verify` | A project that cannot start. Verdict must be BLOCKED, never PASS, and no scope box may be ticked. |
| `tier-prototype` | `/develop` | A `Prototype` feature. `/develop` must offer `done` and the scope must end up `done`. |
| `tier-alpha` | `/develop` | An `Alpha` feature. `/develop` must leave it `in-progress` and point at `/check verify`. |

Two of the five test the negative case on purpose. A gate that always fires is as broken as one that never does, and only the negative fixtures catch that.

### Assertions

Assert on **artifacts**, not on the transcript. After a run, check the fixture's files: did the scope status change, did a spec get created, is its `Status` line what it should be, was any code written. File state is stable and diffable; model prose is not.

### Running it

A script that copies a fixture to a temp dir, runs the agent headlessly against it with a fixed prompt, then diffs the resulting files against the expected end state. Non zero exit on mismatch.

Explicitly out of scope for the first version: the interactive skills (`/architect`, `/scope`, `/audit`), snapshot testing of report text, and running in CI.

## Decisions needed before starting

1. **Which agent runtime.** These skills target every Agent Skills client. The harness will target one. Which, and is a pass there evidence about the others?
2. **How to handle the panels.** `/develop`'s gate ends in an option panel. Does the harness assert that the panel appeared and stop there, or does it script an answer and continue? The first is cheaper and tests the thing that actually matters.
3. **Acceptable flakiness.** Model runs are non deterministic. Does a fixture have to pass three runs out of three, or two out of three? Decide before writing assertions, because it changes the design.

## Done when

- At least the five fixtures above exist, each with a written expected end state.
- One command runs them and reports pass or fail per fixture.
- Deliberately breaking `/develop`'s Step 0 gate makes `gate-owed` fail. Verify this; a harness that passes when the code is broken is worse than none.
- `README.md` or `docs/conventions.md` says how to run it and, honestly, what it does not cover.

## Notes

Do not start this before tickets 10 and 11 land. Those remove the statically checkable work, which changes what this harness has to cover and shrinks it. Building this first means building a slow expensive check for problems a free one would have caught.

Resist growing the fixture count early. Five assertions that genuinely run are worth more than twenty that are aspirational, and every fixture costs tokens on every run forever.
