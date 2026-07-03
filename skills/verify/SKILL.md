---
name: verify
compatibility: Built for Claude Code — uses subagents and can drive a browser/CLI. Installs on any Agent Skills client but is tuned for Claude Code.
allowed-tools: Bash, Read, Grep, Glob, Write, Task, AskUserQuestion
description: "Use this skill to confirm a change actually works by running the real app and watching its behavior — not just that tests pass. Run /verify after /develop and before /review, or any time you need to see a feature work end to end: it launches the app, exercises the changed flow, and checks the observable result (UI, an API response, CLI output, a job). For a **behavior-preserving refactor** (or a project with no test runner), it runs a before/after diff — capturing the affected outputs pre- and post-change and proving they're identical — which is the regression gate a refactor needs. Complements /test with runtime confirmation; reports what worked, what didn't, and what /test should lock in. It doesn't write code."
---

## What this skill does

**Your role:** the acceptance engineer — the senior hand who trusts observed behavior over green checkmarks. You reason from a single question: *"If I were the person who has to sign off that this is real, what would I need to watch happen with my own eyes?"* You know that a passing suite proves the code the author thought to test, not that the feature exists; so you drive the actual thing and judge what you see against what the slice was supposed to deliver.

Closes the gap between "the tests are green" and "the feature actually works." A passing unit suite does not prove a page renders, a button submits, an endpoint returns the right shape, or a job completes. `/verify` **runs the thing and watches it behave.**

1. **Scopes** what changed (from git) into a short list of observable behaviors to check — anchored to the spec's acceptance criteria when a governing ADR exists.
2. **Runs** the app the way this project runs — reusing the project's own launch method when one exists.
3. **Exercises** the changed flow and **observes** the result — screenshots for UI, response bodies for APIs, output for CLIs, logs for jobs.
4. **Reports** pass/fail per behavior **and per acceptance criterion**, anything anomalous, and what `/test` should turn into a permanent assertion.

It is the runtime counterpart to `/test`: `/test` writes assertions that run forever; `/verify` is the senior engineer who opens the app once and confirms it's real before review.

**Spec-conformance gate.** When the feature is governed by an ADR with IDed acceptance criteria (`## Requirements`, `AC-1…`), `/verify` also proves the implementation **conforms to the contract** — every criterion met and every specced surface (page, route, table) actually built. This is the pass that catches a missed page or an un-applied migration: green tests and a working happy path don't reveal a surface that was specced but never built. See **Step 0b** and **Step 4b**.

## Asks vs acts

**Acts.** Scopes from git, figures out how to launch, runs, observes, reports. It **asks only** when it cannot determine how to start the app or which flow to exercise (e.g. a route that needs seeded data or credentials). It never modifies application code — if something is broken, it reports it and points to `/debug` or `/develop`; it does not fix it here.

## Artifact ownership

Owns no durable files. Chat output only (plus screenshots/logs saved to the scratch area for the engineer to look at). Does not write code (`/develop`), tests (`/test`), or context files.

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows. Run/launch snippets are **reference** — use the project's actual scripts (`package.json`, `Makefile`, `justfile`, etc.) and your agent's own process/browser tools. Driving a browser or capturing screenshots assumes a capable client; if yours can't, describe the manual steps for the engineer to run and report back what they see. If your tool has no subagent, run the verification inline.

## Execution

### Step 0 — Pick the mode

- **Feature mode** (default) — the change *adds or alters* behavior. Confirm it does the new thing (Steps 1–5 below).
- **Refactor / regression mode** — the change is **behavior-preserving** (a refactor, a dedup, a rename; the task or the ADR says *"behavior must not change"*). Here "works" means **identical before and after** — so instead of checking against *expected*, you **capture the observable outputs before the change, capture them after, and diff**. This is the safety net for projects with **no test runner**, and it's exactly what a "diff API responses before/after" ADR asks for — automate it.

### Step 0a — Refactor mode: before/after diff (spawn a subagent)

Only in refactor mode. Because it drives the app twice and holds two output sets, **run it in a subagent** (keeps the main context clean):
- `model`: a strong model (e.g. `sonnet` on Claude Code) · `description: "Verify: before/after diff — <scope>"` · Tools: `Read`, `Bash`, `Grep`, `Glob` (+ browser/HTTP driving)
- Its job:
  1. Identify the **affected surfaces** from the diff — the endpoints, queries, jobs, or pages the refactor touches. Pick representative ones per changed area, favoring the surfaces whose output is most observable and most likely to reveal a behavior shift.
  2. **Capture BEFORE** — the pre-change state. **Prefer a throwaway git worktree** checked out at the pre-change ref (the base branch, or the commit before the refactor): `git worktree add <tmp> <ref>`, start the app *in that worktree*, hit each surface, save the raw outputs, then `git worktree remove <tmp>`. This keeps your working tree and **untracked files** intact. Only if worktrees aren't available, fall back to `git stash --include-untracked` (plain `git stash` leaves new files behind and contaminates the "before"), restoring with `git stash pop` after.
  3. **Capture AFTER** — with the change applied, start the app, hit the same surfaces the same way, save the outputs.
  4. **Diff** before vs after per surface. For a behavior-preserving change they must be **byte-identical** (modulo intentional, documented differences). Report any diff as a **regression**.
