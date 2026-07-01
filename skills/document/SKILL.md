---
name: document
compatibility: Built for Claude Code — uses subagents, model selection, and interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Task, AskUserQuestion
description: "Use this skill to write the human-facing prose about a change — a PR description, changelog entry, release notes, or incident postmortem. Run /document when you need any of those written from the real change (commits, diff) rather than by hand. Pass the type (/document pr | changelog | release-note | postmortem) or let it ask. A precise technical writer drafting from history, writing to the right place (PR body, CHANGELOG.md, docs/releases/, docs/postmortems/). It doesn't write code, tests, or ADRs."
---

## What this skill does

Generates one of four document types from the real change history, on a cheap model (haiku) in a subagent:

| Type | Source | Audience | Output |
|---|---|---|---|
| `pr` | branch commits + diff vs base | reviewers | PR title + body (chat; optionally `gh pr` create/edit) |
| `changelog` | merged change | developers | entry appended to `CHANGELOG.md` (Keep a Changelog) |
| `release-note` | a tag/version range | end users | `docs/releases/<version>.md` (or chat) |
| `postmortem` | an incident (engineer-described, plus any /debug record) | team | `docs/postmortems/<date>-<slug>.md` |

Acts. Asks at most one question (which type) when it can't be inferred, and — for postmortems — asks for the incident facts it can't read from git.

## Artifact ownership

PR text, `CHANGELOG.md`, `docs/releases/`, `docs/postmortems/` — owned by this skill. It writes nothing else.

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows:
- **Commands**: `git` (and optionally `gh`) are the only CLIs, and behave the same on every OS — run the `git` lines as shown. Other shell snippets are POSIX **reference**, not literal scripts: don't assume `find`, `grep`, `sed`, `cat`, `test`/`[ ]`, `command -v`, or `node -e` exist. Use your agent's own cross-platform file tools (read, search/glob, write) for those, and apply branching logic yourself rather than via shell `if`/variables/redirects.
- **Bundled files**: referenced by paths relative to this skill's folder; the main agent reads them and passes the chosen template's text **into the subagent prompt** — subagents can't resolve skill-relative paths.
- **No subagent / interactive-question support?** The drafting normally runs in a cheap-model subagent, and the doc-type pick uses an interactive picker — both Claude Code features. On a tool without them: write the document inline yourself following the template, and ask the doc-type question as plain text.

## Execution

### 1. Determine the document type

- If passed as an argument (`pr`, `changelog`, `release-note`, `postmortem`): use it.
- Otherwise infer from context where obvious (on a feature branch ahead of base → `pr`; just tagged a version → `release-note`), then **confirm or ask** with one MCQ:

```
AskUserQuestion — "What should I write?"
  header: "Doc type"
  options:
    - label: "PR description"        → pr
    - label: "Changelog entry"      → changelog
    - label: "Release notes"        → release-note
    - label: "Postmortem"           → postmortem
```

### 2. Gather the source material (cheap — let the subagent read deeply)

The main model collects lightweight history; the subagent reads the diff and files.

```bash
git rev-parse --verify main >/dev/null 2>&1 && BASE=main || BASE=master
CUR=$(git rev-parse --abbrev-ref HEAD)

# pr / changelog: the branch change set
git log --oneline "$BASE..HEAD" 2>/dev/null | head -40
git diff --name-only "$BASE...HEAD" 2>/dev/null

# release-note: needs tags. If none exist, fall back gracefully.
git tag --sort=-creatordate 2>/dev/null | head -5 || echo "NO_TAGS"

# context for the "why"
find docs/adr -name "[0-9]*.md" 2>/dev/null | xargs ls -t 2>/dev/null | head -3   # paths only

# pr only: is gh usable, is there a remote, does a PR already exist?
command -v gh >/dev/null 2>&1 && echo "GH_INSTALLED"
git remote >/dev/null 2>&1 && [ -n "$(git remote)" ] && echo "HAS_REMOTE"
gh pr view --json number -q .number 2>/dev/null && echo "PR_EXISTS"   # prints the PR number if one exists
```

**Per-type edge handling the main model resolves before spawning:**
- **release-note range**: if tags exist, the range is `<previous-tag>..<latest-tag>` (or a range the engineer named). **If `NO_TAGS`**, don't guess — ask: "No version tags found. Give me a version name and range (e.g. `v1.0.0`, covering `<commit>..HEAD`), or I'll cover all commits since the first one." Pass the resolved range/version to the subagent.
- **pr + gh**: only offer to create/update the PR via `gh` when **`GH_INSTALLED` and `HAS_REMOTE`**. If `PR_EXISTS`, the action is `gh pr edit` (update the body), **not** `gh pr create`. If gh isn't usable or no remote, the PR text is chat-only — don't attempt `gh`.
- **postmortem**: git won't contain the incident narrative. Ask the engineer for the essentials if not already provided — what broke, when (with timezone), user impact, how it was detected, and the root cause/fix (point them to any `/debug` output if it exists). Pass their account as the incident facts. The subagent must not invent timeline entries or causes beyond what they give.

### 3. Spawn the document subagent

Read `agent-prompt.md` (lean) and the **one** template for the chosen type:
`templates/<type>.md`. Fill and spawn:

- `model`: `"haiku"` for `pr`, `changelog`, `release-note` (drafting from real material is well-bounded). **`"sonnet"` for `postmortem`** — root-cause synthesis and contributing-factor analysis need stronger reasoning than a cheap model gives.
- `description: "Document: <type>"`
- Tools: `Read`, `Bash`, `Grep`, `Glob`, `Write`, `Edit` (Edit for appending to `CHANGELOG.md`; Bash for `gh` only when the engineer opts to create/update a PR)
- `prompt`: filled template with:
  1. Document type + its template (the chosen one only)
  2. Source: commit list, diff command, and (postmortem) the incident facts
  3. Project-context contents inline (project name, conventions) — read `AGENTS.md`, or `CLAUDE.md` fallback — + recent ADR paths for the "why"
  4. Output target for the type and today's date
  5. **Large-diff note**: if the change spans many files (e.g. >25), tell the subagent to summarise by file-group/feature rather than reading every line — it has a bounded context window
  6. **pr**: the gh action — `none (chat-only)` | `gh pr create` | `gh pr edit` (from the `GH_INSTALLED`/`HAS_REMOTE`/`PR_EXISTS` checks)
  7. **changelog**: a note to **match the existing `CHANGELOG.md` format** if the file exists (don't impose Keep a Changelog over a different established style)
  8. **release-note**: the resolved version + range

### 4. Relay the result

```
## /document complete

**Type**: <pr | changelog | release-note | postmortem>
**Written to**: <PR body shown below | CHANGELOG.md | docs/releases/<v>.md | docs/postmortems/<file>>

<for pr: the title + body, ready to paste — or "PR #N updated" if gh was used>
<for the others: a 2–3 line preview + the file path>
```

For `pr`, always show the full text in chat (so it's usable even without `gh`). For the file types, show a short preview and the path. This skill does not commit, push, or merge — it produces the prose.

---

## Reference files

- `agent-prompt.md` — lean spawn template
- `templates/` — one structure file per type (`pr.md`, `changelog.md`, `release-note.md`, `postmortem.md`); the subagent reads only the chosen one
