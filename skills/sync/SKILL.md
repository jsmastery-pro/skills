---
name: sync
compatibility: Built for Claude Code — uses subagents, model selection, and interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
description: "Use this skill after a change is complete to keep the project's durable knowledge current — update the tool-agnostic AGENTS.md context files (root and nested) to reflect what changed, and flag any ADR the change may have made stale. Run /sync as the last step on medium or full tier work, before or just after merge. It maintains existing AGENTS.md files, and creates a nested AGENTS.md (plus a CLAUDE.md pointer) only for an area net-new in this change; it never overwrites an existing AGENTS.md, never restructures the root (that is /audit's job), and never edits ADRs (that is /architect's job) — it only flags stale ones. Conservative by default: surgical, additive edits that preserve curated content."
---

## What this skill does

Closes the loop on a change by syncing the durable knowledge to reality:

1. **Maintains existing AGENTS.md** — root and nested — so commands, conventions, and constraints stay accurate after the change. Surgical, additive edits only; it never rewrites curated prose.
2. **Creates a nested AGENTS.md for a brand-new area** introduced by the change — because the diff *is* the whole area, so it has enough context to write an accurate one. It adds the one root pointer line too.
3. **Flags stale ADRs** — decisions the change may have contradicted or outgrown — and recommends running /architect to update or supersede them. It does not edit ADRs.

Runs on a cheap model (haiku) in a subagent. Acts — no upfront questions.

**Canonical file:** durable context lives in the tool-agnostic **`AGENTS.md`** (read by every agent); **`CLAUDE.md` is only a pointer** that imports its sibling AGENTS.md via Claude Code's `@AGENTS.md` directive (Claude auto-loads it; other tools read AGENTS.md directly). /sync edits `AGENTS.md` for content and never writes content into `CLAUDE.md`. When it creates a nested `AGENTS.md`, it also creates the sibling `CLAUDE.md` pointer (body: a line of context plus `@AGENTS.md`). It treats `CLAUDE.md` pointers and `AGENTS.md` files only as targets, never as a change source.

## Boundaries (these keep the skill from sprawling)

| Action | /sync | Owner |
|---|---|---|
| Edit existing root/nested AGENTS.md | ✅ maintains | /sync |
| Create nested `<area>/AGENTS.md` for an area **net-new in this change** | ✅ creates (diff = full area context) + adds root pointer | /sync |
| Create nested doc for a **pre-existing** undocumented area (only sliced by the diff) | ❌ flags "run /audit" | /audit |
| Create or restructure the **root** AGENTS.md | ❌ flags "run /audit" | /audit |
| Edit / supersede an ADR | ❌ flags as stale | /architect |
| Reconcile `docs/features/index.md` status/checkboxes ↔ what the diff shipped | ✅ corrects | /sync |
| Add / reorder features or sub-tasks in the roadmap | ❌ leaves alone | /mvp |
| Overwrite or rewrite curated AGENTS.md prose | ❌ flags conflict instead | human |

The dividing line on creation is **context, not policy**: create only when this change shows you the whole area; defer to /audit when the area predates the change and you've seen only a slice. When unsure, **flag instead of creating**.

## Asks vs acts

**Acts.** It scopes the change from git, applies conservative AGENTS.md updates, flags stale ADRs, and reports. It pauses only when there is **nothing to sync** (empty change set). Because it edits curated files, every edit it makes is listed in the report so you can review or revert.

## Artifact ownership

Maintains root `AGENTS.md` and existing nested `<area>/AGENTS.md`; **creates** nested `<area>/AGENTS.md` only for an area net-new in this change. Never creates or restructures root (that's /audit). Also **reconciles `docs/features/index.md`** — ticking sub-task checkboxes and advancing feature status to match what the diff actually shipped — but never adds, removes, or reorders features/sub-tasks (that's /mvp). Writes nothing else.

**Artifact base.** The ADRs and roadmap it reads/reconciles live under `docs/` by default, or `.workflow/` if `docs/` is a published docs site. **Use whichever base — `docs/` or `.workflow/` — exists in the repo** (paths here assume `docs/`).

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows:
- **Commands**: `git` is the only required CLI and behaves the same on every OS — run the `git` lines as shown. Other shell snippets are POSIX **reference**, not literal scripts: don't assume `find`, `grep`, `sed`, `cat`, `test`/`[ ]`, `ls`, or `xargs` exist. Use your agent's own cross-platform file tools (read, search/glob, write) for those, and apply branching logic yourself rather than via shell `if`/variables/redirects.
- **Bundled files**: referenced by paths relative to this skill's folder; the main agent reads them. Anything a subagent needs is passed **into its prompt as text** — subagents can't resolve skill-relative paths.
- **No subagent support?** The maintenance normally runs in a cheap-model subagent. On a tool without one, do the AGENTS.md updates and ADR-staleness checks inline yourself — same conservative rules.