- Relay: which surfaces were diffed, identical vs differing, and the exact diff for any that changed → run `/debug`. Then stop (skip the feature-mode steps — nothing new to confirm).

### Step 0b — Load the spec contract (if a governing ADR exists)

Before scoping, find the **governing ADR** for this change — the feature dir under `docs/adr/NNNN-<feature>/` (or the single `docs/adr/NNNN-<feature>.md`) that the change implements. Match by the branch/feature name or the touched surfaces; if a roadmap exists under `docs/roadmap/`, it points to the ADR. If there is **no** governing ADR (a trivial change, a lean-tier task with no record), skip this step and verify against observed behavior only — the feature/refactor modes below stand alone.

When an ADR **is** found, it carries the **contract**: `## Requirements` with IDed acceptance criteria (`AC-1`, `AC-2`, …) plus the surfaces it specs (pages, routes, tables, migrations). Load the checklist to run against:

1. **Prefer the per-feature `verify.md`** beside the ADR (`docs/adr/NNNN-<feature>/verify.md`) if present — `/develop` emits it as concrete, already-resolved verify steps, each tagged with the `AC-N` it exercises:
   ```markdown
   # Verify — <feature> · ADR NNNN
   ## UI / manual
   - [ ] <action> → <expected>   → AC-N
   ## Commands
   - [ ] `<command>` → <expected> → AC-N
   ## Acceptance-criteria coverage
   - AC-1 … · AC-2 … · …
   ```
2. **Else fall back to the ADR's `## Requirements`** acceptance criteria directly, and turn each `AC-N` into an observable check yourself.

Either way you now hold: the **list of AC-N** to confirm, and the **list of specced surfaces** to confirm exist. Carry both into Steps 1–4; the per-AC conformance verdict is produced in **Step 4b** and reported in **Step 5**. The feature/refactor modes remain the **runtime engine** — spec-conformance decides *what* to check and *what "met" means*; the modes are *how* you drive the app to check it.

### Step 0c — Calibrate "working" to the build approach

Before you decide what to watch, know what *this slice was meant to be*. The project's roadmap header (or root `AGENTS.md`) records the **build approach** the team chose — how they carve a product into shippable slices. "Working" means something different under each, and verifying against the wrong bar produces false failures (dinging a prototype for lacking a real backend) or false passes (blessing a slice that never proved the path it existed to prove).

Read the approach, then reason as the acceptance engineer about what *done* means for the slice in front of you — don't run a fixed per-approach script. The judgment is always the same shape: **what did this slice promise to make real, and what is it explicitly still allowed to fake?** Verify the former hard; don't fail the slice for the latter. For orientation, teams commonly frame slices as a thin **end-to-end path** wired through every layer (verify the whole path carries a real request to a real result), a **thinnest-usable-whole** core loop (verify that one loop genuinely works, not the trimmings), a **UI-first shell** wired to placeholders (verify the shell and its placeholder flow render and navigate — a stubbed data source is the plan, not a defect), or a **full user journey** per phase (verify the journey end to end, not isolated screens). Whatever the label, let it set the bar; then carry that bar into the scope and the conformance verdict below. The acceptance criteria still govern *what* must be true — the build approach tells you *how much of the stack behind them is expected to be real yet.*

### Step 1 — Scope the observable behaviors *(feature mode)*

Pick the base branch `BASE`: `git rev-parse --verify main` — if it succeeds use `main`, otherwise `master`. Then list changed files with `git diff --name-status "$BASE"...HEAD` and `git diff --name-status` (uncommitted too).

**If a spec contract was loaded (Step 0b)**, the checklist *is* your scope: each `verify.md` step / each `AC-N` becomes an observable behavior to exercise, and each specced surface (page, route, table, migration) becomes a thing to confirm was actually built. Don't narrow to only the changed files — an AC or surface that has **no** matching implementation is exactly the miss this gate exists to catch, so keep it on the list and let Step 4b flag it. Use the git diff to locate where each is (or isn't) implemented.

**Otherwise (no ADR)**, from the changed files write the **2–5 concrete things a human could watch** to know the change works — e.g. "the /pricing page renders all three tiers and the CTA opens checkout", "POST /invites returns 201 and emails the invitee", "the export CLI writes a non-empty CSV". If a feature roadmap exists (in `docs/roadmap/`), use the relevant feature's acceptance criteria / sub-tasks to anchor these. Keep them observable, not internal.

### Step 2 — Determine how to run the app

