# Engineering Workflow Skills

A set of [Agent Skills](https://agentskills.io) that encode a tiered, phase-based engineering workflow — scope an idea, triage a change, audit the code, architect the decision, build, verify, test, review, harden, document, and keep context in sync. Each skill owns one phase and one artifact, so nothing sprawls.

## Install

Using [`npx skills`](https://github.com/vercel-labs/skills). **The install folder depends on the agent you target with `-a`** — pick the one(s) you use:

```bash
# Claude Code → installs into .claude/skills/
npx skills@latest add JavaScript-Mastery-Pro/pilot -a claude-code

# No -a → installs into the generic .agents/skills/ (read by Codex and other agents)
npx skills@latest add JavaScript-Mastery-Pro/pilot

# Both at once → creates BOTH .claude/skills/ and .agents/skills/
npx skills@latest add JavaScript-Mastery-Pro/pilot -a claude-code -a codex

# See what's available, or install just one
npx skills@latest add JavaScript-Mastery-Pro/pilot --list
npx skills@latest add JavaScript-Mastery-Pro/pilot --skill review -a claude-code

# Install globally (for your user, all projects) with -g
npx skills@latest add JavaScript-Mastery-Pro/pilot -a claude-code -g
```

> **Which folder?** Each agent reads its own directory: **Claude Code → `.claude/skills/`**, while Codex and several others read the shared **`.agents/skills/`**. If you want a skill in two tools, install for both (e.g. `-a claude-code -a codex`) — you'll then have both folders, each with its own copy. After installing for Claude Code, **restart it** so the skills load.

Commit the installed skills folder(s) to share the same workflow with your team.

## Compatibility

These skills follow the open Agent Skills format and are written to be **portable**:

- **Any OS** — macOS, Linux, and Windows. `git` is the only required CLI (identical everywhere); every other step uses your agent's own cross-platform file tools rather than POSIX utilities like `find`/`grep`/`sed`.
- **Any client** — they install on any skills-compatible agent (Claude Code, Cursor, Copilot, Codex, Gemini CLI, and [more](https://agentskills.io/clients)). Bundled files are referenced by relative paths, and anything a subagent needs is passed into its prompt as text, so nothing depends on a fixed install location.
- **Tuned for Claude Code** — several use Claude Code features (subagents, model selection for cross-model review, interactive questions). On clients without those, the format installs cleanly and the orchestration steps degrade gracefully (e.g. the review runs inline instead of on a second model).

## The skills

| Skill | Phase | What it does |
|---|---|---|
| `mvp` | Scope | Turns an idea into a prioritized feature roadmap (`docs/features/index.md`). |
| `triage` | Plan | Recommends a risk tier, playbook, and severity before any code is touched. |
| `audit` | Comprehend | Audits the codebase (or seeds standards on greenfield) and writes the context files (root / nested `AGENTS.md`). |
| `architect` | Decide | Staff-engineer system design with feature-specific questioning; writes an ADR to `docs/adr/`. |
| `develop` | Build | Builds a feature — UI and logical — from its ADR; gates on the decision first. |
| `verify` | Verify | Runs the real app and confirms the change works end to end (not just green tests). |
| `test` | Verify | Senior test suite for your uncommitted change; saves tooling prefs. |
| `debug` | Fix | Root-cause investigation loop — reproduce, localize, prove, fix at the root. |
| `review` | Verify | Rigorous code review on a **different model** than wrote the code. |
| `harden` | Verify | Systems-level pass for concurrency, scale, and security failure modes. |
| `document` | Ship | PR text, changelog, release notes, or postmortem from the real diff. |
| `sync` | Close | Keeps `AGENTS.md` current, reconciles the roadmap, and flags stale ADRs after a change. |
| `status` | Orient | Reads git + roadmap + ADRs to show where things stand and what's safe to pick up (session/team). |

## Tiers

The amount of process scales with risk. `/triage` picks the tier and the subset of skills to run.

| Tier | When |
|---|---|
| just-do-it | Trivial, reversible, low-risk |
| lean | Small, well-understood change |
| medium | Moderate scope or cross-cutting |
| full | High risk, large scope, or compliance-sensitive |

## Artifacts

Each skill owns one artifact: the feature roadmap (`docs/features/index.md`, `mvp`), ADRs (`docs/adr/`, `architect`), app code (`develop`), tests (`test`), review findings (`docs/reviews/`, `review`), hardening checklists (`docs/hardening/`, `harden`), docs (`document`), and the `AGENTS.md` context files (`audit` creates, `sync` maintains).

## Local development

The canonical source for every skill is the top-level **`skills/`** directory — that's the single copy `npx skills` publishes and installs, so there are no duplicates.

If you want Claude Code to use these skills *while developing this repo* (Claude Code reads from `.claude/skills/`), create a local link — `.claude/` is git-ignored, so this never ships and can't double-list in `npx skills`:

```bash
# macOS / Linux
mkdir -p .claude && ln -s ../skills .claude/skills

# Windows (PowerShell — junction, no admin needed)
New-Item -ItemType Junction -Path .claude\skills -Target skills
```

Validate any skill against the spec with [`skills-ref`](https://github.com/agentskills/agentskills/tree/main/skills-ref):

```bash
npx skills-ref validate ./skills/<name>
```

---

Built with the [Agent Skills](https://agentskills.io) open format.
