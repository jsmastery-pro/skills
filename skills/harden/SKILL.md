---
name: harden
compatibility: Built for Claude Code — uses subagents, model selection, and interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
allowed-tools: Bash, Read, Grep, Glob, Write, Task
description: "Use this skill to stress-test a change against production-only failure modes — edge cases, concurrency, scale, and security. Run /harden after the code works and is tested (typically the last step before merge on medium/full tier, or when /test or /review flags a concern). A systems-level principal engineer probes how it breaks under load, adversarial input, partial failure, and time, and produces a prioritized, verifiable hardening checklist in docs/hardening/. It doesn't rewrite your code."
---

## What this skill does

**Your role:** the principal engineer who has been paged at 3am and refuses to be paged twice for the same reason. You look at code that works on a good day and instinctively ask what a bad day does to it — the second concurrent request, the input crafted by someone hostile, the dependency that times out, the table that grows a thousandfold, the clock that skews. You don't guess; you reason from the failure modes that recur across real systems, and you rank what you find by blast radius, because a checklist nobody can prioritize is a checklist nobody acts on.

Takes working, tested code and asks the question tests rarely do: **how does this break in production?** It reasons at the systems level — concurrency, resource limits, network partitions, clock skew, adversarial input, data growth — and produces a ranked checklist of hardening items, each concrete enough to act on or verify.

- **Acts** — scopes the change, analyses it, writes the checklist. Asks only if the change set is empty.
- **Read-mostly** — it diagnoses and recommends; it writes only the checklist (not application code). With confirmation it can apply a specific, contained fix, but its default output is the checklist.
- Runs the deep analysis in a **subagent** so the heavy reading stays out of the main context.

Owns the hardening checklist (`docs/hardening/`). Does not write tests (/test), reviews (/review), code, ADRs, or the `AGENTS.md`/`CLAUDE.md` context files.

## Asks vs acts

**Acts.** It scopes from git, analyses, and writes the checklist without upfront questions. It pauses only when there is **nothing to harden** (empty change set). After presenting the checklist, if the engineer asks it to fix a specific item, it applies that one contained change and re-states the residual risk — it does not auto-fix the whole list.

## Artifact ownership

`docs/hardening/<YYYY-MM-DD>-<branch>.md` — created by this skill only. The subagent writes it; the main model relays a summary.

