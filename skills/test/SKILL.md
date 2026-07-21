---
name: test
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /test to write a test suite for code you just built or changed, after implementing a feature, route, or fix. Targets uncommitted changes automatically, reads test preferences.json for your framework (asks and saves it if absent), and picks the right strategy per file: happy path, edge cases, error states, accessibility."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

Role: a senior test engineer writing the suite the code deserves, no more, no less. Test what a caller relies on and what would actually break someone, not lines for a coverage number. Pick a strategy per file by reading what the thing is. Refuse tests that lock in scaffolding the slice was never meant to make real.

Target: the code changed in this branch but not yet committed. Each changed file is classified (pure logic, component, API route, page/flow) and tested with the right strategy; tests verify real behavior and catch regressions, not coverage farming. The main thread writes the tests itself (a read only `scout` may do the heavy file reading for a large set); with a governing spec, tests trace to its acceptance criteria (Steps 7 and 8).

Does not write application code. Does not update `AGENTS.md`/`CLAUDE.md` context files (/sync owns that).

## Asks vs acts

- Acts without asking when `test-preferences.json` exists, the tool is installed, and uncommitted source files exist: straight to writing.
- Always asks one thing every run, even with prefs: run the suite after writing, or hand back manual instructions (Step 7.5). Per run choice, never saved.
- Otherwise asks only when: no `test-preferences.json` (framework; E2E addon only if pages/flows changed); a chosen tool is not installed (confirm first); no uncommitted changes (Step 3); >15 files (Step 1b).
- No scope question. The git working tree defines the scope.

## Artifact ownership

- Test files (`*.test.ts`, `*.spec.ts`, `test_*.py`, `*_test.go`, etc.), created by this skill
- `test-preferences.json` at the project root, created and maintained by this skill

---

## Portability (any OS, any agent)

Any Agent Skills client on macOS, Linux, or Windows:
- `git` is the only required CLI, identical everywhere; run the `git` lines as shown. Other shell snippets are POSIX reference, not literal scripts: do not assume `find`, `grep`, `sed`, `cat`, `test`/`[ ]`, `xargs`, `mkdir -p`, or `node -e` exist. Use your agent's cross platform file tools (read, search/glob, write) and apply branching logic yourself, not via shell `if`/variables/redirects.
- Bundled files: referenced relative to this skill's folder. The main thread resolves the folder to an absolute path and reads the bundled files itself at write time (Step 8): `agent-prompt.md` and `writing-guide.md`.
- No interactive question support? Ask any multiple choice question as plain text with the same options.

In the Ask blocks below, each option is `"label": "description"`; render them through your agent's picker (`AskUserQuestion` on Claude Code) or as plain text.

## Execution

### Pre-flight (main thread)

#### 1. Determine scope from git (do this first, if empty, no point asking anything)

Changed but uncommitted files (cross platform git):
- Tracked (staged + unstaged), excluding deletions: `git diff --name-only --diff-filter=ACMR HEAD`
- Untracked, and not ignored: `git ls-files --others --exclude-standard`
- No commits yet (`git diff HEAD` errors): use `git diff --name-only --diff-filter=ACMR --cached`.

Combine, remove duplicates, filter out files that cannot be tested:
- Test files: `*.test.*`, `*.spec.*`, `test_*.py`, `*_test.go`, anything under `__tests__/`, `e2e/`, `tests/`, `cypress/`
- Config: `*.config.*`, `.*rc`, `tsconfig*`, `*.json` (except where logic lives in JSON), `Dockerfile`, CI yaml
- Lock files, `.lock`, generated/build output (`dist/`, `build/`, `.next/`, `coverage/`)
- Styling: `*.css`, `*.scss`, `*.module.css`; type only declarations: `*.d.ts`
- Docs and markdown, specs, `design.md`, `test-preferences.json`

The remainder is the scope. Empty: go to Step 3. Otherwise continue.

#### 1b. Classify each scoped file

Classify from path and filename alone, cheaply; if genuinely ambiguous, tag `logic` and tag it again when you read the file at write time. Record each file's class for the write step.

