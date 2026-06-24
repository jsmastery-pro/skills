---
name: review
compatibility: Built for Claude Code — uses subagents, model selection, and interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
description: Use this skill to get a rigorous, senior-level code review of a change before it merges. Run /review after implementing a feature or bug fix, before opening a PR, or when the triage playbook lists /review. The review always runs on a DIFFERENT Claude model than the one that wrote the code — spawned automatically as a subagent, no API keys or setup — because a fresh model catches mistakes the author model is blind to. It acts as a Staff Engineer reviewing a colleague's PR: severity-ranked, actionable findings on correctness, security, performance, maintainability, and test adequacy. It reviews the branch's change set (vs the base branch) plus any uncommitted work. It reports findings and writes them to docs/reviews/ — it does not modify your code.
---

## What this skill does

Reviews the current change set as a senior engineer would review a teammate's pull request, and writes severity-ranked findings. The critical property: **the reviewer runs on a different model than the author.** A model reviewing its own output shares its own blind spots; a second model catches what the first missed.

- **Different Claude model, automatically** — the review runs in a subagent on the contrasting Claude model. No API keys, no external setup.
- **Read-only on code** — produces findings, never edits the code under review.
- **Want a different provider?** For the most independent review, switch your active model (`/model`, or your other AI tool) and run the review there — a recommendation, not machinery. The skill never sends your code anywhere itself.

Owns review findings (`docs/reviews/`). Does not write code, tests, ADRs, or CLAUDE.md.

## Asks vs acts

**Acts**, with one deliberate exception: it confirms **which model wrote the code** before reviewing (a single MCQ, detected value pre-selected). This guard exists because the model can't reliably detect itself and a wrong guess silently breaks the cross-model guarantee — see Step 1. Everything else (scoping, reviewing, writing findings) it does without asking. It states which model is reviewing so you can still redirect. It also pauses if there is **nothing to review** (clean tree, no branch diff). The confirm is skipped when you pass an explicit `with <model>` override and detection was unambiguous.

You may steer it: `/review` (default contrasting model), `/review with opus` (force a reviewer), or `/review uncommitted` (scope to working-tree changes only).

## Artifact ownership

`docs/reviews/<YYYY-MM-DD>-<branch>.md` — created by this skill only. The subagent writes it; the main model relays a summary.

---

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows:
- **Commands**: `git` is the only required CLI and behaves the same on every OS — run the `git` lines as shown. Other shell snippets are POSIX **reference**, not literal scripts: don't assume `find`, `grep`, `sed`, `cat`, `test`/`[ ]`, `ls`, `xargs`, or `for` exist. Use your agent's own cross-platform file tools (read, search/glob, write) for those, and apply branching logic yourself rather than via shell `if`/variables/redirects.
- **Bundled files**: referenced by paths relative to this skill's folder; the main agent reads them. Anything a subagent needs is passed **into its prompt as text** — subagents can't resolve skill-relative paths.

## Execution

### 1. Determine the author model, then pick a DIFFERENT reviewer

This is the whole point of the skill, so get it right. **Do not rely on self-introspection** — the model executing this skill cannot reliably name itself, and the "You are powered by…" line in the system prompt is written at session start and goes **stale** the moment the user switches with `/model`. Detect from durable config instead, then confirm.

**1a — Detect the author model (best effort).** The author model is whatever is generating code in this session. Gather hints cheaply:

```bash
echo "ANTHROPIC_MODEL=${ANTHROPIC_MODEL:-unset}"
for f in .claude/settings.local.json .claude/settings.json "$HOME/.claude/settings.json"; do
  [ -f "$f" ] && grep -o '"model"[[:space:]]*:[[:space:]]*"[^"]*"' "$f" | sed "s|^|$f: |"
done
```

Map any detected id to a family: `claude-opus-*` → `opus`, `claude-sonnet-*` → `sonnet`, `claude-haiku-*` → `haiku`, `claude-fable-*` → `fable`. Use the system-prompt value only as a last-resort weak hint, and treat it as possibly stale.

**1b — Confirm the author model (one question — this guard is worth it).** A wrong guess here silently reviews code with the same model and defeats the skill, so confirm before spawning. Pre-select the detected family as the recommended option:

```
AskUserQuestion — "Which model wrote this code? I'll review on a different one."
  header: "Author model"
  options:
    - label: "<detected> (detected — recommended)"   # e.g. "opus (detected — recommended)"
      description: "I'll review with <contrasting model> for a fresh perspective"
    - label: "<next strong model>"
      description: "Review will run on <its contrast>"
    - label: "<another strong model>"
      description: "Review will run on <its contrast>"
```

If detection was unambiguous **and** the user passed an explicit `with <model>` reviewer override, you may skip this question and proceed — the override already settles which model reviews. Otherwise ask.

**1c — Map to the contrasting Claude reviewer.** No API keys, no external setup — the `Agent` tool spawns a different Claude model and that model does the review:

| Author model | Reviewer model to spawn |
|---|---|
| `opus` | `sonnet` |
| `sonnet` | `opus` |
| `fable` | `opus` |
| `haiku` | `sonnet` |

