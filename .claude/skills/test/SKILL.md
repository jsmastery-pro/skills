---
name: test
compatibility: Built for Claude Code — uses subagents, model selection, and interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
description: Use this skill to write a test suite for code you just built or changed. Run /test after implementing a feature, component, API route, or bug fix. It tests the files changed and not yet committed in git (working tree + staged + untracked) — no need to name files. Reads saved preferences from test-preferences.json at the project root; if absent it asks which framework to use, checks if it is installed, installs it with confirmation, then saves preferences for future runs. Acts as a senior test engineer, choosing the right test strategy per file: happy path, edge cases, error states, and accessibility where relevant.
---

## What this skill does

Writes a thorough, maintainable test suite for **the code that changed in this branch but isn't committed yet**. Acts as a senior test engineer — it reads each changed file, classifies what kind of thing it is (pure logic, component, API route, page/flow), and writes tests with the right strategy for each. Tests verify real behavior and catch regressions, not coverage farming.

- **Scope is automatic**: uncommitted git changes (modified, staged, and untracked source files). You don't name files.
- **First run**: asks which framework, checks if installed, installs with your confirmation, saves `test-preferences.json`.
- **Subsequent runs**: reads `test-preferences.json` and skips all tool questions.
- Spawns a subagent to read the changed files and write the tests.

Does not write application code. Does not update CLAUDE.md (/sync owns that).

## Asks vs acts

**Acts without asking** when `test-preferences.json` exists, the tool is installed, and there are uncommitted source files to test — it goes straight to writing.

**Always asks one thing** (every run, even when prefs exist): after the tests are written, whether to run the suite now or hand back manual instructions. This is a per-run execution choice, not a saved preference.

**Otherwise asks** only when:
- No `test-preferences.json` exists (framework; E2E addon only if pages/flows changed)
- A chosen tool is not installed (confirm before installing)
- There are **no** uncommitted changes (offer fallbacks — see Step 3)
- The diff is large (>15 files — see Step 1b)

No scope question. The git working tree defines the scope.

## Artifact ownership

- Test files (`*.test.ts`, `*.spec.ts`, `test_*.py`, `*_test.go`, etc.) — created by this skill
- `test-preferences.json` at the project root — created and maintained by this skill

---

## Portability (any OS, any agent)

This skill targets any Agent Skills client on macOS, Linux, or Windows:
- **Commands**: `git` is the only required CLI and behaves identically on every OS — run the `git` lines as shown. All other shell snippets are POSIX **reference**, not literal scripts: do not assume `find`, `grep`, `sed`, `cat`, `test`/`[ ]`, `xargs`, `mkdir -p`, or `node -e` exist. Use your agent's own cross-platform file tools (read, search/glob, write) to list files, check existence, read, and search, and apply any branching logic yourself rather than via shell `if`/variables/redirects.
- **Bundled files**: referenced by path relative to this skill's own folder. The main agent reads them; anything a subagent needs is passed **into its prompt** as text — subagents can't resolve skill-relative paths.

## Execution

### Pre-flight (main model)

#### 1. Determine scope from git (do this first — if empty, no point asking anything)

Get the changed-but-uncommitted files (run these `git` commands — cross-platform):
- Tracked changes vs last commit (staged + unstaged), excluding deletions: `git diff --name-only --diff-filter=ACMR HEAD`
- Untracked, non-ignored files: `git ls-files --others --exclude-standard`
- If the repo has no commits yet (`git diff HEAD` errors), use `git diff --name-only --diff-filter=ACMR --cached` instead.

Combine and de-duplicate the two lists. Then **filter out non-testable files**:
- Test files themselves: `*.test.*`, `*.spec.*`, `test_*.py`, `*_test.go`, anything under `__tests__/`, `e2e/`, `tests/`, `cypress/`
- Config: `*.config.*`, `.*rc`, `tsconfig*`, `*.json` (except where logic lives in JSON), `Dockerfile`, CI yaml
- Lock files, `.lock`, generated/build output (`dist/`, `build/`, `.next/`, `coverage/`)
- Pure styling: `*.css`, `*.scss`, `*.module.css`
- Type-only declarations: `*.d.ts`
- Docs and markdown, ADRs, `design.md`, `test-preferences.json`

**The remaining list is the scope.** If it is empty → go to **Step 3 — No changes**. Otherwise continue.

#### 1b. Classify each scoped file

Tag every file so the subagent knows the strategy. The classification also decides whether E2E is relevant. **Classify from the path and filename alone — do not read file contents in the main thread.** A correct-enough tag is all the subagent needs; if a file is genuinely ambiguous, tag it `logic` and let the subagent re-tag it when it reads.