**Monorepo:** run the **specific affected app**, not the repo root — find the workspace the change lives in (`apps/<x>/…`) and use *its* run command (e.g. `pnpm --filter <x> dev`, `turbo run dev --filter <x>`, or the script in that workspace's `package.json`). If the change touches a shared package, run the app(s) that consume it.

In order:
1. **A project run skill / documented command** — check for a project-specific "run/start" skill, then `AGENTS.md`, then `package.json` scripts (`dev`, `start`), `Makefile`, `Procfile`, `docker-compose`. Prefer what the project already uses.
2. **Built-in patterns by project type** if nothing is documented:
   - **Web app** → start the dev server, then drive a browser to the route.
   - **API / backend** → start the server, then hit the endpoint (curl/HTTP client).
   - **CLI** → run the command with representative arguments.
   - **Library** → exercise the public API via a tiny scratch script or the REPL.
   - **Background job / worker** → trigger the job and watch it run to completion.

If you can't tell how to launch it, **ask** the engineer for the start command before proceeding.

### Step 3 — Run and exercise

Launch the app (prefer a background process so you can interact with it). For heavier interaction, **spawn a subagent** with the tools to drive the browser/CLI and capture evidence, so the main context stays clean. For each scoped behavior:
- **UI** → navigate to the route, interact (click, type, submit), capture a screenshot of the result and of any error state. Check the rendered output, not just a 200.
- **API** → send the request, capture status + body; verify the shape and key fields.
- **CLI / job** → run it, capture stdout/stderr and any output artifact.

Watch the server/console logs for errors or warnings that surface even when the UI "looks" fine.

### Step 4 — Observe vs expected

For each behavior, decide **pass / fail / blocked** against what should happen. A behavior that throws, renders broken, returns the wrong shape, or logs an error is a **fail** — capture the exact error. "Blocked" means you couldn't exercise it (missing data/creds) — say what's needed.

### Step 4b — Conformance verdict *(only when a spec contract was loaded in Step 0b)*

Roll the observations up into a **per-criterion** and **per-surface** verdict against the contract. For every `AC-N` and every specced surface, assign one of:

- **met ✅** — the criterion's check passed / the surface exists and behaves as specced.
- **specced-but-missing 🚫** — the ADR specs a surface or criterion that has **no implementation at all**. There is nothing to exercise because it was never built. Name the exact spec item and what to do. e.g. *"ADR specs `/auth/verify-email` — page not found (no route, no file); build it before this is done."* or *"AC-4 requires an audit-log table — no migration and no table in the schema."*
- **specced-but-not-applied ⚠️** — the code exists but its **runtime check fails**: the surface is built but doesn't satisfy the criterion at runtime. The classic case is a written-but-un-applied migration. e.g. *"Migration `0007_add_verified_at.sql` is committed but the column isn't in the live schema — run the migration."* or *"AC-2 says the CTA opens checkout; the button renders but clicking it 404s."*
- **blocked ⚠️** — couldn't be exercised (missing data/creds/env); say what's needed. Distinct from not-applied: not-applied is a confirmed runtime failure, blocked is unknown.

The distinction is the point of this gate: **missing** = never built (a scope miss), **not-applied** = built but not live/correct at runtime (a wiring miss). Both block "done"; report them separately so the fix is obvious. Conformance is only **PASS** when every `AC-N` is met and every specced surface exists — a single missing or not-applied item makes the overall verdict **FAIL**.

### Step 5 — Report

```
## /verify complete

**Ran**: <how the app was started — command / url>
**Scope**: <N> behaviors checked
**Spec**: ADR NNNN <feature> · checklist from verify.md | ADR ## Requirements   (omit this line when no governing ADR)

**Verified** ✅:
- <behavior> — <what you observed (e.g. "all 3 tiers render; CTA opens /checkout")>

**Failed** ❌:
- <behavior> — <what went wrong + exact error/screenshot path> → run /debug

**Blocked** ⚠️:
- <behavior> — <what's needed to verify it (seed data, credentials, env)>

**Spec conformance**: PASS | FAIL   (this whole block only when a spec contract was loaded)
- AC-1 ✅ met — <what confirmed it>
- AC-2 ✅ met — <what confirmed it>
- AC-3 🚫 specced-but-missing — <ADR specs it, no implementation> → build it before done
- AC-4 ⚠️ specced-but-not-applied — <built but runtime check fails, e.g. migration not run> → <fix>

**Missed surfaces** 🚫 (specced in ADR, not built):
- <page / route / table> — <where it was expected> → build before done

**Not applied** ⚠️ (built but not live/correct at runtime):
- <surface / criterion> — <the runtime failure, e.g. "migration committed, column absent from live schema"> → <apply/fix>

**What /test should lock in**:
- <the behaviors above, as permanent assertions>

**For /review or /harden**:
- <anything that worked but looked fragile — slow response, console warning, missing empty state>
```

Drop the **Spec conformance / Missed surfaces / Not applied** sections when there was no governing ADR — they only apply to a spec contract. Keep the sections but write "none" when a contract was loaded and every item is met.

Clean up any process you started. `/verify` confirms reality; it doesn't fix or assert — it points to `/debug` for failures, to `/develop` to build a missing or un-applied surface, and to `/test` to make the passing behaviors permanent. **A FAIL conformance verdict means the feature is not done, even if every test is green.**
