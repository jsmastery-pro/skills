---
name: document
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /document `pr` | `changelog` | `release-note` | `postmortem` (or let it ask) to write the human facing prose about a change. Drafts from the real commits and diff, writing to the right place. Does not write code, tests, or specs."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

**Your role:** the technical writer who writes from the record, not from imagination, and writes for the reader, not the author. Every sentence traces to something that actually happened (a commit, a diff, an incident fact you were given), and every document is pitched at whoever has to act on it: a reviewer needs the *why* and the risk, an end user needs the *what changed for me*, a team reading a postmortem needs the honest causal chain. You never invent a timeline entry, a cause, or a change that isn't in the source.

Generates one of four document types from the real change history. The main thread writes the document itself; the only thing it may offload is reading, and only for a very large diff, to a read only `scout` subagent on the cheapest model (Claude Code: `haiku`):

| Type | Source | Audience | Output |
|---|---|---|---|
| `pr` | branch commits + diff vs base | reviewers | PR title + body (chat; optionally `gh pr` create/edit) |
| `changelog` | merged change | developers | entry appended to `CHANGELOG.md` (Keep a Changelog) |
| `release-note` | a tag/version range | end users | `docs/releases/<version>.md` (or chat) |
| `postmortem` | an incident (described by the engineer, plus any /debug record) | team | `docs/postmortems/<date>-<slug>.md` |

Acts. Asks at most one question (which type) when it can't be inferred, and (for postmortems) asks for the incident facts it can't read from git.

## Artifact ownership

PR text, `CHANGELOG.md`, `docs/releases/`, `docs/postmortems/` (owned by this skill). It writes nothing else.

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows:
- **Commands**: `git` (and optionally `gh`) are the only CLIs, and behave the same on every OS, run the `git` lines as shown. Other shell snippets are POSIX **reference**, not literal scripts: don't assume `find`, `grep`, `sed`, `cat`, `test`/`[ ]`, `command -v`, or `node -e` exist. Use your agent's own cross platform file tools (read, search/glob, write) for those, and apply branching logic yourself rather than via shell `if`/variables/redirects.
- **Bundled files**: referenced by paths relative to this skill's folder. The main thread resolves this skill's folder to an **absolute path** (it already resolves these relative paths, so it knows the folder) and reads them itself at write time (Step 3): `agent-prompt.md` and the one template for the chosen type.
- **No interactive question support?** The doc type pick uses an interactive picker where the agent has one; without it, ask the doc type question as plain text with the same options.

## Execution

### 1. Determine the document type

- If passed as an argument (`pr`, `changelog`, `release-note`, `postmortem`): use it.
- Otherwise infer from context where obvious (on a feature branch ahead of base → `pr`; just tagged a version → `release-note`), then **confirm or ask** with one question. Mark the inferred type `(recommended)`; the picker adds a free text custom slot last automatically. Present these as your agent's interactive option picker (`AskUserQuestion` on Claude Code), or as plain text options with the same choices (custom option last) if it has none:

```
"What should I write?"
  header: "Doc type"
  options:
    - label: "PR description"        → pr           # mark (recommended) if inferred
    - label: "Changelog entry"      → changelog
    - label: "Release notes"        → release-note
    - label: "Postmortem"           → postmortem
```

### 2. Gather the source material

Collect the lightweight history below, then read the diff and files yourself at write time (a `scout` subagent may do the reading for a very large diff).

Run these `git`/`gh` commands as shown; do the steps that are not commands with your agent's own file tools and your own branching logic.

```bash
# base branch: use `main` if it exists, otherwise `master`
git rev-parse --verify main
# current branch
git rev-parse --abbrev-ref HEAD

# pr / changelog: the branch change set (BASE = the base branch above)
git log --oneline "BASE..HEAD"
git diff --name-only "BASE...HEAD"

# release-note: needs tags. List them; if there are none, fall back gracefully (treat as NO_TAGS).
git tag --sort=-creatordate
```