| Signals in path / filename | Class | Test strategy |
|---|---|---|
| `*.tsx`/`*.jsx`/`*.vue`/`*.svelte` not under a route/page path | **component** | Component test (render + interact + assert DOM/ARIA) |
| `app/**/page.*`, `pages/**` (not `pages/api`), `*Screen.*`, `*View.*` | **page/flow** | E2E candidate + component test of pieces |
| `app/**/route.*`, `pages/api/**`, `*.controller.*`, `*.handler.*`, `*.resolver.*`, `actions.*` | **api/server** | Integration test (call handler, mock at boundary) |
| Plain `.ts`/`.js`/`.py`/`.go`/`.rs` — utils, hooks, services, domain logic | **logic** | Unit test (inputs → outputs, edge cases, errors) |
| `cli.*`, `bin/**`, `*.command.*`, `cmd/**` | **cli** | Integration test invoking the command |

Record the class next to each file path — it goes into the subagent prompt.

`E2E_RELEVANT = yes` if any file is **page/flow**; otherwise `no`.

**Large diff guard.** If the scope has **more than 15** source files, do not dump them all into one subagent. Prioritise by class (logic and api/server first — they carry the most risk and are cheapest to test well), and ask:

```
AskUserQuestion — "<N> changed files is a lot for one pass. How should I focus?"
  header: "Scope size"
  options:
    - label: "Logic & API first (recommended)"
      description: "Test the <count> logic/api files now; I'll note the rest as not-yet-covered"
    - label: "Test everything in batches"
      description: "Cover all <N> files across multiple subagent passes — slower but complete"
    - label: "Let me narrow it"
      description: "I'll tell you which files or directory matter most"
```

**Monorepo resolution.** For each scoped file, find its nearest enclosing `package.json` (walk up from the file). If files resolve to **different** package roots, group them by root — each group has its own framework, package manager, and test dir. Run installation and the subagent per group. If all files share one root (the common case), treat it as a single project. Record each file's `packageRoot` to pass to the subagent.

---

#### 2. Load preferences

Read `test-preferences.json` at the project root (use your file tool; treat "not found" as no prefs).

**If found**: load `tool`, `additionalTools`, `e2eTool`, `testDir`, `filePattern`, `packageManager`. Skip to **Step 5 — Installation check**.

**If `NO_PREFS`**: continue to Step 4 (stack detection) → first-run questions.

---

#### 3. No uncommitted changes

If Step 1 produced an empty scope, do not ask the framework questions. Tell the engineer and offer fallbacks:

```
AskUserQuestion — "No uncommitted source changes found. What should I test?"
  header: "No changes"
  options:
    - label: "The last commit"
      description: "Diff HEAD~1..HEAD and test what that commit changed"
    - label: "Specific files"
      description: "I'll test the files or directory you name"
    - label: "Nothing right now"
      description: "Stop — I'll run /test after I make changes"
```

- **Last commit**: scope = `git diff --name-only --diff-filter=ACMR HEAD~1 HEAD` (cross-platform git), then re-run Step 1b classification.
- **Specific files**: use the named files, classify them, continue.
- **Nothing**: stop cleanly.

---

#### 4. Stack detection and first-run questions (only when `NO_PREFS`)

