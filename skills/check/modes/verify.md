# /check verify (runtime proof)

The `verify` mode of `/check`: run the real app and prove the change works. Follow it fully.

## What this skill does

Your role: the acceptance engineer. Trust observed behavior over green checkmarks; a passing suite proves the code the author thought to test, not that the feature exists. Ask: "If I had to sign off that this is real, what would I need to watch happen with my own eyes?" Then drive the actual thing and judge what you see against what the slice was supposed to deliver.

`/check verify` closes the gap between "the tests are green" and "the feature actually works":

1. Scopes what changed (from git) into observable behaviors to check, anchored to the spec's acceptance criteria when a governing spec exists.
2. Runs the app the project's own way, reusing its launch method when one exists.
3. Exercises the changed flow and observes: screenshots for UI, response bodies for APIs, output for CLIs, logs for jobs.
4. Reports pass/fail per behavior and per acceptance criterion, anything anomalous, and what `/test` should turn into permanent assertions.

Runtime counterpart to `/test`: `/test` writes assertions that run forever; `/check verify` opens the app once and confirms it's real before review.

Spec conformance gate: when a governing spec has IDed acceptance criteria (`## Requirements`, `AC-1…`), also prove the implementation conforms to the contract: every criterion met, every specced surface (page, route, table) actually built. Green tests and a working happy path never reveal a surface that was specced but never built, or a migration never applied. See Step 0b and Step 4b.

## Asks vs acts

Acts: scopes from git, works out the launch, runs, observes, reports. Asks only when it cannot determine how to start the app or which flow to exercise (e.g. a route needing seeded data or credentials). Never modifies application code; report breakage and point to `/debug` or `/develop`.

## Artifact ownership

Owns no durable files. Chat output only (plus screenshots/logs saved to the scratch area). Does not write code (`/develop`), tests (`/test`), or context files.

---

## Portability (any OS, any agent)

Any Agent Skills client on macOS, Linux, or Windows. Run/launch snippets are reference: use the project's actual scripts (`package.json`, `Makefile`, `justfile`, etc.) and your agent's own process/browser tools. Can't drive a browser or capture screenshots? Describe the manual steps for the engineer to run and report back what they see. No subagent support? Run the verification inline.

## Execution

### Step 0: Pick the mode

- Feature mode (default): the change adds or alters behavior. Confirm it does the new thing (Steps 1 to 5).
- Refactor / regression mode: the change is behavior preserving (a refactor, a dedup, a rename; the task or spec says "behavior must not change"). "Works" means identical before and after: capture observable outputs before the change, capture them after, and diff. This is the safety net for projects with no test runner, and exactly what a "diff API responses before/after" spec asks for; automate it.

### Step 0a: Refactor mode: before/after diff (spawn a subagent)

Only in refactor mode. It drives the app twice and holds two output sets, so run it in a subagent to keep the main context clean:
- `model`: set explicitly to a strong model, do not inherit the session model (Claude Code: `sonnet`) · `description: "Verify: before/after diff, <scope>"` · Tools: `Read`, `Bash`, `Grep`, `Glob` (+ browser/HTTP driving)
- Its job:
  1. Identify the affected surfaces from the diff (endpoints, queries, jobs, pages). Pick representative ones per changed area, favoring output that is most observable and most likely to reveal a behavior shift.
  2. Capture BEFORE (the state before the change). Prefer a throwaway git worktree at the ref before the change (the base branch, or the commit before the refactor): `git worktree add <tmp> <ref>`, start the app in that worktree, hit each surface, save the raw outputs, `git worktree remove <tmp>`. This keeps the working tree and untracked files intact. Only if worktrees aren't available, fall back to `git stash --include-untracked` (plain `git stash` leaves new files behind and contaminates the "before"), restore with `git stash pop` after.
  3. Capture AFTER: with the change applied, start the app, hit the same surfaces the same way, save the outputs.
  4. Diff before vs after per surface. For a behavior preserving change they must be byte identical (modulo intentional, documented differences). Report any diff as a regression.
- Relay: surfaces diffed, identical vs differing, the exact diff for any that changed → run `/debug`. Then stop (skip the feature mode steps).