| Signals in path / filename | Class | Test strategy |
|---|---|---|
| `*.tsx`/`*.jsx`/`*.vue`/`*.svelte` not under a route/page path | **component** | Component test (render + interact + assert DOM/ARIA) |
| `app/**/page.*`, `pages/**` (not `pages/api`), `*Screen.*`, `*View.*` | **page/flow** | E2E candidate + component test of pieces |
| `app/**/route.*`, `pages/api/**`, `*.controller.*`, `*.handler.*`, `*.resolver.*`, `actions.*` | **api/server** | Integration test (call handler, mock at boundary) |
| Plain `.ts`/`.js`/`.py`/`.go`/`.rs`, utils, hooks, services, domain logic | **logic** | Unit test (inputs → outputs, edge cases, errors) |
| `cli.*`, `bin/**`, `*.command.*`, `cmd/**` | **cli** | Integration test invoking the command |

`E2E_RELEVANT = yes` if any file is **page/flow**; otherwise `no`.

Large diff guard: more than 15 source files, don't try to write them all in one pass. Prioritise by class (logic and api/server first, most risk, cheapest to test well) and ask:

```
Ask: "<N> changed files is a lot for one pass. How should I focus?"  (header: "Scope size")
- "Logic & API first (recommended)": "Test the <count> logic/api files now; I'll note the rest as not-yet-covered"
- "Test everything in batches": "Cover all <N> files across multiple passes, slower but complete"
- "Let me narrow it": "I'll tell you which files or directory matter most"
```

Monorepo resolution: find each scoped file's nearest enclosing `package.json` (walk up). Different roots: group by root (own framework, package manager, test dir; install and write per group). One shared root (common case): single project. Record each file's `packageRoot` for the write step.

---

#### 2. Load preferences

Read `test-preferences.json` at the project root (file tool; "not found" = no prefs). Branch on whether it names a `tool`, not on whether the file exists:
- **`tool` is set** (the common write path): load `tool`, `additionalTools`, `e2eTool`, `testDir`, `filePattern`, `packageManager`; skip to Step 5.
- **`tool` is `null` and `gate` is set** (`GATE_ONLY`): this project gates without a test runner, by an earlier deliberate choice. Do not write a suite, do not install a runner, do not ask again, and do not read `modes/setup.md`. Run the project's typecheck/lint gate, then stop and report: "This project gates on `<gate>`, not a test suite. Ran the typecheck gate; use `/check verify` to confirm behavior."
- **No file** (`NO_PREFS`, first run): read `modes/setup.md` and do its Step 4 (stack detection and framework questions), then return here for Step 5 (installation check), then do its Step 6 (save preferences), then continue at Step 7. Do not read `modes/setup.md` on a write run.
- **Malformed** (a file with neither `tool` nor `gate`, or unparseable JSON): say so, then treat it as `NO_PREFS` and run setup again, which overwrites it.

---

#### 3. No uncommitted changes

Empty scope: skip the framework questions, tell the engineer, offer fallbacks:

```
Ask: "No uncommitted source changes found. What should I test?"  (header: "No changes")
- "The last commit": "Diff HEAD~1..HEAD and test what that commit changed"
- "Specific files": "I'll test the files or directory you name"
- "Nothing right now": "Stop. I'll run /test after I make changes"
```

- Last commit: scope = `git diff --name-only --diff-filter=ACMR HEAD~1 HEAD`, run Step 1b again.
- Specific files: classify the named files, continue.
- Nothing: stop cleanly.

---

#### 5. Installation check

Check the chosen unit tool, E2E tool (if any), and addon (if any) with file tools:
- JS/TS: under `node_modules/<pkg>`, or in `package.json` devDependencies?
- Python: in `pyproject.toml`/`requirements.txt` (or `pip show <tool>` where Python is available)?
- Go: `stretchr/testify` in `go.sum`?

All present → Step 6. Any missing → confirm first:

```
Ask: "<missing tools> not installed. Install now?"  (header: "Install")
- "Yes, install and continue": "Run the install with the detected package manager, then write tests"
- "No, write runnable stubs": "Skip install; write tests I can run once I install the tools myself"
```

Yes: install with the project's package manager (`pnpm` shown; substitute the detected npm/yarn/bun, or the language's manager for Python/Go):

