---
name: sync
compatibility: Built for Claude Code — uses subagents, model selection, and interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
description: Use this skill after a change is complete to keep the project's durable knowledge current — update existing root and nested CLAUDE.md files to reflect what changed, and flag any ADR the change may have made stale. Run /sync as the last step on medium or full tier work, before or just after merge. It maintains context files that already exist; it never creates new CLAUDE.md files (that is /understand's job) and never edits ADRs (that is /design's job) — it only flags stale ones. Conservative by default: surgical, additive edits that preserve curated content.
---

## What this skill does

Closes the loop on a change by syncing the durable knowledge to reality:

1. **Maintains existing CLAUDE.md** — root and nested — so commands, conventions, and constraints stay accurate after the change. Surgical, additive edits only; it never rewrites curated prose.
2. **Creates a nested CLAUDE.md for a brand-new area** introduced by the change — because the diff *is* the whole area, so it has enough context to write an accurate one. It adds the one root pointer line too.
3. **Flags stale ADRs** — decisions the change may have contradicted or outgrown — and recommends running /design to update or supersede them. It does not edit ADRs.

Runs on a cheap model (haiku) in a subagent. Acts — no upfront questions.

## Boundaries (these keep the skill from sprawling)

| Action | /sync | Owner |
|---|---|---|
| Edit existing root/nested CLAUDE.md | ✅ maintains | /sync |
| Create nested `<area>/CLAUDE.md` for an area **net-new in this change** | ✅ creates (diff = full area context) + adds root pointer | /sync |
| Create nested doc for a **pre-existing** undocumented area (only sliced by the diff) | ❌ flags "run /understand" | /understand |
| Create or restructure the **root** CLAUDE.md | ❌ flags "run /understand" | /understand |
| Edit / supersede an ADR | ❌ flags as stale | /design |
| Overwrite or rewrite curated CLAUDE.md prose | ❌ flags conflict instead | human |

The dividing line on creation is **context, not policy**: create only when this change shows you the whole area; defer to /understand when the area predates the change and you've seen only a slice. When unsure, **flag instead of creating**.

## Asks vs acts

**Acts.** It scopes the change from git, applies conservative CLAUDE.md updates, flags stale ADRs, and reports. It pauses only when there is **nothing to sync** (empty change set). Because it edits curated files, every edit it makes is listed in the report so you can review or revert.

## Artifact ownership

Maintains root `CLAUDE.md` and existing nested `<area>/CLAUDE.md`; **creates** nested `<area>/CLAUDE.md` only for an area net-new in this change. Never creates or restructures root (that's /understand). Writes nothing else.

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows:
- **Commands**: `git` is the only required CLI and behaves the same on every OS — run the `git` lines as shown. Other shell snippets are POSIX **reference**, not literal scripts: don't assume `find`, `grep`, `sed`, `cat`, `test`/`[ ]`, `ls`, or `xargs` exist. Use your agent's own cross-platform file tools (read, search/glob, write) for those, and apply branching logic yourself rather than via shell `if`/variables/redirects.
- **Bundled files**: referenced by paths relative to this skill's folder; the main agent reads them. Anything a subagent needs is passed **into its prompt as text** — subagents can't resolve skill-relative paths.

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
- **Drop documentation and config**: `CLAUDE.md` (any level), `docs/**` (ADRs, reviews, etc.), `*.md`, `test-preferences.json`, lock files, generated output. /sync reads these as *targets/context*, never as the source of a change to record — syncing a doc from a doc is noise.
- **Drop test files** (`*.test.*`, `*.spec.*`, `__tests__/`, etc.) — tests aren't durable area conventions.
- **Keep the `D` (deleted) entries** in a separate list — they drive orphan cleanup (Step 3), even though they aren't synced *from*.

**If no source files remain** (only docs/tests/config changed), stop — nothing to sync. Do not spawn.

### 2. Locate the context files and ADRs (paths only — do NOT read them here)

```bash
[ -f CLAUDE.md ] && echo "root: CLAUDE.md"
find . -name CLAUDE.md -not -path './node_modules/*' -not -path './.git/*' 2>/dev/null   # root + nested
find docs/adr -name "[0-9]*.md" 2>/dev/null | sort                                        # all ADRs
```

The subagent reads these itself. The main model passes the **paths** (plus the changed-file list and diff command). The one inline exception is root CLAUDE.md contents — short and useful for the subagent to anchor on.

For each changed file, note its nearest enclosing directory that has a `CLAUDE.md` (root or nested) — that's the context file most likely to need an update.

### 3. Spawn the sync subagent

Read `agent-prompt.md`, fill it, then spawn:

- `model: "haiku"`  (cheap — this is bounded maintenance, not open-ended reasoning)
- `description: "Sync: update CLAUDE.md + flag stale ADRs"`
- Tools: `Read`, `Bash`, `Grep`, `Glob`, `Edit`, `Write` — `Edit` for maintaining existing docs; `Write` strictly for a **net-new-area** nested CLAUDE.md. The "no root creation / no ADR edits / no shallow nested docs for established areas" boundaries are rule-based (in the agent prompt), since the tool grant alone can't express them.
- `prompt`: filled template with:
  1. Diff scope: `MODE`, `BASE`, `MERGE_BASE`, the **name-status** changed-source list + exact `git diff` command
  2. The separate **deleted-paths** list (for orphan cleanup)
  3. Root CLAUDE.md contents (inline) + the list of nested CLAUDE.md paths
  4. The full ADR path list
  5. The map of changed files → nearest context file

### 4. Relay the result

The subagent returns a compact summary. Relay:

```
## /sync complete

**Scope**: <N> changed files

**CLAUDE.md updated**:
- `<path>` — <what was added/corrected, one line>   (or "no updates needed")

**CLAUDE.md created** (new area):
- `<area>/CLAUDE.md` — <what conventions it captures> (+ root pointer added)

**Orphans cleaned** (after deletions):
- `<path>` — <removed orphaned nested doc / fixed broken pointer>

**ADRs flagged stale** (run /design to update or supersede):
- `docs/adr/<file>` — <why the change makes it stale>

**Context gaps** (run /understand — area too established for /sync to document from the diff alone):
- `<area>` — <pre-existing undocumented area only sliced by this change>

**Conflicts left for you** (not auto-edited):
- `<path>` — <curated content that would need rewriting; decide manually>
```

Omit any section with no items. If everything was already current and nothing is stale, say so in one line. /sync does not run /design or /understand for you — it points; you decide.

---

## Subagent prompt template

See `agent-prompt.md`.
