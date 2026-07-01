---
name: sync
compatibility: Built for Claude Code — uses subagents, model selection, and interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Task
description: "Use this skill after a change is complete to keep durable knowledge current. Run /sync as the last step on medium/full work, around merge. It updates the AGENTS.md context files (root + nested) to reflect what changed, reconciles the feature roadmap's status from repo evidence, and flags any ADR the change made stale. Conservative: surgical, additive edits that never overwrite curated content; it doesn't restructure root (/audit) or edit ADRs (/architect)."
---

## What this skill does

Closes the loop on a change by syncing the durable knowledge to reality:

1. **Maintains existing AGENTS.md** — root and nested — so commands, conventions, and constraints stay accurate after the change. Surgical, additive edits only; it never rewrites curated prose.
2. **Creates a nested AGENTS.md for a brand-new area** introduced by the change — because the diff *is* the whole area, so it has enough context to write an accurate one. It adds the one root pointer line too.
3. **Reconciles each linked ADR's Status line** — the ADR's status mirrors its feature's build lifecycle, so sync brings the ADR `**Status**:` line in line with the shipped feature's roadmap status as a safety net: `planned`→`Proposed`, `in-progress`→`In Progress`, `done`→`Accepted` (an ADR is not `Accepted` until its feature ships and is verified). For an umbrella decision it reconciles the linked `index.md` (child ADRs carry no status and aren't reconciled). It edits **only** the `**Status**:` line — never ADR content — and re-reads the file just before writing. **Only ADRs linked to a roadmap feature are reconciled or flagged this way.** A **standalone decision ADR** (a foundational/stack or cross-cutting standard that no buildable roadmap feature links to) is decision-status — `Proposed` when written, `Accepted` once ratified — **not** feature-mirrored: sync leaves it alone and must **not** flag it as an unresolvable mismatch or drift just because no feature links it. If a *feature-linked* ADR's mismatch can't be safely resolved, it **flags** rather than guessing.
4. **Flags stale ADRs** — decisions the change may have contradicted or outgrown, or that a later ADR supersedes — and recommends running /architect to update or supersede them. It does not edit ADR content.

Runs on a fast, low-cost model (e.g. `haiku` on Claude Code; `inherit`/a light model on other agents) in a subagent. Acts — no upfront questions.

**Canonical file:** durable context lives in the tool-agnostic **`AGENTS.md`** (read by every agent); **`CLAUDE.md` is only a pointer** that imports its sibling AGENTS.md via Claude Code's `@AGENTS.md` directive (Claude auto-loads it; other tools read AGENTS.md directly). /sync edits `AGENTS.md` for content and never writes content into `CLAUDE.md`. When it creates a nested `AGENTS.md`, it also creates the sibling `CLAUDE.md` pointer (body: a line of context plus `@AGENTS.md`). It treats `CLAUDE.md` pointers and `AGENTS.md` files only as targets, never as a change source.

## Boundaries (these keep the skill from sprawling)

| Action | /sync | Owner |
|---|---|---|
| Edit existing root/nested AGENTS.md | ✅ maintains | /sync |
| Create nested `<area>/AGENTS.md` for an area **net-new in this change** | ✅ creates (diff = full area context) + adds root pointer | /sync |
| Create nested doc for a **pre-existing** undocumented area (only sliced by the diff) | ❌ flags "run /audit" | /audit |
| Create or restructure the **root** AGENTS.md | ❌ flags "run /audit" | /audit |
| Reconcile an ADR's `**Status**:` line to its feature's roadmap status (`planned`→`Proposed`, `in-progress`→`In Progress`, `done`→`Accepted`) | ✅ Status line only | /sync |
| Edit an ADR's **content** / supersede it | ❌ flags as stale | /architect |
| Reconcile the roadmap — for the **relevant workspace's** roadmap file only (not all of `docs/mvp/`) — tick **any** completed sub-task from repo **evidence** (code, tests, hardening entry, AGENTS.md), advance status | ✅ corrects | /sync |
| Add / reorder features or sub-tasks in the roadmap | ❌ leaves alone | /mvp |
| Overwrite or rewrite curated AGENTS.md prose | ❌ flags conflict instead | human |

The dividing line on creation is **context, not policy**: create only when this change shows you the whole area; defer to /audit when the area predates the change and you've seen only a slice. When unsure, **flag instead of creating**.

## Asks vs acts

**Acts.** It scopes the change from git, applies conservative AGENTS.md updates, reconciles each linked ADR's Status line, flags stale ADRs, and reports. It pauses only when there is **nothing to sync** (empty change set). Because it edits curated files, every edit it makes is listed in the report so you can review or revert.

## Artifact ownership

Maintains root `AGENTS.md` and existing nested `<area>/AGENTS.md`; **creates** nested `<area>/AGENTS.md` only for an area net-new in this change. Never creates or restructures root (that's /audit). Also **reconciles the roadmap** — scoped to the **relevant workspace's** roadmap file for the shipped change, not every file under `docs/mvp/` — it's the **universal sub-task reconciler**: it ticks *any* completed sub-task it can verify from repo **evidence**, not only the diff's source changes. `/develop` ticks its own sub-tasks as it builds; `/sync` sweeps the rest — the `/test`, `/harden`, `/audit`/tooling, and `/sync` sub-tasks that those skills don't tick themselves — and advances feature status. It never adds, removes, or reorders features/sub-tasks (that's /mvp). It also **reconciles each linked ADR's `**Status**:` line** to that feature's roadmap status (`planned`→`Proposed`, `in-progress`→`In Progress`, `done`→`Accepted`) — the Status line only, never ADR content; if a feature-linked ADR's mismatch can't be safely resolved it flags it. A **standalone decision ADR** (no linked buildable feature) is decision-status and is left alone — never reconciled or flagged as drift for lacking a feature link. Writes nothing else.

**Artifact base.** The ADRs and roadmap it reads/reconciles live under `docs/` by default, or `.workflow/` if `docs/` is a published docs site. **Use whichever base — `docs/` or `.workflow/` — exists in the repo** (paths here assume `docs/`).

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows:
- **Commands**: `git` is the only required CLI and behaves the same on every OS — run the `git` lines as shown. Other shell snippets are POSIX **reference**, not literal scripts: don't assume `find`, `grep`, `sed`, `cat`, `test`/`[ ]`, `ls`, or `xargs` exist. Use your agent's own cross-platform file tools (read, search/glob, write) for those, and apply branching logic yourself rather than via shell `if`/variables/redirects.
- **Bundled files**: referenced by paths relative to this skill's folder; the main agent reads them. Anything a subagent needs is passed **into its prompt as text** — subagents can't resolve skill-relative paths.
- **No subagent support?** The maintenance normally runs in a subagent on a fast, low-cost model. On a tool without one, do the AGENTS.md updates and ADR-staleness checks inline yourself — same conservative rules.

## Execution

### 1. Scope the change set (cheap — with per-file status)

**Freshness first (teams):** `git fetch --quiet`; if you're behind `origin/$BASE` (`git rev-list --count HEAD..origin/$BASE` > 0), warn the engineer to pull before syncing — a teammate may have already synced these docs, and reconciling against a stale tree creates conflicting edits.

Use `--name-status` (not `--name-only`) so the subagent can tell **A**dded from **M**odified from **D**eleted — the net-new-area and orphan-cleanup logic both depend on it.

Pick the base branch: use `main` if `git rev-parse --verify main` succeeds, otherwise `master`. Read the current branch with `git rev-parse --abbrev-ref HEAD`.

- **If the current branch *is* the base** (mode `uncommitted`): get the changed files with `git diff --name-status HEAD`, then list untracked files with `git ls-files --others --exclude-standard` and treat each as **A**dded (prefix them with an `A` status, matching the `--name-status` format).
- **Otherwise** (mode `branch`): compute the merge base with `git merge-base "$BASE" HEAD`, get the changed files with `git diff --name-status <merge-base>`, then list untracked files with `git ls-files --others --exclude-standard` and treat each as **A**dded, as above.

Note the mode, base, and merge base for the subagent.

De-duplicate. Then **filter the list to source files** the subagent should sync *from*:
- **Drop documentation and config**: `AGENTS.md` (any level), `docs/**` (ADRs, reviews, etc.), `*.md`, `test-preferences.json`, lock files, generated output. /sync reads these as *targets/context*, never as the source of a change to record — syncing a doc from a doc is noise.
- **Drop test files** (`*.test.*`, `*.spec.*`, `__tests__/`, etc.) — tests aren't durable area conventions.
- **Keep the `D` (deleted) entries** in a separate list — they drive orphan cleanup (Step 3), even though they aren't synced *from*.

**If no source files remain** (only docs/tests/config changed), stop — nothing to sync. Do not spawn.

### 2. Locate the context files and ADRs (paths only — do NOT read them here)

Using your agent's file-search/glob tools:
- Note whether a root `AGENTS.md` exists.
- Find every `AGENTS.md` (root + nested), excluding `node_modules/` and `.git/`.
- Find all ADRs under `docs/adr/` whose names start with a digit, sorted.
- Find the feature roadmap file for the shipped change — **scope to the relevant workspace's roadmap**, not every file under `docs/mvp/`. In a monorepo, a changed file's workspace (`apps/<x>/…`) selects `docs/mvp/<x>/`; pass only the roadmap file(s) whose workspace/features the diff actually touches. Don't read or pass all of `docs/mvp/`.

The subagent reads these itself. The main model passes the **paths** (plus the changed-file list and diff command). The one inline exception is root AGENTS.md contents — short and useful for the subagent to anchor on.

For each changed file, note its nearest enclosing directory that has a `AGENTS.md` (root or nested) — that's the context file most likely to need an update.

### 3. Spawn the subagent

Read `agent-prompt.md`, fill it, then spawn a subagent with:

- Model: a fast, low-cost model (cheap — this is bounded maintenance, not open-ended reasoning)
- Description: "Sync: update AGENTS.md + flag stale ADRs"
- Tools: `Read`, `Bash`, `Grep`, `Glob`, `Edit`, `Write` — `Edit` for maintaining existing docs, reconciling the roadmap, and reconciling ADR `**Status**:` lines; `Write` strictly for a **net-new-area** nested AGENTS.md. The "no root creation / no ADR *content* edits (Status line only) / no shallow nested docs for established areas" boundaries are rule-based (in the agent prompt), since the tool grant alone can't express them.
- Prompt: filled template with:
  1. Diff scope: `MODE`, `BASE`, `MERGE_BASE`, the **name-status** changed-source list + exact `git diff` command
  2. The separate **deleted-paths** list (for orphan cleanup)
  3. Root AGENTS.md contents (inline) + the list of nested AGENTS.md paths
  4. The full ADR path list (for both Status-line reconciliation and staleness flagging)
  5. The map of changed files → nearest context file
  6. The roadmap file path(s) for the **relevant workspace(s)** the diff touches — not all of `docs/mvp/` — for reconciliation and as the source of each linked feature's status for ADR Status-line reconciliation

### 4. Relay the result

**If the subagent errored or returned no parseable summary**, report that and offer to re-run — don't fabricate a result (a genuine `NOTHING_TO_SYNC` is a valid success; a crash or empty output is not). Otherwise relay the compact summary:

```
## /sync complete

**Scope**: <N> changed files

**AGENTS.md updated**:
- `<path>` — <what was added/corrected, one line>   (or "no updates needed")

**AGENTS.md created** (new area):
- `<area>/AGENTS.md` — <what conventions it captures> (+ root pointer added)

**Orphans cleaned** (after deletions):
- `<path>` — <removed orphaned nested doc / fixed broken pointer>

**Roadmap reconciled** (relevant workspace):
- `<feature>` — <ticked sub-tasks / status planned→in-progress→done to match the diff>   (or "no roadmap, or already accurate")

**ADR statuses reconciled** (Status line only):
- `docs/adr/<file>` — <Status Proposed→In Progress→Accepted to match the feature's roadmap status>

**ADRs flagged stale** (run /architect to update or supersede):
- `docs/adr/<file>` — <why the change makes it stale, or status mismatch sync couldn't safely resolve>

**Context gaps** (run /audit — area too established for /sync to document from the diff alone):
- `<area>` — <pre-existing undocumented area only sliced by this change>

**Conflicts left for you** (not auto-edited):
- `<path>` — <curated content that would need rewriting; decide manually>
```

Omit any section with no items. If everything was already current and nothing is stale, say so in one line. /sync does not run /architect or /audit for you — it points; you decide.

---

## Subagent prompt template

See `agent-prompt.md`.