### Step 0b: Load the spec contract (if a governing spec exists)

Before scoping, find the governing spec: the feature dir `docs/specs/NNNN-<feature>/` (or single file `docs/specs/NNNN-<feature>.md`) this change implements. Match by branch/feature name or touched surfaces; a scope under `docs/scope/` points to the spec. No governing spec (a trivial change with no record)? Skip this step and verify against observed behavior only.

The spec carries the contract: `## Requirements` with IDed acceptance criteria (`AC-1`, `AC-2`, …) plus the surfaces it specs (pages, routes, tables, migrations). Load the checklist:

1. Prefer the per feature `verify.md` beside the spec (`docs/specs/NNNN-<feature>/verify.md`) if present; `/develop` emits it as concrete, already resolved verify steps tagged with the `AC-N` each exercises:
   ```markdown
   # Verify: <feature> · spec NNNN
   ## UI / manual
   - [ ] <action> → <expected>   → AC-N
   ## Commands
   - [ ] `<command>` → <expected> → AC-N
   ## Acceptance-criteria coverage
   - AC-1 … · AC-2 … · …
   ```
2. Else fall back to the spec's `## Requirements` directly, and turn each `AC-N` into an observable check yourself.

You now hold the `AC-N` list to confirm and the specced surface list to confirm exists. Carry both into Steps 1 to 4; the per AC verdict comes in Step 4b, reported in Step 5. Spec conformance decides what to check and what "met" means; the feature/refactor modes are how you drive the app to check it.

### Step 0c: Calibrate "working" to the build approach

Know what this slice was meant to be. Read the build approach for THIS feature with precedence: the feature's scope row `Approach` override if its row declares one, else the project default (root `AGENTS.md`, else the scope header). This mirrors spec overrides-`AGENTS.md`: a feature declaring its own approach (e.g. a Facade prototype in an otherwise Skateboard project) is verified by ITS approach; every other feature uses the project default. If neither records one, use the reasoned default (an end to end / Tracer Bullet slice for production work) and note the assumption. The wrong bar produces false failures (dinging a prototype for lacking a real backend) or false passes (blessing a slice that never proved the path it existed to prove).

Reason as the acceptance engineer about what done means for this slice; no fixed per approach script. The judgment: what did this slice promise to make real, and what is it explicitly still allowed to fake? Verify the former hard; don't fail the slice for the latter. Common framings and their bars: a thin end to end path wired through every layer (the whole path carries a real request to a real result); a thinnest usable whole core loop (that one loop genuinely works, not the trimmings); a UI first shell wired to placeholders (the shell and its placeholder flow render and navigate; a stubbed data source is the plan, not a defect); a full user journey per phase (the journey end to end, not isolated screens). Let the label set the bar, then carry it into the scope and the conformance verdict. Acceptance criteria govern what must be true; the approach tells how much of the stack behind them is expected to be real yet.

### Step 1: Scope the observable behaviors *(feature mode)*

Base branch `BASE`: `git rev-parse --verify main`; on success use `main`, otherwise `master`. List changed files: `git diff --name-status "$BASE"...HEAD` and `git diff --name-status` (uncommitted too).

Spec contract loaded (Step 0b)? The checklist is your scope: each `verify.md` step / `AC-N` is an observable behavior to exercise, each specced surface (page, route, table, migration) a thing to confirm was built. Don't narrow to only the changed files: an AC or surface with no implementation is exactly the miss this gate catches; keep it listed and let Step 4b flag it. Use the git diff to locate where each is (or isn't) implemented.

No spec? From the changed files write the 2 to 5 concrete things a human could watch to know the change works, e.g. "the /pricing page renders all three tiers and the CTA opens checkout". If a feature scope exists (in `docs/scope/`), anchor these to that feature's acceptance criteria / sub tasks. Keep them observable, not internal.

### Step 2: Determine how to run the app

