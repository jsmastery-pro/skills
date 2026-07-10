---
name: sync
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent
description: "Run /sync as the last step after a change is complete, around merge, to keep durable knowledge current. Updates root and nested AGENTS.md, reconciles the scope from repo evidence, and flags specs the change made stale. Surgical edits only: it adds lines, and rewrites single lines it owns. Never a whole section, never curated prose."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

Closes the loop on a completed change: syncs AGENTS.md files, the scope, and linked spec `**Status**:` lines to what the repo now shows, and flags what it must not edit (stale specs, curated prose). The Boundaries table below is the exact contract.

**`agent-prompt.md`** is the single source of truth for the maintenance rules; SKILL.md covers only orchestration. The main thread reads it and does the maintenance itself (see Step 3).

**Canonical file:** durable context lives in the tool agnostic **`AGENTS.md`**; **`CLAUDE.md` is only a pointer** to it. /sync edits/creates both, treating them only as targets, never as a change source.

## Boundaries (these keep the skill from sprawling)

| Action | /sync | Owner |
|---|---|---|
| Edit existing root/nested AGENTS.md | ✅ maintains | /sync |
| Reconcile root AGENTS.md's `## Build approach` line to the scope header's approach (surgical single line edit, like the stack) | ✅ maintains; flags a curated divergence | /sync |
| Add a one line pointer to `design.md` (the UI design system) in the nearest AGENTS.md when a change establishes one | ✅ maintains (pointer only) | /sync |
| Create nested `<area>/AGENTS.md` for an area **net new in this change** | ✅ creates (diff = full area context) + adds root pointer | /sync |
| Create nested doc for an **already existing** undocumented area (only sliced by the diff) | ❌ flags "run /audit" | /audit |
| Create or restructure the **root** AGENTS.md | ❌ flags "run /audit" | /audit |
| Reconcile a spec's `**Status**:` line to its feature's scope status (`planned`→`Proposed`, `in-progress`→`In Progress`, `done`→`Accepted`) | ✅ Status line only | /sync |
| Edit a spec's **content** / supersede it | ❌ flags as stale | /architect |
| Reconcile the scope, for the **relevant workspace's** scope file only (not all of `docs/scope/`), tick **any** completed sub task from repo **evidence** (code, tests, AGENTS.md), advance status | ✅ corrects | /sync |
| Add / reorder features or sub tasks in the scope | ❌ leaves alone | /scope |
| Overwrite or rewrite curated AGENTS.md prose | ❌ flags conflict instead | human |

The dividing line on creation is **context, not policy**: create only when this change shows you the whole area; defer to /audit when the area predates the change and you've seen only a slice. When unsure, **flag instead of creating**.

## Asks vs acts

**Acts.** Pauses only when there is **nothing to sync** (empty change set). Every edit to curated files is listed in the report so you can review or revert.

## Artifact ownership