Using your file tools (not shell utilities), determine:
- **Package manager** — by which lockfile is present: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lockb` → bun, `package-lock.json` → npm.
- **Language & framework** — read `package.json` and look for `next`/`vite`/`nuxt`/`svelte`/`react`; or `pyproject.toml` (pytest/unittest) → Python; `go.mod` → Go; `Cargo.toml` → Rust.
- **Already-installed test tools** — in `package.json` look for `vitest`/`jest`/`@playwright/test`/`cypress`/`@testing-library/*`.

**Q1 — Framework for unit/integration** (always asked on first run)

Filter by detected language. If a tool is already installed, list it first with `(already installed)` appended and treat it as recommended.

| Language | Options (max 4) |
|---|---|
| JS / TS | Vitest (recommended), Jest, [+ already-installed first] |
| Python | pytest (recommended), unittest |
| Go | `testing` + testify (recommended), `testing` stdlib only |
| Rust | `cargo test` (built-in) — no question needed, skip |
| Other | free-text |

```
AskUserQuestion — "Which framework for unit & integration tests?"
  header: "Framework"
  options: [filtered list]
```

**Q2 — E2E tool** (ask only if `E2E_RELEVANT = yes`)

Page/flow files were changed, so an E2E layer is worth offering:

```
AskUserQuestion — "Pages/flows changed. Add end-to-end tests too?"
  header: "E2E"
  options:
    - label: "Playwright (recommended)"
      description: "Real-browser flow tests for the changed pages"
    - label: "Cypress"
      description: "Real-browser flow tests with the Cypress runner"
    - label: "No E2E — unit/component only"
      description: "Skip browser tests; cover pages at the component level"
```

**Q3 — Component testing addon** (JS/TS only, when any **component** or **page/flow** file is in scope and React/Vue/Svelte is detected)

```
AskUserQuestion — "Add component testing support?"
  header: "Components"
  options:
    - label: "Yes — Testing Library (recommended)"
      description: "Installs @testing-library/<framework> + user-event for render+interact tests"
    - label: "No — logic tests only"
      description: "Plain module/function tests, no DOM rendering"
```

Skip Q3 entirely if scope is logic/api/cli only — no component tooling needed.

---

#### 5. Installation check

For the chosen unit tool, E2E tool (if any), and addon (if any), check whether it's installed using your file tools:
- **JS/TS** — is the package present under `node_modules/<pkg>`, or listed in `package.json` devDependencies?
- **Python** — is the tool in `pyproject.toml`/`requirements.txt` (or run `pip show <tool>` where Python is available)?
- **Go** — does `go.sum` contain `stretchr/testify`?

**All present** → Step 6.

**Any missing** → confirm before installing:

```
AskUserQuestion — "<missing tools> not installed. Install now?"
  header: "Install"
  options:
    - label: "Yes — install and continue"
      description: "Run the install with the detected package manager, then write tests"
    - label: "No — write runnable stubs"
      description: "Skip install; write tests I can run once I install the tools myself"
```

If yes, run with the detected package manager (`pnpm` shown; swap for npm/yarn/bun):

```bash
pnpm add -D vitest                                            # unit
pnpm add -D @testing-library/react @testing-library/user-event @testing-library/jest-dom  # addon
pnpm add -D @playwright/test && pnpm exec playwright install  # E2E (Playwright)
pnpm add -D cypress                                          # E2E (Cypress)
pip install pytest pytest-mock                                # Python
go get github.com/stretchr/testify                           # Go
```

If "No", record `INSTALL=deferred` so the subagent writes complete tests but the run command is reported as "run after installing".

---

#### 6. Save preferences (first run only)

Write `test-preferences.json` at the project root:

```json
{
  "tool": "<unit framework>",
  "additionalTools": ["@testing-library/react"],
  "e2eTool": "<playwright|cypress|none>",
  "testDir": "<conventional dir for the tool>",
  "filePattern": "<*.test.ts>",
  "packageManager": "<npm|pnpm|yarn|bun>"
}
```

Conventional directories and patterns:

| Tool | `testDir` | `filePattern` |
|---|---|---|
| Vitest | co-located (next to source) | `*.test.ts` / `*.test.tsx` |
| Jest | co-located or `__tests__/` | `*.test.ts` |
| Playwright | `e2e/` | `*.spec.ts` |
| Cypress | `cypress/e2e/` | `*.cy.ts` |
| pytest | `tests/` mirroring source | `test_*.py` |
| Go testing | same package as source | `*_test.go` |
| Rust | `#[cfg(test)]` in-file / `tests/` | n/a |

Then tell the engineer:
> "Preferences saved to `test-preferences.json` — future `/test` runs load these and skip straight to writing."

---

#### 7. Gather lightweight pointers (do NOT read heavy files here)

The main model stays lean — it discovers **paths and cheap signals only** and lets the subagent do the heavy reading. Reading ADRs and `design.md` in full here would pin large content in the main context and then duplicate it into the subagent prompt; don't.

Using your file tools:
- List the 3 most-recently-modified ADR files under `docs/adr/` (paths only — don't read them).
- Note whether `design.md` exists at the project root.
- Read `package.json` and note its `scripts.test` value (decides `RUN_COMMAND`), if any.

What the main model passes to the subagent:
- **CLAUDE.md**: inline its contents (it's short by design and already in session context — cheap, and consistent with the other skills).
- **ADRs**: pass the **3 recent paths**. The subagent reads them itself, and only if relevant to what it's testing.
- **design.md**: pass the **path**, and only when a **component** or **page/flow** file is in scope. The subagent reads it. Pass `none` otherwise.
- **Source files**: never read here — the subagent reads each scoped file.

**`RUN_COMMAND` source**: if the project defines a `test` script, the run command is `<pkgmgr> test` (or `<pkgmgr> run test` for npm). Only fall back to a raw invocation (e.g. `pnpm exec vitest run`) when no test script exists. Pass the resolved command to the subagent.

---

#### 7.5 Ask whether to run the suite (always)

```
AskUserQuestion — "Tests will be written for <N> changed files. Run the suite after writing?"
  header: "Run tests?"
  options:
    - label: "Yes — run and fix to green"
      description: "Execute the suite; I'll fix any test mistakes and flag real bugs the tests catch"
    - label: "Skip — just write them"
      description: "Write the tests and give me manual run-and-verify instructions instead"
```

Set `RUN_AFTER = yes | no` from the answer and pass it to the subagent.

#### 8. Spawn subagent

Read two bundled files from this skill's folder (relative paths — you, the main agent, can resolve them): `agent-prompt.md` (the spawn template) and `writing-guide.md` (the strategy/rules/report rubric). Fill the template **and inline the full `writing-guide.md` text into it** — the subagent cannot resolve skill paths itself, so it must receive the guide as prompt text. Then spawn:

- `model: "sonnet"`
- `description: "Test: <tool> suite for <N> changed files"`
- Tools: `Read`, `Bash`, `Write`, `Edit`
- `prompt`: filled template with:
  1. The full `writing-guide.md` content (injected, not referenced)
  2. Unit tool, E2E tool, additional tools, `INSTALL` state
  3. `testDir`, `filePattern`, package manager, stack/framework, `packageRoot`
  4. **Classified scope** — each file path with its class (logic / component / page-flow / api-server / cli)
  5. `RUN_COMMAND` (resolved in Step 7), `RUN_AFTER` flag
  6. **CLAUDE.md contents** inline (short)
  7. **ADR paths** — the 3 recent paths, or `none`. (If the subagent has no file access in your client, read and inline the relevant ADR text instead.)
  8. **design.md path** — only if component/page scope, else `none`

**Monorepo (multiple package roots from Step 1b)**: spawn **one subagent per root in parallel** with `run_in_background: true`, each scoped to that root's files, tool, and package manager. Isolated contexts keep each subagent lean and prevent one root's files from bleeding into another's. Collect all reports before relaying. For a single root (the common case), spawn one subagent in the foreground.

---

### After subagent completes

The subagent's report differs by branch. Relay the matching format.

**If `RUN_AFTER = yes`** — parse `TESTS_WRITTEN`, `RUN_RESULT`, `BUGS_FOUND`, `NOT_COVERED`, `HARDEN_FLAG`:

```
## /test complete — suite run

**Scope**: <N> changed files (uncommitted)
**Tool**: <unit tool> [+ E2E tool] [+ addons]
**Preferences**: loaded | saved to test-preferences.json

**Tests written**:
- `<file path>` — <N tests> covering <happy path / edges / errors / a11y>

**Run result**: <X passed, Y failed> via `<RUN_COMMAND>`

**Bugs caught** (tests failing because the code is wrong, not the test):
- <file:line — what's broken and the failing expectation>   ← only if BUGS_FOUND is non-empty

**Not covered** (consider adding):
- <gap and why>

**What /harden should check**: <only if HARDEN_FLAG=yes — one sentence>
```

If `BUGS_FOUND` is non-empty, lead with it — a green suite is the goal, but a test that correctly fails on real broken code is a genuine finding, not something to silence. /test does not modify application code to make a test pass.

**If `RUN_AFTER = no`** — parse `TESTS_WRITTEN`, `MANUAL_INSTRUCTIONS`, `NOT_COVERED`, `HARDEN_FLAG`:

```
## /test complete — not run

**Scope**: <N> changed files (uncommitted)
**Tool**: <unit tool> [+ E2E tool] [+ addons]
**Preferences**: loaded | saved to test-preferences.json

**Tests written**:
- `<file path>` — <N tests> covering <happy path / edges / errors / a11y>

**How to run them**:
1. <setup step, e.g. install if INSTALL=deferred>
2. Run: `<RUN_COMMAND>`
3. Watch a single file: `<focused command>`

**What you should see**: <expected pass output, and which tests prove which behaviour>
**If something fails**: <how to read the failure — is it a test gap or a real bug>

**Not covered** (consider adding):
- <gap and why>

**What /harden should check**: <only if HARDEN_FLAG=yes — one sentence>
```

Omit the harden line entirely when `HARDEN_FLAG=no`. This skill is complete after relaying the report — it does not invoke other skills.

---

## Reference files (in this skill's folder; referenced by relative path)

- `agent-prompt.md` — lean spawn template the main model fills
- `writing-guide.md` — strategy, tool rules, iteration loop, report format. The main model reads this and **injects its text into the subagent prompt** (subagents can't resolve skill paths), so it stays portable across agents.