Rules:
- The reviewer must **never** be the same family as the author — the one invariant this skill exists to guarantee.
- Never review with `haiku` — review is high-value reasoning; use a strong model.
- If the user passed `with <model>`: honor it only if it differs from the author. If they named the author's own model, refuse and explain: "That's the model that wrote the code — reviewing with it shares its blind spots. Using `<contrast>` instead."

State the final choice plainly before spawning:
> "Author on `opus`; running the review on `sonnet` — a second model catches what the author model is blind to."

**Want a different *provider* (GPT, Gemini)?** Don't wire up API keys — just switch your active model in your AI tool (`/model` for a different Claude, or open the change in your other assistant) and run the review there. The skill recommends this in its closing note for high-stakes changes; it never sends your code anywhere itself.

### 2. Scope the change set (cheap — names only, let the subagent read the diff)

Keep the main context lean: gather **file names and the base ref only**. The subagent runs the actual `git diff` and reads files.

```bash
# Base branch
git rev-parse --verify main >/dev/null 2>&1 && BASE=main || BASE=master
CUR=$(git rev-parse --abbrev-ref HEAD)

if [ "$CUR" = "$BASE" ]; then
  # Working directly on the base branch — review uncommitted work
  echo "MODE=uncommitted BASE=$BASE"
  git diff --name-only HEAD 2>/dev/null
  git ls-files --others --exclude-standard 2>/dev/null
else
  # Feature branch — review everything that differs from the base (the PR-equivalent)
  MB=$(git merge-base "$BASE" HEAD)
  echo "MODE=branch BASE=$BASE MERGE_BASE=$MB"
  git diff --name-only "$MB" 2>/dev/null            # committed-since-branch + uncommitted
  git ls-files --others --exclude-standard 2>/dev/null
fi
```

If the user passed `uncommitted`, force `MODE=uncommitted` regardless of branch.

De-duplicate the file list. Exclude lock files and generated output (`dist/`, `build/`, `.next/`, `coverage/`) from the count, but the subagent still sees the full diff.

**If the change set is empty**: stop and tell the engineer there's nothing to review — make a change first, or point /review at a branch. Do not spawn.

### 3. Gather lightweight pointers (do NOT read heavy files here)

Paths and cheap signals only — the subagent reads on demand. Using your file tools: list the 3 most-recent ADR files under `docs/adr/` (paths only), and note whether `test-preferences.json` exists (is the project tested?).

Pass to the subagent: CLAUDE.md contents inline (short), the 3 recent ADR **paths**, the base ref / merge-base, and the diff scope. The subagent reads ADRs only if they govern the changed code, runs `git diff` itself, and reads the changed files and their tests.

### 4. Spawn the review subagent — on the contrasting Claude model

Read two bundled files from this skill's folder (relative paths — you, the main agent, can resolve them): `agent-prompt.md` (the spawn template) and `review-guide.md` (the rubric). Fill the template **and inline the full `review-guide.md` text into it** — the subagent can't resolve skill paths, so it must receive the rubric as prompt text. Then spawn:

- `model`: **the reviewer model chosen in Step 1** (different family from the author)
- `description`: `"Review: <N> changed files on <reviewer-model>"`
- Tools: `Read`, `Bash`, `Grep`, `Glob`, `Write` — **no `Edit`** (the reviewer reports, it does not change code)
- `prompt`: filled template with:
  1. The full `review-guide.md` content (injected, not referenced)
  2. Diff scope: `MODE`, `BASE`, `MERGE_BASE`, and the changed-file list with the exact `git diff` command to run
  3. CLAUDE.md contents (inline) — project conventions the review must enforce
  4. Recent ADR paths (read if relevant), or inline the relevant ADR text if your client gives subagents no file access
  5. Whether the project has tests configured (so it can judge test adequacy)
  6. Output path for findings: `docs/reviews/<date>-<branch>.md`

### 5. Relay the result

The subagent writes the findings file and returns a compact summary. Relay:

```
## /review complete

**Reviewed by**: <reviewer-model> (you're on <author-model>)
**Scope**: <N> files — <branch vs base | uncommitted>
**Findings file**: `docs/reviews/<date>-<branch>.md`

**Verdict**: <Approve | Approve with nits | Changes requested | Blocked>

**Blockers** (<count>):
- <file:line — one line each>

**Major** (<count>):
- <file:line — one line each>

**Minor / nits**: <count> — see the findings file

**Strengths**: <one or two genuine positives>
```

Show **all blockers and majors** in chat; collapse minors/nits to a count with a pointer to the file. If there are zero blockers and zero majors, lead with the verdict and keep it short.

For a **high-stakes change** (verdict was Blocked or Changes requested, or triage marked it high/critical severity), append one line:
> "For an independent second opinion from a different provider, switch your model with `/model` (or paste the diff into another assistant) and re-run /review — no API keys needed."

This skill is complete after relaying. It does not fix the findings (the implementer does that) and does not invoke other skills. If the engineer wants the issues fixed, that's a normal follow-up — /review's job is the assessment.

---

## Reference files (in this skill's folder; relative paths)

- `agent-prompt.md` — lean spawn template the main model fills
- `review-guide.md` — rubric, severity, findings format. The main model reads it and **injects its text into the subagent prompt** (portable across agents).
