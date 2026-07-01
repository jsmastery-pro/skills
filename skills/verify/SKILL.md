---
name: verify
compatibility: Built for Claude Code — uses subagents and can drive a browser/CLI. Installs on any Agent Skills client but is tuned for Claude Code.
allowed-tools: Bash, Read, Grep, Glob, Write, Task, AskUserQuestion
description: "Use this skill to confirm a change actually works by running the real app and watching its behavior — not just that tests pass. Run /verify after /develop and before /review, or any time you need to see a feature work end to end: it launches the app, exercises the changed flow, and checks the observable result (UI, an API response, CLI output, a job). For a **behavior-preserving refactor** (or a project with no test runner), it runs a before/after diff — capturing the affected outputs pre- and post-change and proving they're identical — which is the regression gate a refactor needs. Complements /test with runtime confirmation; reports what worked, what didn't, and what /test should lock in. It doesn't write code."
---

## What this skill does

Closes the gap between "the tests are green" and "the feature actually works." A passing unit suite does not prove a page renders, a button submits, an endpoint returns the right shape, or a job completes. `/verify` **runs the thing and watches it behave.**

1. **Scopes** what changed (from git) into a short list of observable behaviors to check.
2. **Runs** the app the way this project runs — reusing the project's own launch method when one exists.
3. **Exercises** the changed flow and **observes** the result — screenshots for UI, response bodies for APIs, output for CLIs, logs for jobs.
4. **Reports** pass/fail per behavior, anything anomalous, and what `/test` should turn into a permanent assertion.

It is the runtime counterpart to `/test`: `/test` writes assertions that run forever; `/verify` is the senior engineer who opens the app once and confirms it's real before review.

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
- `model: "sonnet"` · `description: "Verify: before/after diff — <scope>"` · Tools: `Read`, `Bash`, `Grep`, `Glob` (+ browser/HTTP driving)
- Its job:
  1. Identify the **affected surfaces** from the diff — the endpoints, queries, or pages the refactor touches (e.g. `getAllCourses`, `getCourseBySlug`, the KB list). Pick representative ones per changed area.
  2. **Capture BEFORE** — from the pre-change state: `git stash` the working change (or check out `$BASE` in a worktree), start the app, hit each surface, and save the raw responses/rendered output. Then **restore** the change (`git stash pop` / return to the branch).
  3. **Capture AFTER** — with the change applied, start the app, hit the same surfaces the same way, save the outputs.
  4. **Diff** before vs after per surface. For a behavior-preserving change they must be **byte-identical** (modulo intentional, documented differences). Report any diff as a **regression**.
- Relay: which surfaces were diffed, identical vs differing, and the exact diff for any that changed → run `/debug`. Then stop (skip the feature-mode steps — nothing new to confirm).

### Step 1 — Scope the observable behaviors *(feature mode)*

```bash
git rev-parse --verify main >/dev/null 2>&1 && BASE=main || BASE=master
git diff --name-status "$BASE"...HEAD 2>/dev/null
git diff --name-status 2>/dev/null           # uncommitted too
```

From the changed files, write the **2–5 concrete things a human could watch** to know the change works — e.g. "the /pricing page renders all three tiers and the CTA opens checkout", "POST /invites returns 201 and emails the invitee", "the export CLI writes a non-empty CSV". If a feature roadmap exists (in `docs/mvp/`), use the relevant feature's acceptance criteria / sub-tasks to anchor these. Keep them observable, not internal.

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

### Step 5 — Report

```
## /verify complete

**Ran**: <how the app was started — command / url>
**Scope**: <N> behaviors checked

**Verified** ✅:
- <behavior> — <what you observed (e.g. "all 3 tiers render; CTA opens /checkout")>

**Failed** ❌:
- <behavior> — <what went wrong + exact error/screenshot path> → run /debug

**Blocked** ⚠️:
- <behavior> — <what's needed to verify it (seed data, credentials, env)>

**What /test should lock in**:
- <the behaviors above, as permanent assertions>

**For /review or /harden**:
- <anything that worked but looked fragile — slow response, console warning, missing empty state>
```

Clean up any process you started. `/verify` confirms reality; it doesn't fix or assert — it points to `/debug` for failures and `/test` to make the passing behaviors permanent.
