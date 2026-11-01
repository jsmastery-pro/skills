---
name: check
allowed-tools: Bash Read Grep Glob Write Agent
argument-hint: [verify | review | ready]
description: "Confirm a change before merge or launch. `/check verify` drives the real app to prove behavior against the spec. `/check review` runs a senior code review on a fresh model that did not write the code. `/check ready` checks a feature can be run, watched, and rolled back before real traffic. Writes to docs/reviews/, never edits code."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Talk to the reader as `you`, warm and direct like a colleague, and present every step as a recommendation they may run or skip, never an order. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

`/check` is the gate before merge and launch. Three modes, separate jobs; verify first, review before a PR, ready before real traffic:

- **`verify`** (runtime proof): run the real app and watch the change behave. Proves it works and conforms to the spec (every acceptance criterion met, every specced surface built), which green tests never reveal. Read only on code, no durable files, main thread. Typically after `/develop`.
- **`review`** (fresh model code review): a senior read of the diff on a **different model than wrote the code** (a model reviewing its own output shares its blind spots). Writes findings ranked by severity to `docs/reviews/`. Read only. Typically before a PR.
- **`ready`** (launch readiness): before a feature or service meets real traffic, checks from evidence that it can be run, watched, and rolled back (capacity, dependency failure, data safety, observability, rollback, security, ownership). Writes to `docs/reviews/`. Read only. Typically at `GA`, for a feature whose spec has `Rollout & operations`.

No mode edits code. `verify` points failures at `/debug` or `/develop`; `review` reports findings to fix.

## Pick the mode (route before doing anything else)

First step, before reading any mode file or touching the repo. Look at what followed `/check`:

- **Starts with `verify` (or `run`)** → read `modes/verify.md`, follow it fully. Pass remaining arguments (feature name, scope) through.
- **Starts with `review`** → read `modes/review.md`, follow it fully. Pass the steering through unchanged (e.g. `/check review with opus`, `/check review uncommitted`).
- **Starts with `ready` (or `launch`)** → read `modes/ready.md`, follow it fully. Pass the target through.
- **No mode word, or ambiguous** (bare `/check`, or a feature name with no mode like `/check auth`) → do NOT guess, do NOT default. Show the options as a plain text panel and **stop and wait** for the engineer's choice.

**How to present the choice (plain text, works on every agent, no interactive modal):**

Print exactly this, then stop and wait. Do not assume `verify` until they answer. Route on their typed word (`verify` / `review` / `ready` / `both`).

```
Which check do you want to run? Type one:
  • verify  run the real app and prove the change works against its spec (usually right after /develop)
  • review  a fresh model senior read of the diff, ranked findings (usually right before a PR)
  • ready   can it be run, watched, and rolled back (before a feature first meets real traffic)
  • both    verify first, then review
```

No interactive picker or modal: a typed choice shown inline behaves the same in every AI tool. (The `argument-hint` frontmatter also surfaces the modes in Claude Code autocomplete; other tools ignore it, which is why this inline panel is the portable path.)

If a feature name came with no mode (`/check auth`), carry it as the target once they pick; still ask the mode.

Do not mix modes in one run. On **both**, do `verify` first, then offer `review` next.

## Portability (any OS, any agent)

Any Agent Skills client on macOS, Linux, or Windows. `git` is the only required CLI. Other shell snippets are POSIX reference, not literal scripts: use your agent's own cross platform file, process, and browser tools. Each mode file adds its own portability notes. No subagent support falls back to inline, noted per mode.

Bundled files: `modes/verify.md`, `modes/review.md`, `modes/ready.md`, plus `review-agent-prompt.md` and `review-guide.md` for review. Read only the mode file you routed to; resolve the review bundled files to absolute paths when spawning the reviewer.