## Execution

### 1. Scope the change set (cheap — with per-file status)

Use `--name-status` (not `--name-only`) so the subagent can tell **A**dded from **M**odified from **D**eleted — the net-new-area and orphan-cleanup logic both depend on it.

```bash
git rev-parse --verify main >/dev/null 2>&1 && BASE=main || BASE=master
CUR=$(git rev-parse --abbrev-ref HEAD)
if [ "$CUR" = "$BASE" ]; then
  echo "MODE=uncommitted BASE=$BASE"
  git diff --name-status HEAD 2>/dev/null
  git ls-files --others --exclude-standard 2>/dev/null | sed 's/^/A\t/'   # untracked = added
else
  MB=$(git merge-base "$BASE" HEAD)
  echo "MODE=branch BASE=$BASE MERGE_BASE=$MB"
  git diff --name-status "$MB" 2>/dev/null
  git ls-files --others --exclude-standard 2>/dev/null | sed 's/^/A\t/'
fi
```

De-duplicate. Then **filter the list to source files** the subagent should sync *from*:
- **Drop documentation and config**: `AGENTS.md` (any level), `docs/**` (ADRs, reviews, etc.), `*.md`, `test-preferences.json`, lock files, generated output. /sync reads these as *targets/context*, never as the source of a change to record — syncing a doc from a doc is noise.
- **Drop test files** (`*.test.*`, `*.spec.*`, `__tests__/`, etc.) — tests aren't durable area conventions.
- **Keep the `D` (deleted) entries** in a separate list — they drive orphan cleanup (Step 3), even though they aren't synced *from*.

**If no source files remain** (only docs/tests/config changed), stop — nothing to sync. Do not spawn.

### 2. Locate the context files and ADRs (paths only — do NOT read them here)

```bash
[ -f AGENTS.md ] && echo "root: AGENTS.md"
find . -name AGENTS.md -not -path './node_modules/*' -not -path './.git/*' 2>/dev/null   # root + nested
find docs/adr -name "[0-9]*.md" 2>/dev/null | sort                                        # all ADRs
[ -f docs/features/index.md ] && echo "roadmap: docs/features/index.md"                   # feature roadmap (if any)
```

The subagent reads these itself. The main model passes the **paths** (plus the changed-file list and diff command). The one inline exception is root AGENTS.md contents — short and useful for the subagent to anchor on.

For each changed file, note its nearest enclosing directory that has a `AGENTS.md` (root or nested) — that's the context file most likely to need an update.

### 3. Spawn the sync subagent

Read `agent-prompt.md`, fill it, then spawn:

- `model: "haiku"`  (cheap — this is bounded maintenance, not open-ended reasoning)
- `description: "Sync: update AGENTS.md + flag stale ADRs"`
- Tools: `Read`, `Bash`, `Grep`, `Glob`, `Edit`, `Write` — `Edit` for maintaining existing docs; `Write` strictly for a **net-new-area** nested AGENTS.md. The "no root creation / no ADR edits / no shallow nested docs for established areas" boundaries are rule-based (in the agent prompt), since the tool grant alone can't express them.
- `prompt`: filled template with:
  1. Diff scope: `MODE`, `BASE`, `MERGE_BASE`, the **name-status** changed-source list + exact `git diff` command
  2. The separate **deleted-paths** list (for orphan cleanup)
  3. Root AGENTS.md contents (inline) + the list of nested AGENTS.md paths
  4. The full ADR path list
  5. The map of changed files → nearest context file
  6. The `docs/features/index.md` path (if it exists) — for roadmap reconciliation

### 4. Relay the result

The subagent returns a compact summary. Relay:

```
## /sync complete

**Scope**: <N> changed files

**AGENTS.md updated**:
- `<path>` — <what was added/corrected, one line>   (or "no updates needed")

**AGENTS.md created** (new area):
- `<area>/AGENTS.md` — <what conventions it captures> (+ root pointer added)

**Orphans cleaned** (after deletions):
- `<path>` — <removed orphaned nested doc / fixed broken pointer>

**Roadmap reconciled** (`docs/features/index.md`):
- `<feature>` — <ticked sub-tasks / status planned→in-progress→done to match the diff>   (or "no roadmap, or already accurate")

**ADRs flagged stale** (run /architect to update or supersede):
- `docs/adr/<file>` — <why the change makes it stale>

**Context gaps** (run /audit — area too established for /sync to document from the diff alone):
- `<area>` — <pre-existing undocumented area only sliced by this change>

**Conflicts left for you** (not auto-edited):
- `<path>` — <curated content that would need rewriting; decide manually>
```

Omit any section with no items. If everything was already current and nothing is stale, say so in one line. /sync does not run /architect or /audit for you — it points; you decide.

---

## Subagent prompt template

See `agent-prompt.md`.
