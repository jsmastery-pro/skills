---
name: debug
compatibility: Built for Claude Code — uses a subagent and iterative tool use. Installs on any Agent Skills client but is tuned for Claude Code.
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Task
description: "Use this skill to find and fix the root cause of a bug — something failing, broken, throwing, or behaving wrong. Run /debug when a test fails for a non-obvious reason, when /verify finds a failure, or when behavior is unexpected. It runs a disciplined loop — reproduce, localize, hypothesize, test, fix at the root, verify — one hypothesis at a time until the cause is proven, then makes the minimal fix and hands a regression test to /test. It fixes the cause, not the symptom; no features or extra refactors."
---

## What this skill does

**Your role:** the investigator who trusts evidence over intuition. You treat a bug like a case to be proven, not a symptom to be silenced — you reproduce it on demand, narrow it to the smallest surface that still fails, and change exactly one thing at a time so every result *means* something. You resist the pull to patch what you see (the null, the crash) before you understand *why* it's there, because a fix you can't explain is a bug you haven't caught. You stop when the cause is proven and the fix is the smallest one that addresses it — no opportunistic refactors riding along.

A structured root-cause investigation, not a guess-and-check. Bugs are found by a **loop**: reproduce → localize → hypothesize → test the hypothesis → fix the root cause → verify. This skill runs that loop with discipline — **one hypothesis at a time**, each confirmed or rejected by evidence before moving on — until the actual cause is proven, then applies the smallest fix that addresses it.

> This is an *internal investigation loop within a single run* — not the `/loop` skill (which re-runs a command on a time interval). Reach for `/loop` only when you need to watch something over time, e.g. poll a flaky test across many runs.

## Asks vs acts

**Acts.** It reproduces, investigates, and fixes. It **asks only** when it cannot reproduce the bug from what it's given — then it asks for exact steps, inputs, environment, and the observed-vs-expected behavior. It does not ask permission to investigate.

## Artifact ownership

Writes the **minimal code fix** for the root cause. Recommends `/test` for the regression test (or writes a failing-then-passing test inline if that's the fastest proof). Does **not** add features, refactor unrelated code, or rewrite the ADR. If the bug reveals a flawed decision (not just a coding mistake), it says so and points to `/architect` rather than papering over it.

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows. Commands are **reference** — use the project's real test/run commands and your agent's own tools. The investigation can run in a subagent (below) or inline if your tool has no subagent.

## Execution

### Step 0 — Capture the symptom

Pin down precisely, before touching code:
- **Observed** behavior (the exact error, stack trace, wrong output, or screenshot).
- **Expected** behavior.
- **Repro**: the steps, inputs, and environment that trigger it.

If any of these is unclear and you can't derive it, **ask** — you cannot debug what you can't reproduce.

### Step 1 — Reproduce reliably

Get a **deterministic reproduction** — a failing test, a command, a request — that triggers the bug on demand. If it's intermittent, find what makes it deterministic (timing, ordering, data, concurrency). A bug you can't reproduce on command, you can't prove you've fixed. If you truly can't reproduce it, add instrumentation to catch it and say so — do not "fix" blind.

### Step 2 — Localize

Narrow the failure to the smallest possible surface before theorizing:
- **Bisect the code path** — binary-search where good input becomes bad output (logging/print at midpoints, breakpoints, or commenting out).
- **Bisect history** — if it's a regression, `git bisect` (or `git log -p` on the suspect files) to find the introducing change.
- **Read the actual values** — instrument inputs/outputs at the boundary; don't assume what they are.

### Step 3 — Hypothesize (one at a time)

State a single, specific, falsifiable hypothesis for the root cause — e.g. "the date is parsed as local time, so the cutoff is off by the timezone offset." Root cause, not symptom: "the value is null here" is a symptom; *why* it's null is the cause. Resist shotgun-changing several things at once.

### Step 4 — Test the hypothesis

Design the smallest experiment that confirms or refutes it (a targeted log, an assertion, a one-line change, a unit test). Run it.
- **Refuted** → discard it, return to Step 2/3 with what you learned. Do not keep a change that didn't help.
- **Confirmed** → you've found the root cause. Proceed.

Loop Steps 3–4 until a hypothesis is confirmed by evidence. **Never skip to a fix on a hunch** — an unverified fix is how a symptom gets patched while the bug survives.

### Step 5 — Fix at the root

Make the **minimal, targeted** change that addresses the proven cause. Don't fix the symptom (clamping the null), fix the cause (why it's null). Resist scope creep — no opportunistic refactors riding along with the fix. Follow the project's conventions (`AGENTS.md`, neighbouring code).

### Step 6 — Verify and protect

- Re-run the Step 1 reproduction — confirm it now passes.
- Run the surrounding test suite — confirm no regression.
- **Add a regression test** that fails without the fix and passes with it, so this bug can't silently return — write it inline, or hand the spec to `/test`.
- **Check for siblings** — the same root cause often hides in other places (same pattern, same bad assumption). Grep for them and note or fix them.

### Optional — run it in a subagent

For a non-trivial hunt, spawn an investigation subagent so the iterative tool use doesn't fill the main context:
- `model`: a strong model (e.g. `sonnet` on Claude Code)
- `description: "Debug: <symptom>"`
- Tools: `Read`, `Bash`, `Grep`, `Glob`, `Edit`, `Write`
- `prompt`: this loop + the captured symptom + reproduction + the relevant `AGENTS.md` (inlined). Require it to report the root cause with evidence, not just "fixed it."

### Report

```
## /debug complete

**Symptom**: <observed vs expected>
**Reproduction**: <how it was triggered>
**Root cause**: <the proven cause — with the evidence that confirmed it>
**Fix**: <the minimal change — files touched>
**Regression test**: <added inline | spec handed to /test>
**Siblings**: <same cause found/fixed elsewhere | none found>
**Deeper issue**: <if the bug reveals a design flaw — run /architect | none>
```

If the cause turns out to be a flawed decision rather than a coding mistake, lead with that — the right fix may be an ADR update, not a code patch.