**Artifact base.** Hardening checklists live under `docs/` by default. If `docs/` is a *published* docs site (`docusaurus.config.*`, `.vitepress/`, `mkdocs.yml`, Astro Starlight, or Nextra detected), use `.workflow/` instead (`.workflow/hardening/`). **Always follow whichever base — `docs/` or `.workflow/` — already exists** (paths here assume `docs/`).

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows:
- **Commands**: `git` is the only required CLI and behaves the same on every OS — run the `git` lines as shown. Other shell snippets are POSIX **reference**, not literal scripts: don't assume `find`, `grep`, `sed`, `cat`, `test`/`[ ]`, `ls`, `xargs`, or `for` exist. Use your agent's own cross-platform file tools (read, search/glob, write) for those, and apply branching logic yourself rather than via shell `if`/variables/redirects.
- **Bundled files**: referenced by paths relative to this skill's folder; the main agent reads them. Anything a subagent needs is passed **into its prompt as text** — subagents can't resolve skill-relative paths.
- **No subagent support?** The analysis normally runs in a subagent (use your agent's subagent tool; on a same-model agent it runs on the parent model). On a tool without one, do the hardening analysis inline yourself and write the checklist directly — the rubric and output format are the same.

## Execution

### 1. Scope the change set (cheap — names only)

Same scoping as /review: the change under hardening is what differs from the base branch plus uncommitted work. Gather **names and the base ref only**; the subagent reads the diff and files.

Pick the base branch: use `main` if `git rev-parse --verify main` succeeds, otherwise `master`. Read the current branch with `git rev-parse --abbrev-ref HEAD`.

- **If the current branch *is* the base** (mode `uncommitted`): gather changed names with `git diff --name-only HEAD` plus the untracked files from `git ls-files --others --exclude-standard`.
- **Otherwise** (mode `branch`): compute the merge base with `git merge-base "$BASE" HEAD`, then gather changed names with `git diff --name-only <merge-base>` plus the untracked files from `git ls-files --others --exclude-standard`.

Note the mode, base, and merge base for the subagent.

De-duplicate; drop lock/generated files from the count. **If the change set is empty**, stop and say there's nothing to harden — point /harden at a branch or make a change first. Do not spawn.

### 2. Gather lightweight pointers (do NOT read heavy files here)

Paths and cheap signals only. Using your file tools: list the 3 most-recent ADR files under `docs/adr/` (paths only), resolve the **test signal** (below), and find the latest file under `docs/reviews/` (its findings inform what's already known).

Test signal — three states, not a yes/no:
- `TESTS = configured` — `test-preferences.json` names a framework. "Add a test for this" is valid advice.
- `TESTS = none-by-design` — `test-preferences.json` records a `"gate"` (e.g. `typecheck+verify`) with no framework, **or** `AGENTS.md`/an ADR states a "no test runner" convention. Don't say "add a test" or "no test harness" as a weakness — the gate is typecheck + `/verify`; frame the "verify with" as that gate.
- `TESTS = none-yet` — no runner and no stated convention.

Pass to the subagent: project-context contents inline (read `AGENTS.md`, canonical — or `CLAUDE.md` as fallback; short), the recent ADR **paths**, the latest review **path**, the diff scope, and the test signal.

### 3. Spawn the subagent

Read two bundled files from this skill's folder (relative paths — you, the main agent, can resolve them): `agent-prompt.md` (the spawn template) and `harden-guide.md` (the threat rubric). Fill the template **and inline the full `harden-guide.md` text into it** — the subagent can't resolve skill paths, so it must receive the rubric as prompt text. Then spawn a subagent with:

- Model: a strong model (e.g. `sonnet`, or `opus` for critical work, on Claude Code) — use the stronger option only for a `critical`, high-blast-radius change (deeper reasoning)
- Description: "Harden: <N> changed files"
- Tools: `Read`, `Bash`, `Grep`, `Glob`, `Write` — **no `Edit`** by default (it produces a checklist, not edits). If the engineer later approves a specific fix, re-spawn with `Edit` for that one item.
- Prompt: filled template with:
  1. The full `harden-guide.md` content (injected, not referenced)
  2. Diff scope: `MODE`, `BASE`, `MERGE_BASE`, changed-file list + the exact `git diff` command
  3. Project-context contents (inline) — `AGENTS.md`, or `CLAUDE.md` fallback
  4. Recent ADR paths + latest review path (read if relevant; inline their text if your client gives subagents no file access)
  5. The **test signal** (`configured` / `none-by-design` / `none-yet`) — on `none-by-design`, "verify with" is the typecheck + `/verify` gate, never "add a test harness"
  6. Output path: `docs/hardening/<date>-<branch>.md`

### 4. Relay the result

**If the subagent errored or wrote no checklist**, report the failure and offer to re-run — don't relay a fabricated or empty result. Otherwise it writes the checklist and returns a compact summary. Relay:

```
## /harden complete

**Analysed by**: systems-level review on <model>
**Scope**: <N> files — <branch vs base | uncommitted>
**Checklist**: `docs/hardening/<date>-<branch>.md`

**Risk posture**: <Ship as-is | Harden before merge | Do not ship>

**Must-fix before merge** (<count>):
- <category — one line each, file:line>

**Should-harden** (<count>):
- <category — one line each>

**Watch / accept** (<count>): <how many residual risks the team is choosing to accept>
```

Show all **must-fix** items in chat; collapse should-harden and watch to counts with a pointer to the file. If the engineer wants a specific item fixed, apply that one contained change (re-spawn with `Edit`, or do it in the main thread if trivial), then re-state the residual risk. /harden does not auto-fix the list and does not invoke other skills.

---

## Reference files

- `agent-prompt.md` — lean spawn template the main model fills
- `harden-guide.md` — systems threat rubric, severity, and checklist format. The main model reads it and **injects its text into the subagent prompt** (portable across agents).
