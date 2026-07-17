---
name: check
allowed-tools: Bash, Read, Grep, Glob, Write, Agent
argument-hint: [verify | review]
description: "Run /check before merge to confirm a change is sound. Two modes: `/check verify` drives the real app and proves behavior against the spec (every acceptance criterion met, every specced surface built); `/check review` runs a senior code review on a different model than wrote the code. Verify after /develop, review before a PR. Writes findings to docs/reviews/; never edits your code."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

`/check` is the gate before merge. It confirms a change is sound in two different ways, run as two modes; they are separate jobs and you usually run both, verify first:

- **`verify`** (runtime proof): run the real app and watch the change behave. Proves the feature actually works and conforms to the spec (every acceptance criterion met, every specced surface built), which green tests never reveal. Read only on code, owns no durable files. Runs on the main thread. Typically after `/develop`.
- **`review`** (fresh model code review): a rigorous senior read of the diff, on a **different model than wrote the code**, because a model reviewing its own output shares its blind spots. Writes findings ranked by severity to `docs/reviews/`. Read only on code. Typically before opening a PR.

Neither mode edits your code. `verify` points failures at `/debug` or `/develop`; `review` reports findings for the implementer to fix.

## Pick the mode (route before doing anything else)

This is the first step, always, before reading any mode file or touching the repo. Look at what followed `/check`:

- The argument **starts with `verify` (or `run`)** → runtime proof. Read `modes/verify.md` and follow it fully. Pass any remaining arguments (a feature name, a scope) through.
- The argument **starts with `review`** → code review. Read `modes/review.md` and follow it fully. Pass the review steering through unchanged (e.g. `/check review with opus`, `/check review uncommitted`).
- **No mode word, or anything ambiguous** (bare `/check`, or a feature name with no mode like `/check auth`) → do NOT guess and do NOT default to a mode. Show the two options as a plain text panel and **stop and wait** for the engineer to type their choice. This is the case that makes `/check` safe to type with nothing after it.

**How to present the choice (plain text, works on every agent, no interactive modal):**

Print exactly this, then stop and wait for the reply. Do not proceed, do not assume `verify`, until the engineer answers. Route on their typed word (`verify` / `review` / `both`).

```
Which check do you want to run? Type one:
  • verify  run the real app and prove the change works against its spec (usually right after /develop)
  • review  a fresh model senior read of the diff, ranked findings (usually right before a PR)
  • both    verify first, then review
```

Do not use an interactive picker or modal for this; it is a typed choice shown inline, so it behaves the same in every AI tool. (The `argument-hint` in this skill's frontmatter also surfaces `verify | review` in Claude Code's own autocomplete as you type, before submit; other tools ignore that field, which is why this inline panel is the portable path.)

If a feature name was passed with no mode (`/check auth`), carry it through as the target once the engineer picks the mode; still ask the mode.

Do not mix the two in one run. If the engineer types **both**, do `verify` first (confirm it works), and only then offer `review` as the next step.

## Portability (any OS, any agent)

Any Agent Skills client on macOS, Linux, or Windows. `git` is the only required CLI and behaves the same everywhere; other shell snippets are POSIX reference, not literal scripts, so use your agent's own cross platform file, process, and browser tools and apply branching logic yourself. Each mode file adds its own portability notes (browser/HTTP driving for `verify`, the cross model spawn and bundled file handling for `review`). No subagent support falls back to running the work inline, noted per mode.

Bundled files live in this skill's folder: `modes/verify.md`, `modes/review.md`, and (for review) `review-agent-prompt.md` and `review-guide.md`. Read only the mode file you routed to; the main agent resolves the review bundled files to absolute paths when it spawns the reviewer.