```bash
pnpm add -D vitest                                            # unit
pnpm add -D @testing-library/react @testing-library/user-event @testing-library/jest-dom  # addon
pnpm add -D @playwright/test && pnpm exec playwright install  # E2E (Playwright)
pnpm add -D cypress                                          # E2E (Cypress)
pip install pytest pytest-mock                                # Python
go get github.com/stretchr/testify                           # Go
```

"No": record `INSTALL=deferred`; write complete tests anyway, the run command is reported as "run after installing".

---

#### 7. Gather lightweight pointers (do NOT read heavy files here)

Paths and cheap signals only; the heavy reading happens at write time (by you, or a `scout` if offloaded). Do not read specs or `design.md` in full here. Don't read source files here; they're read at write time.

With file tools:
- List the 3 most recently modified spec paths under `docs/specs/` (paths only).
- Identify the governing spec: the feature dir `docs/specs/NNNN-<feature>/` (or single `docs/specs/NNNN-<feature>.md`) these files implement, matched by branch/feature name or touched surfaces (a `docs/scope/` entry, if present, points to it). Note its path and whether a `verify.md` sits beside it (`docs/specs/NNNN-<feature>/verify.md`). This contract is what tests trace to; it may not be among the 3 recent paths. Set `TRACE_TO_CONTRACT = yes` when a governing spec exists, else `no`.
- Note whether `design.md` exists at the project root; use its path only when a **component** or **page/flow** file is in scope, else `none`.
- Read `AGENTS.md` (canonical; `CLAUDE.md` if absent) as project context (short and cheap). Also note the build approach as one line: the slice shaping approach the team chose, recorded in the scope header (or root `AGENTS.md`), e.g. thin end to end path, thinnest usable whole core loop, UI first shell on placeholders, full user journey per phase. It doesn't branch the logic; it calibrates your judgment when writing (Step 8, rule a).
- Read `package.json`, note `scripts.test`. `RUN_COMMAND` = `<pkgmgr> test` when a `test` script exists (`<pkgmgr> run test` for npm); a raw invocation (e.g. `pnpm exec vitest run`) only when none does.

---

#### 7.5 Ask whether to run the suite (always)

```
Ask: "Tests will be written for <N> changed files. Run the suite after writing?"  (header: "Run tests?")
- "Yes, run and fix to green": "Execute the suite; I'll fix any test mistakes and flag real bugs the tests catch"
- "Skip, just write them": "Write the tests and give me manual run-and-verify instructions instead"
```

Set `RUN_AFTER = yes | no` and apply it at write time.

#### 8. Write the suite (main thread)

The main thread writes the tests itself. Do not spawn a writer. Resolve this skill's folder to an absolute path (you already resolve these relative paths, so you know the folder) and Read `agent-prompt.md` and `writing-guide.md` now (only now, at write time): `agent-prompt.md` is your operating template, `writing-guide.md` is the strategy, tool rules, iteration loop, and report format you follow. Reading the changed files under test is the one expensive part; for a large or unfamiliar set, offload just the reading to a read only `scout` subagent on the cheapest model (Claude Code: `haiku`, not inheriting the session model) that returns a compact map, then write from it.