Monorepo: run the specific affected app, not the repo root. Find the workspace the change lives in (`apps/<x>/…`) and use its run command (e.g. `pnpm --filter <x> dev`, `turbo run dev --filter <x>`, or that workspace's `package.json` script). A change to a shared package: run the app(s) that consume it.

In order:
1. A project run skill / documented command: a project specific "run/start" skill, then `AGENTS.md`, then `package.json` scripts (`dev`, `start`), `Makefile`, `Procfile`, `docker-compose`. Prefer what the project already uses.
2. Built in patterns by project type if nothing is documented:
   - Web app → start the dev server, then drive the route: prefer a connected browser/Playwright MCP (real navigation, clicks, form submits, screenshots); else your agent's own browser tool; else, headless, request the route over HTTP and check the returned HTML plus a boot check (server starts, health route responds).
   - API / backend → start the server, hit the endpoint (curl/HTTP client).
   - CLI → run the command with representative arguments.
   - Library → exercise the public API via a tiny scratch script or the REPL.
   - Background job / worker → trigger the job and watch it run to completion.

Can't tell how to launch it? Ask the engineer for the start command before proceeding.

### Step 3: Run and exercise

Launch the app (prefer a background process so you can interact with it). Use a connected MCP where it makes the check real: a browser/Playwright MCP to drive the UI (navigate, click, type, submit, screenshot); a database MCP to confirm the live schema for a data layer criterion (the migration applied check in Step 4b: proof the column really exists, not an assumption). For heavier interaction, spawn a subagent with the tools to drive the browser/CLI and capture evidence, keeping the main context clean. Per scoped behavior:
- UI → navigate to the route, interact (click, type, submit), screenshot the result and any error state. Check the rendered output, not just a 200.
- API → send the request, capture status + body; verify the shape and key fields.
- CLI / job → run it, capture stdout/stderr and any output artifact.

Watch server/console logs for errors or warnings even when the UI "looks" fine.

**Keep an evidence ledger as you go.** For every behavior you exercise, write down, at the moment you observe it, the artifact that proves you exercised it:

| Behavior kind | The evidence to record |
|---|---|
| UI | the URL you loaded, the screenshot path you saved, and what you saw rendered |
| API | the exact request line, the HTTP status, and the key fields of the body |
| CLI / job | the exact command, its exit code, and the stdout/stderr excerpt |
| Data layer | the query you ran against the live schema, and its result |

You cite these in the report. A behavior with no recorded evidence is not verified, however sure you are.

### Step 4: Observe vs expected

Per behavior, decide pass / fail / blocked against what should happen. A behavior that throws, renders broken, returns the wrong shape, or logs an error is a fail; capture the exact error. "Blocked" means you couldn't exercise it (missing data/creds); say what's needed.

### Step 4b: Conformance verdict *(only when a spec contract was loaded in Step 0b)*

Roll observations into a per criterion and per surface verdict. For every `AC-N` and specced surface, assign:

- met ✅: the check passed / the surface exists and behaves as specced.
- specced but missing 🚫: specced but no implementation at all; never built, nothing to exercise. Name the exact spec item and the fix, e.g. "the spec requires `/auth/verify-email`, page not found (no route, no file); build it before this is done."
- specced but not applied ⚠️: the code exists but its runtime check fails. Classic case: a written but un applied migration, e.g. "Migration `0007_add_verified_at.sql` is committed but the column isn't in the live schema; run the migration."
- blocked ⚠️: couldn't be exercised (missing data/creds/env); say what's needed. Not applied is a confirmed runtime failure; blocked is unknown.

Missing = never built (a scope miss); not applied = built but not live/correct at runtime (a wiring miss). Both block "done"; report them separately so the fix is obvious. Conformance is PASS only when every `AC-N` is met and every specced surface exists; one missing or not applied item makes the overall verdict FAIL.

### Step 4c: The evidence gate (a verdict you cannot fabricate)

This skill exists to prove the change works by running it. Reading the code, seeing green tests, or reasoning that it *should* work are not observations, and none of them may produce a ✅ or a PASS. Apply these rules literally:

1. **No evidence, no ✅.** A behavior is `met` only if you can cite the ledger entry from Step 3 that proves it: the command and its output, the URL and what rendered, the screenshot path, the query and its result. Cite it inline in the report. If you cannot cite it, the behavior is `blocked`, not `met`.
2. **Never started, never PASS.** If you did not actually launch and exercise the app in this run (no dev server, no request sent, no command run), you may not emit PASS or ✅ for anything. Report `blocked` for every behavior, say plainly that nothing was exercised and why, and stop.
3. **A tool you could not use is a block, not a pass.** No browser MCP, no database MCP, missing credentials, a build that will not start: each makes the behaviors that needed it `blocked`. Degrading to "looks right in the code" is the exact failure this skill is built to prevent.
4. **Say what you did not check.** If some behaviors were exercised and others were not, the report must list the unexercised ones under Blocked. A partial run reported as a full pass is worse than no run.

Overall verdict PASS requires every behavior verified with cited evidence, and (when a spec contract was loaded) every `AC-N` met and every specced surface present. Anything else is FAIL or BLOCKED.

### Step 5: Report

Update the scope: if this feature is on the scope (`docs/scope/`) and the verdict is PASS, tick its `Verify it` box. What happens next depends on the workflow tier (the effective tier: the feature's own tier tag if set, else the scope header `**Workflow:**` default):

- **Lean** → `/check verify` is the last required stage, so on PASS also set the feature `done` (At a glance table and heading) and mirror the governing spec's `**Status**:` line `In Progress` → `Accepted` (surgically; not `In Progress` → flag, don't clobber). Exception: an `Assumed` spec blocks `done`, leave it `in-progress` and point to `/architect <feature>` to ratify first. Then point to `/sync`.
- **Medium / Full** → leave `Test it` and the `done` status to `/test` and `/sync`; point to `/test <feature>` next.

On FAIL or BLOCKED, tick nothing and report the gaps. Advise `/clear` before moving to a new feature (the spec and `verify.md` hold the state, so a fresh session loses nothing and stays cheap).

```
## /check verify complete

**Ran**: <how the app was started: the exact command or url. "Not started" if you never ran it, in which case no ✅ or PASS is allowed>
**Scope**: <N> behaviors checked, <M> not exercised
**Spec**: spec NNNN <feature> · checklist from verify.md | spec ## Requirements   (omit this line when no governing spec)

**Verified** ✅  (each line MUST cite its evidence; drop the line if you have none):
- <behavior>: <what you observed>, evidence: <command + exit code | url + screenshot path | request + status + fields | query + result>

**Failed** ❌:
- <behavior>: <what went wrong + exact error/screenshot path> → run /debug

**Blocked** ⚠️:
- <behavior>: <what's needed to verify it (seed data, credentials, env)>

**Spec conformance**: PASS | FAIL | BLOCKED   (this whole block only when a spec contract was loaded)
- AC-1 ✅ met: <the observation that confirmed it, with its evidence>
- AC-2 ✅ met: <the observation that confirmed it, with its evidence>
- AC-3 🚫 specced-but-missing: <spec requires it, no implementation> → build it before done
- AC-4 ⚠️ specced-but-not-applied: <built but runtime check fails, e.g. migration not run> → <fix>

**Missed surfaces** 🚫 (specced in spec, not built):
- <page / route / table>: <where it was expected> → build before done

**Not applied** ⚠️ (built but not live/correct at runtime):
- <surface / criterion>: <the runtime failure, e.g. "migration committed, column absent from live schema"> → <apply/fix>

**What /test should lock in**:
- <the behaviors above, as permanent assertions>

**For /check review**:
- <anything that worked but looked fragile: slow response, console warning, missing empty state>
```

Drop the Spec conformance / Missed surfaces / Not applied sections when there was no governing spec. Keep them but write "none" when a contract was loaded and every item is met.

Clean up any process you started. `/check verify` confirms reality, never fixes or asserts: `/debug` for failures, `/develop` to build a surface that is missing or not applied, `/test` to make passing behaviors permanent. A FAIL conformance verdict means the feature is not done, even if every test is green.

A BLOCKED verdict is an honest, useful result: it says the change could not be exercised and names what would make it exercisable. A fabricated PASS is the one output this skill must never produce, because every later step trusts it.
