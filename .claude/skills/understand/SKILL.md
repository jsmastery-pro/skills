---
name: understand
compatibility: Built for Claude Code — uses subagents, model selection, and interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
description: Use this skill to comprehend a repository or a specific area of the codebase before designing or planning a change. Run /understand when starting a medium or full task (per the triage playbook), when no CLAUDE.md context files exist yet, or when you need a reliable map of an area before making changes. This skill creates context files the first time — root CLAUDE.md for the repo, or a nested CLAUDE.md for a focused area. It does not maintain existing files after changes; that is /sync's job. Do not run /understand after /design has already written an ADR for the same scope.
---

## What this skill does

Explores the repo or a named area, extracts durable knowledge, and writes context files where they are missing. Asks for coding standards when starting a greenfield project.

Does not create ADRs (/design owns those). Does not maintain files after changes (/sync owns that).

## Scope

From the argument or task description:

| Input | Phase triggered |
|---|---|
| No argument, codebase is empty, no CLAUDE.md | Phase 1 — greenfield setup |
| No argument, codebase exists, no CLAUDE.md | Phase 2 — whole-repo scan |
| Path or area name (e.g. `auth`, `src/payments`) | Phase 3 — area scan |

## Acts vs asks

- Phase 1: asks coding pattern questions via MCQ before creating root CLAUDE.md.
- Phase 2: acts immediately, no questions.
- Phase 3: acts to explore; asks permission before modifying existing root CLAUDE.md.

## Artifact ownership

| File | Rule |
|---|---|
| Root `CLAUDE.md` | Create if missing (Phase 1, 2). Gap-fill with permission if it exists (Phase 3). |
| `<area>/CLAUDE.md` | Create if missing and area warrants it (Phase 3). Propose additions if it exists. |

When creating a nested file, add exactly one pointer line to root under `## Context files`:
```
- [<area>/CLAUDE.md](<area>/CLAUDE.md) — <one-line description>
```

Never create a nested CLAUDE.md for every subfolder — only where distinct conventions exist.

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows:
- **Commands**: `git` is the only required CLI and behaves the same on every OS. Other shell snippets (file counts, `find`, `[ -f ]`) are POSIX **reference**, not literal scripts — use your agent's own cross-platform file tools (search/glob, read, write) to list and count source files and check existence instead.
- **Bundled files**: the pattern presets (`patterns/*.md`) and `agent-prompt.md` are referenced by paths relative to this skill's folder; the main agent reads them and injects the needed text **into the subagent prompt** — subagents can't resolve skill-relative paths.

## Execution

### Pre-flight (main model does this before anything else)

```bash
# Check if CLAUDE.md exists
[ -f CLAUDE.md ] && echo "ROOT_EXISTS" || echo "ROOT_MISSING"

# Count meaningful source files
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
  -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.rb" \
  -o -name "*.swift" -o -name "*.kt" \) \
  -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' \
  -not -name "next.config.*" -not -name "tailwind.config.*" -not -name "postcss.config.*" \
  -not -name "vite.config.*" -not -name "vitest.config.*" -not -name "jest.config.*" \
  -not -name "eslint.config.*" -not -name "prettier.config.*" | wc -l
```

Use the results to pick the phase below.

---

### Phase 1 — Greenfield setup

**Trigger**: root CLAUDE.md is missing AND source file count < 10.

**Step 1 — Ask coding patterns** (main model calls `AskUserQuestion`):

Question 1 — Architecture style (single-select):
- Read `patterns/clean-architecture.md` for label/description
- Read `patterns/functional.md`
- Read `patterns/domain-driven.md`
- Read `patterns/solid-oop.md`
- Present all four as options

Question 2 — Additional standards (multi-select):
- `Strict types` — No `any`/untyped code; exhaustive type coverage
- `Test-driven` — Tests written before or alongside implementation
- `Conventional commits` — `feat:`, `fix:`, `chore:` prefix on all commits
- `Documented APIs` — JSDoc/docstrings required on all public interfaces