The inputs to apply (the labeled values you gathered):
1. unit tool, E2E tool, additional tools, `INSTALL` state; `testDir`, `filePattern`, package manager, stack/framework, `packageRoot`; the classified scope (each file path with its class: logic / component / page flow / api server / cli); `RUN_COMMAND`, `RUN_AFTER`; project context plus the build approach line; the 3 recent spec paths or `none` (read only if relevant to what you're testing); the design.md path or `none`; `TRACE_TO_CONTRACT`, the governing spec path, and the `verify.md` path (each `none` if absent).
2. Two rules to apply: (a) let the build approach calibrate which behaviors are durably real for this slice (lock those in as stable assertions) versus deliberate scaffolding the slice fakes by design (don't assert a real implementation the plan hasn't built yet, e.g. a real backend expectation on a shell that stubs its data). (b) when `TRACE_TO_CONTRACT = yes`, read the acceptance criteria (from `verify.md` if present, preferring its already resolved `AC-N`-tagged checklist, else the spec's `## Requirements`) and lock in the durable ones: an automated test for every criterion that can be pinned as a stable assertion, each test tagged with the `AC-N` it covers (e.g. a `covers: AC-3` comment, or `AC-3` in the test title) so the suite traces back to the contract. Never fake a criterion that can't be automated (visual/manual/environmental, e.g. "email actually arrives"); record it in `NOT_COVERED` as `AC-N, <why not automatable> → defer to /check verify manual step`.

Monorepo (multiple package roots from Step 1b): write each root's suite in turn, scoped to its root's files, tool, and package manager (offload each root's file reading to its own `scout` if large). Single root (common case): just write it.

---

### After writing the suite

If the write failed or produced no report: say so and do it again; never report a passing or failing suite you didn't actually produce. Otherwise relay the format matching `RUN_AFTER`.

Update the scope: if this feature is on the scope (`docs/scope/`) and the suite passes, tick its `Test it` box. If `Design`, `Build` (+ its milestones), `Verify`, and `Test` are now all ticked, set the feature's status to `done` (in the At a glance table and beside the heading), unless its governing spec is still `Assumed` (a decision built on an unratified assumption): then leave it `in-progress` and point to `/architect <feature>` to ratify first. If tests fail or coverage is partial, leave `Test it` unticked and the status `in-progress`. **Confirm the update as a closing gate** (don't skip it): report exactly what you ticked in each file, e.g. "Scope: ticked `Test it`, status → `done`. Spec: status → `Accepted`." No matching scope row → say so, don't finish silently. On `done`, advise `/clear` before the next feature: the scope and spec hold everything, a fresh session keeps the next build cheap. **Git:** if the nearest `AGENTS.md` `## Git` says `integration: on` and `commit` is not `manual`, offer to commit the suite with a one line subject (`test(<scope>): …`) plus the `Co-Authored-By` trailer; never push. (`/test` is the closer for the `Medium` and `Full` workflow tiers; `Vibe` closes at `/develop` and `Lean` at `/check verify`, so on those tiers this feature would already be `done` or not use `/test`.)

Parse from the report: `TESTS_WRITTEN`, `NOT_COVERED`, plus `RUN_RESULT` and `BUGS_FOUND` when `RUN_AFTER = yes`, or `MANUAL_INSTRUCTIONS` when `RUN_AFTER = no`. Relay this template: keep lines marked `← yes` only when `RUN_AFTER = yes`, `← no` only when `RUN_AFTER = no` (a marked heading carries its list lines), unmarked lines always; strip the markers.

```
## /test complete (suite run)      ← yes; when no, use: ## /test complete (not run)

**Scope**: <N> changed files (uncommitted)
**Tool**: <unit tool> [+ E2E tool] [+ addons]
**Preferences**: loaded | saved to test-preferences.json

**Tests written**:
- `<file path>`, <N tests> covering <happy path / edges / errors / a11y> [→ AC-1, AC-3]

**Run result**: <X passed, Y failed> via `<RUN_COMMAND>`   ← yes

**Traceability** (only when TRACE_TO_CONTRACT=yes, spec NNNN):
- AC-1 ✅ locked in, `<test file · test name>`
- AC-3 ✅ locked in, `<test file · test name>`

**Bugs caught** (tests failing because the code is wrong, not the test):   ← yes
- <file:line, what's broken and the failing expectation>   ← only if BUGS_FOUND is non-empty

**How to run them**:   ← no
1. <setup step, e.g. install if INSTALL=deferred>
2. Run: `<RUN_COMMAND>`
3. Watch a single file: `<focused command>`

**What you should see**: <expected pass output, and which tests prove which behaviour>   ← no
**If something fails**: <how to read the failure, is it a test gap or a real bug>   ← no

**Not covered** (consider adding):
- <gap and why>
- AC-N, <criterion that can't be automated (visual/manual/env)> → defer to /check verify manual step   ← when TRACE_TO_CONTRACT=yes
```

If `BUGS_FOUND` is not empty, lead with it: a test that correctly fails on real broken code is a genuine finding, not something to silence. /test does not modify application code to make a test pass.

This skill is complete after relaying the report: it does not invoke other skills.

---

## Reference files (in this skill's folder; referenced by relative path)

- `modes/setup.md`: first run only steps (stack detection, framework questions, save preferences); read on the main thread only when `NO_PREFS`
- `agent-prompt.md`: the operating template the main thread reads at write time (Step 8)
- `writing-guide.md`: strategy, tool rules, iteration loop, report format; the main thread reads it at write time too