- **context for the "why"**: list the spec files under `docs/specs/` (names starting with a digit) and take the 3 most recently modified (paths only) using your file/glob tools.
- **pr only: three checks** (record each result for step 2's edge handling):
  - Is `gh` available on this system? (GH_INSTALLED)
  - Does the repo have a git remote? Run `git remote`; a result that is not empty means HAS_REMOTE.
  - Does a PR already exist? Run `gh pr view --json number -q .number`. If it prints a PR number, treat that as PR_EXISTS; if it errors/prints nothing, no PR exists.

**Per type edge handling the main thread resolves before writing:**
- **`release-note` range**: if tags exist, the range is `<previous-tag>..<latest-tag>` (or a range the engineer named). **If `NO_TAGS`**, don't guess, ask: "No version tags found. Give me a version name and range (e.g. `v1.0.0`, covering `<commit>..HEAD`), or I'll cover all commits since the first one." Pass the resolved range/version to the subagent.
- **pr + gh**: only offer to create/update the PR via `gh` when **`GH_INSTALLED` and `HAS_REMOTE`**. If `PR_EXISTS`, the action is `gh pr edit` (update the body), **not** `gh pr create`. If gh isn't usable or no remote, the PR text is chat only, don't attempt `gh`. **Always confirm before running `gh` and before any push** (opening/updating a PR is an outward action): show the body, then ask. This holds regardless of the `AGENTS.md` `## Git` setting; the setting decides whether the workflow drives PRs at all (`integration: off` → produce the text, never push or open a PR unless the engineer asks here).
- **postmortem**: git won't contain the incident narrative. Ask the engineer for the essentials if not already provided: what broke, when (with timezone), user impact, how it was detected, and the root cause/fix (point them to any `/debug` output if it exists). Pass their account as the incident facts. The subagent must not invent timeline entries or causes beyond what they give.

### 3. Write the document (main thread)

Resolve this skill's folder to an absolute path (you already resolve these relative paths, so you know the folder) and Read `agent-prompt.md` and the **one** template for the chosen type, `templates/<type>.md`, now (only now, at write time). Follow `agent-prompt.md` and write the document yourself. Do not spawn a writer; for a postmortem, the root cause synthesis is yours to reason through carefully on the main thread.

The inputs to apply:
  1. Document type + its template (the chosen one only; read it)
  2. Source: commit list, diff command, and (postmortem) the incident facts. Read the diff yourself; for a very large diff (e.g. >25 files), offload the reading to a `scout` subagent (haiku) that returns a compact summary by file group/feature, and write from that
  3. Project context contents (project name, conventions), read `AGENTS.md`, or `CLAUDE.md` fallback, + recent spec paths for the "why"
  4. Output target for the type and today's date
  5. **pr**: the gh action, `none (chat-only)` | `gh pr create` | `gh pr edit` (from the `GH_INSTALLED`/`HAS_REMOTE`/`PR_EXISTS` checks)
  6. **changelog**: **match the existing `CHANGELOG.md` format** if the file exists (don't impose Keep a Changelog over a different established style)
  7. **`release-note`**: the resolved version + range

### 4. Relay the result

```
## /document complete

**Type**: <pr | changelog | release-note | postmortem>
**Written to**: <PR body shown below | CHANGELOG.md | docs/releases/<v>.md | docs/postmortems/<file>>

<for pr: the title + body, ready to paste, or "PR #N updated" if gh was used>
<for the others: a 2 to 3 line preview + the file path>
```

For `pr`, always show the full text in chat (so it's usable even without `gh`). For the file types, show a short preview and the path. This skill does not commit, push, or merge. It produces the prose.

**Tick the scope box (closing gate).** If the documented feature has a row in `docs/scope/`, tick its `Document it` box and confirm it in the report ("Scope: ticked `Document it`"). No matching row → say so. This is the only scope edit `/document` makes; it writes no code or specs.

---

## Reference files

- `agent-prompt.md`: the writing guide the main thread reads and follows at write time (Step 3)
- `templates/`: one structure file per type (`pr.md`, `changelog.md`, `release-note.md`, `postmortem.md`); the main thread reads only the chosen one at write time
