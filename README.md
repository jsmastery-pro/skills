# Engineering Workflow Skills

A set of [Agent Skills](https://agentskills.io) that encode a tiered, phase-based engineering workflow — triage a change, understand the code, design the decision, build, test, review, harden, document, and keep context in sync. Each skill owns one phase and one artifact, so nothing sprawls.

## Install

Using [`npx skills`](https://github.com/vercel-labs/skills):

```bash
# Install all skills into the current project (.claude/skills/ for Claude Code)
npx skills@latest add JavaScript-Mastery-Pro/pilot

# See what's available first
npx skills@latest add JavaScript-Mastery-Pro/pilot --list

# Install just one
npx skills@latest add JavaScript-Mastery-Pro/pilot --skill review

# Target a specific agent, or install globally
npx skills@latest add JavaScript-Mastery-Pro/pilot -a claude-code
npx skills@latest add JavaScript-Mastery-Pro/pilot -g
```

Commit the installed `.claude/skills/` to share the same workflow with your team.

## Compatibility

These skills follow the open Agent Skills format and are written to be **portable**:

- **Any OS** — macOS, Linux, and Windows. `git` is the only required CLI (identical everywhere); every other step uses your agent's own cross-platform file tools rather than POSIX utilities like `find`/`grep`/`sed`.
- **Any client** — they install on any skills-compatible agent (Claude Code, Cursor, Copilot, Codex, Gemini CLI, and [more](https://agentskills.io/clients)). Bundled files are referenced by relative paths, and anything a subagent needs is passed into its prompt as text, so nothing depends on a fixed install location.
- **Tuned for Claude Code** — several use Claude Code features (subagents, model selection for cross-model review, interactive questions). On clients without those, the format installs cleanly and the orchestration steps degrade gracefully (e.g. the review runs inline instead of on a second model).

## The skills

| Skill | Phase | What it does |
|---|---|---|
| `triage` | Plan | Recommends a risk tier, playbook, and severity before any code is touched. |
| `understand` | Comprehend | Maps a repo or area and writes the first context files (root / nested `CLAUDE.md`). |
| `design` | Decide | Staff-engineer system design; writes an ADR to `docs/adr/`. |
| `ui` | Build | Disciplined UI from a design system — semantic HTML, tokens, accessibility. |
| `test` | Verify | Senior test suite for your uncommitted change; saves tooling prefs. |
| `review` | Verify | Rigorous code review on a **different model** than wrote the code. |
| `harden` | Verify | Systems-level pass for concurrency, scale, and security failure modes. |
| `document` | Ship | PR text, changelog, release notes, or postmortem from the real diff. |
| `sync` | Close | Keeps `CLAUDE.md` current and flags stale ADRs after a change. |

## Tiers

The amount of process scales with risk. `/triage` picks the tier and the subset of skills to run.

| Tier | When |
|---|---|
| just-do-it | Trivial, reversible, low-risk |
| lean | Small, well-understood change |
| medium | Moderate scope or cross-cutting |
| full | High risk, large scope, or compliance-sensitive |

## Artifacts

Each skill owns one artifact: ADRs (`docs/adr/`, `design`), tests (`test`), review findings (`docs/reviews/`, `review`), hardening checklists (`docs/hardening/`, `harden`), docs (`document`), and the `CLAUDE.md` context files (`understand` creates, `sync` maintains).

---

Built with the [Agent Skills](https://agentskills.io) open format. Validate locally with [`skills-ref`](https://github.com/agentskills/agentskills/tree/main/skills-ref).