**Step 2 — Inject selected pattern content**:
- If a named pattern was selected: the main model already read all four files in Step 1 — do not re-read. Use the full content of the matching file as `SELECTED_PATTERNS`.
- If "Other" was selected (free-text input): no pattern files were read in Step 1. Use the engineer's exact typed text as `SELECTED_PATTERNS` — pass it directly, no file to read.

**Step 3 — Spawn subagent** with:
- `model: "sonnet"`
- `description: "Understand: greenfield setup — create root CLAUDE.md"`
- Tools: `Read`, `Bash`, `Write`
- `prompt`: filled `agent-prompt.md` template with `PHASE=greenfield`, `SELECTED_PATTERNS=<file contents>`, `ADDITIONAL_STANDARDS=<selections>`

---

### Phase 2 — Whole-repo scan

**Trigger**: root CLAUDE.md is missing AND source file count ≥ 5.

**Spawn subagent** with:
- `model: "sonnet"`
- `description: "Understand: whole-repo scan — create root CLAUDE.md"`
- Tools: `Read`, `Bash`, `Write`
- `prompt`: filled `agent-prompt.md` with `PHASE=whole-repo`, existing files noted as MISSING

---

### Phase 3 — Area scan

**Trigger**: a path or area name was given (e.g. `/understand src/auth`).

**Pre-flight additionally**:
1. Check the area path exists:
   ```bash
   [ -e <area-path> ] && echo "EXISTS" || echo "NOT_FOUND"
   ```
   If `NOT_FOUND`: stop immediately. Tell the engineer: "Path `<area>` not found. Check the path and try again." Do not spawn a subagent.
2. Read root `CLAUDE.md`.
   - If root CLAUDE.md is **missing**: run Phase 2 fully first (spawn whole-repo subagent, wait for it to complete and write root CLAUDE.md), then continue with Phase 3 using the newly created file.
   - If root CLAUDE.md **exists**: proceed directly.
3. Check if `<area>/CLAUDE.md` exists — note present or missing.

**Spawn subagent** with:
- `model: "sonnet"`
- `description: "Understand: area scan — <area>"`
- Tools: `Read`, `Bash`, `Write`, `Edit`
- `prompt`: filled `agent-prompt.md` with `PHASE=area`, `AREA=<path>`, root and nested CLAUDE.md contents injected

Note: the subagent adds the nested CLAUDE.md pointer to root using the **Edit** tool — it does not re-create root CLAUDE.md. If root was just created in this same session (Phase 2 ran first), the subagent will still Edit it safely since Write was used for the initial creation and Edit only touches the pointer line.

**After subagent runs**, parse the report for the `Root gaps flagged` section:
- If `ROOT_GAPS: none` → relay the full report, done.
- If gaps exist → call `AskUserQuestion`:
  - Question: "I found things in `<area>` not reflected in root CLAUDE.md. What should I do?"
  - Option 1: `Add them now` — description: "I'll apply the additions immediately"
  - Option 2: `Show me the diff` — description: "Print exactly what would change; I'll apply it manually"
  - Option 3: `Skip for now` — description: "Leave root CLAUDE.md as-is"

  - If `Add them now`: parse the subagent report — locate the `ROOT_GAPS:` block and extract each line starting with `- `. Each line contains the exact markdown to insert and the target section (`— target section: ## <section>`). Apply one **Edit** tool call per gap, inserting the exact text into the named section. Do not paraphrase.
  - If `Show me the diff`: print each addition as a fenced markdown block with the target section labelled. Do not write.
  - If `Skip for now`: do nothing.

Relay the full report after the choice is applied.

---

### After all phases

Relay the subagent's report:
- What was discovered (2–4 bullets)
- What was written (file paths)
- What was proposed or skipped (if existing files were found)

## Pattern presets

See `patterns/` for the four coding style presets used in Phase 1.

## Subagent prompt template

See `agent-prompt.md`.