Owns exactly what the Boundaries table grants and writes nothing else. As the **universal sub task reconciler** it ticks any scope sub task it can verify from repo evidence (sweeping the `/test`/`/audit`/`/sync` sub tasks other skills don't tick) and advances feature status; exact rules in `agent-prompt.md`.

**Artifact base.** specs and the scope live under `docs/` by default, or `.workflow/` if `docs/` is a published docs site; use whichever base exists in the repo (paths here assume `docs/`).

---

## Portability (any OS, any agent)

- **Commands**: `git` is the only required CLI and behaves the same on every OS, run the `git` lines as shown. Other shell snippets are POSIX **reference**, not literal scripts: don't assume `find`, `grep`, `sed`, `cat`, `test`/`[ ]`, `ls`, or `xargs` exist; use your agent's cross platform file tools and apply branching logic yourself rather than shell `if`/variables/redirects.
- **Bundled files**: referenced by paths relative to this skill's folder. Resolve the folder to an absolute path (you already resolve these relative paths) and read `agent-prompt.md` yourself at write time (Step 3), not during the earlier steps.
- The whole maintenance runs inline on the main thread, following the exact rules in **`agent-prompt.md`** (authoritative).

## Execution

### 1. Scope the change set (cheap, with per file status)

**Freshness first (teams):** `git fetch --quiet`; if `git rev-list --count HEAD..origin/$BASE` > 0 you are behind `origin/$BASE`, warn the engineer to pull first, a teammate may have already synced these docs.

Base: `main` if `git rev-parse --verify main` succeeds, else `master`. Current branch: `git rev-parse --abbrev-ref HEAD`. Use `--name-status` (not `--name-only`); the net new area and orphan cleanup logic need **A**dded vs **M**odified vs **D**eleted per file.

- Current branch **is** the base, mode `uncommitted`: `git diff --name-status HEAD`.
- Otherwise, mode `branch`: `git merge-base "$BASE" HEAD`, then `git diff --name-status <merge-base>`.

Either way, add untracked files from `git ls-files --others --exclude-standard`, each prefixed with an `A` status (matching the `--name-status` format). Note the mode, base, and merge base for the write step.

Remove duplicates, then **filter to source files** to sync *from*:
- **Drop documentation and config** (`AGENTS.md` at any level, `docs/**`, `*.md`, `test-preferences.json`, lock files, generated output); /sync reads these as targets/context, never as a change source.
- **Drop test files** (`*.test.*`, `*.spec.*`, `__tests__/`, etc.); tests aren't durable area conventions.
- **Keep the `D` (deleted) entries** in a separate list; they drive orphan cleanup (Step 3) though they aren't synced *from*.
- **Keep dependency manifest changes in a separate list** for tool discovery, even if they are config rather than source: `package.json`, `pyproject.toml`, `requirements*.txt`, `go.mod`, `Cargo.toml`, `composer.json`, `Gemfile`, `pubspec.yaml`, `mix.exs`, `*.csproj`, and equivalent package manifests. Lock files are signals only; do not pass lockfile contents.

**If no source files and no dependency manifest changes remain** (only docs/tests/lock/generated files changed), stop, nothing to sync. Do not spawn.

### 2. Locate the context files and specs (paths only, do NOT read them here)

Using your agent's file search/glob tools:
- Note whether a root `AGENTS.md` exists.
- Find every `AGENTS.md` (root + nested), excluding `node_modules/` and `.git/`.
- Find all specs under `docs/specs/` whose names start with a digit, sorted.
- Find the scope file(s) whose workspace/features the diff actually touches (in a monorepo, a changed file's workspace `apps/<x>/…` selects `docs/scope/<x>/`); never read or pass all of `docs/scope/`.

Note the **paths** plus the changed file list and diff command; read the files at write time. Read root AGENTS.md contents now (short and useful to anchor on). For each changed file, note its nearest enclosing directory with a `AGENTS.md` (root or nested); that's the context file most likely to need an update.

### 2.5 Discover Agent Skills and optional MCPs for newly added tools

Run only when dependency manifests changed or the diff clearly adds a significant external tool. Skip ordinary utility libraries unless they define a durable workflow or integration.

- Identify newly added significant packages/tools from the manifest diff, not the full lockfile: framework, router, styling/UI kit, database, ORM/query layer, auth/session, payments, email/notifications, storage/uploads, search, queue/background jobs, AI provider/vector DB, browser/runtime testing, observability, hosting/deploy. Include package names and common aliases from manifests. Do not stop after the first technology.
- Filter out anything already covered by installed skills, connected MCPs, or `AGENTS.md` declined entries.
- **Ask before you search.**

  <!-- TOOL-CONSENT:START (identical in /architect, /audit and /sync; edit all or none) -->
  **Asking is mandatory. Searching is not.** Nothing is searched, fetched, installed, or spawned for Agent Skill and MCP discovery until the engineer has picked. Offer four choices: find them for me, I will name the ones I want, no and record the decline, or not now. Only the first may run a search command. Never silently skip the offer, and never run a search before the engineer agrees to one.
  <!-- TOOL-CONSENT:END -->

  Name the tools this change added, say in one line that an Agent Skill gives the agent that tool's real conventions and an MCP server gives it live access to the real system, then ask: "Want me to find Agent Skills and MCP servers for the tools this change added?" (header `Agent skills`), with `Yes, find them for me` (recommended) · `I'll name the ones I want` · `No, skip it` · `Not now, later`. On `Yes` continue below. On `I'll name the ones I want`, take the list and go straight to the install step, searching for nothing. On `No, skip it` run nothing and record the decline. On `Not now, later` run nothing and note the candidate tools in the report.
- **Isolate the searches in a read only subagent (capability first, only after `Yes`).** Hand the remaining set to a discovery subagent rather than searching on the main thread: spawn it in the background (it does not block) if your agent supports that, else blocking; set its model explicitly to a fast, low cost tier (do not inherit the session model; on Claude Code spawn it as the `researcher` subagent type, which pins the model); it returns only the compact candidate list. This keeps the search output out of `/sync`'s bounded context. No subagent → search inline; no search capability → skip and note it. The offer panel stays on the main thread.
- For each remaining item, run `npx skills find <tool-or-package>`; if weak, retry aliases from package/org names. Collect every credible Agent Skill candidate and confirm with `npx skills add <owner>/<repo> --list` when practical. If the CLI is interactive/unavailable, search `"<tool>" "agent skill"` and confirm before offering.
- MCP search is optional: connector list first, else `"<tool>" "MCP server"` per item. MCP is recommended upside, not required.
- Keep discovery capped and cacheable: max 5 web searches and 8 fetched pages total, official registry/docs first. Reuse `docs/.agent-cache/tool-discovery/<slug>.md` when under 30 days old, after filtering installed/declined items.
- Offer all Agent Skill matches in one multi select panel, grouped by technology: "Install relevant Agent Skills for newly added tools?" plus skip/decline. Then offer MCPs separately: "Optional MCP servers that could help these tools" plus skip/decline. Never install or connect automatically.
- Install selected skills with `npx skills add <owner>/<repo> -y`. For MCPs, point to the user's connector/MCP settings; once connected the tools are used automatically.
- Carry the result as `INSTALLED_SKILLS_OR_NONE`, `MCP_SERVERS_OR_NONE`, and `DECLINED_TOOLS_OR_NONE` and record durable lines in the right `AGENTS.md` file when you write. If nothing was found or no capability exists, treat as `none`.

### 3. Do the maintenance (main thread)

The main thread does the maintenance itself; it never hands the `AGENTS.md` / scope / spec status edits to a subagent. Read `agent-prompt.md` now (only now, at write time) and follow it exactly; it is authoritative for the maintenance rules. The diff reading is the one thing you may offload, and only for a large change set, to a read only `scout` subagent on the cheapest model (Claude Code: `haiku`) that returns a compact map. Stay within the same boundaries the old tool grant expressed: `Edit` existing docs, scope, and spec `**Status**:` lines; `Write` strictly for a **net new area** nested AGENTS.md; no root creation, no spec *content* edits (Status line only), no shallow nested docs for established areas (these are rules in `agent-prompt.md`).

The inputs to apply:
  1. `MODE`, `BASE`, `MERGE_BASE`, `CHANGED_FILES` (name status changed source list), `DIFF_COMMAND` (exact `git diff` command)
  2. `DELETED_PATHS` (deleted paths, for orphan cleanup)
  3. `ROOT_AGENTS_MD` (root AGENTS.md contents), `NESTED_PATHS` (nested AGENTS.md paths)
  4. `SPEC_PATHS` (all spec paths, for Status line reconciliation and staleness flagging)
  5. `FILE_TO_CONTEXT_MAP` (changed file → nearest context file)
  6. `SCOPE_PATH_OR_NONE` (relevant workspace scope path(s), not all of `docs/scope/`; also the source of each linked feature's status for spec Status line reconciliation)
  7. `INSTALLED_SKILLS_OR_NONE`, `MCP_SERVERS_OR_NONE`, `DECLINED_TOOLS_OR_NONE` from Step 2.5

### 4. Relay the result

**If the maintenance failed or produced no parseable summary**, report that and do it again, don't fabricate a result (a genuine `NOTHING_TO_SYNC` is a valid success; a crash or empty output is not). Otherwise relay the compact summary:

```
## /sync complete

**Scope**: <N> changed files

**AGENTS.md updated**:
- `<path>`, <what was added/corrected, one line>   (or "no updates needed")

**AGENTS.md created** (new area):
- `<area>/AGENTS.md`, <what conventions it captures> (+ root pointer added)

**Orphans cleaned** (after deletions):
- `<path>`, <removed orphaned nested doc / fixed broken pointer>

**Scope reconciled** (relevant workspace):
- `<feature>`, <ticked sub-tasks / status planned→in-progress→done to match the diff>   (or "no scope, or already accurate")

**Spec statuses reconciled** (Status line only):
- `docs/specs/<file>`, <Status Proposed→In Progress→Accepted to match the feature's scope status>

**Specs flagged stale** (run /architect to update or supersede):
- `docs/specs/<file>`, <why the change makes it stale, or status mismatch sync couldn't safely resolve>

**Context gaps** (run /audit, area too established for /sync to document from the diff alone):
- `<area>`, <pre-existing undocumented area only sliced by this change>

**Conflicts left for you** (not auto-edited):
- `<path>`, <curated content that would need rewriting; decide manually>
```

Omit any section with no items. If everything was already current and nothing is stale, say so in one line. /sync does not run /architect or /audit for you; it points, you decide.

---

## Subagent prompt template

See `agent-prompt.md`.
