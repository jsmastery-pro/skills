# Engineering Workflow Skills

A set of [Agent Skills](https://agentskills.io) that take a change from a vague idea to shipped, verified, documented code, for any AI coding agent. One skill per phase. Run only the ones a change needs, in any order.

The state lives in files (a scope, specs, AGENTS.md, tests), not in a chat session. So work survives across sessions, picks up where it left off, and works for a whole team.

```
idea → /scope → /audit → /architect → /develop → /check verify → /test → /check review → /document → /sync
```

Run `/debug` anytime something breaks. Run a bare `/scope` anytime to see where things stand.

> **This is a fork** of [jsmastery-pro/skills](https://github.com/jsmastery-pro/skills) (MIT). It keeps the same nine skills and the same rigor, and removes the loops that made the original tiring to use:
> - **One owner for `done`**: only the skill that closes your workflow depth asks, once, and nothing reopens it.
> - **Fewer, batched questions**: only what you alone can answer, or what is hard to undo, is asked. `/develop` asks everything in one round before it writes code; `/architect` and `/scope` ask in a few batched rounds. The rest is decided, recorded, and listed under **Decided for you** so you can overrule it.
> - **Sound recommendations**: every recommended option is correct, then secure, then reliable, then simple; never an easier but weaker shortcut.
> - **Decisions are always written down**: specs go `Draft` → `Decided` when you accept them, and choices made while building land in the spec's `## Build decisions`.
>
> Full list of changes: [PR #1](https://github.com/ElDeepFull/skills/pull/1).

> 📖 **Want the full picture?** Read the **[Workflow Guide](docs/workflow-guide.md)** — a plain-language walkthrough of every skill, the files that carry the work, who owns what, and one idea followed all the way from scope to shipped.

## The skills

| Skill | What it does |
|---|---|
| `scope` | Turns a product idea into a living, coarse scope and keeps it current as you ship. |
| `audit` | Writes the AGENTS.md context files every other skill reads. |
| `architect` | Makes a load bearing decision and writes it as a build spec in `docs/specs/`. |
| `develop` | Builds a feature, UI or backend, from its spec. Asks once, before building, only for a hard to undo decision; settles and records the rest. |
| `check` | Confirms a change before merge. `/check verify` runs the real app; `/check review` reads the code on a second model. |
| `test` | Writes a test suite for the code you just changed. |
| `document` | Writes the PR text, changelog, release note, or postmortem from the real diff. |
| `sync` | Keeps AGENTS.md, the scope, and spec statuses current after a change. |
| `debug` | Finds and fixes the root cause of a bug, then hands a regression test to `/test`. |

Hardening (systems level failure mode analysis) is temporarily removed and will return as a system design specialization.

## Install

Uses [npx skills](https://github.com/vercel-labs/skills). Pick your agent:

```bash
# Claude Code (installs into .claude/skills, then restart Claude Code)
npx skills@latest add ElDeepFull/skills -a claude-code

# Generic .agents/skills, read by Codex and other agents
npx skills@latest add ElDeepFull/skills
```

Works on any Agent Skills client (Claude Code, Cursor, Codex, Gemini CLI, and [more](https://agentskills.io/clients)). Commit the installed skills folder to share the workflow with your team.

Each skill's instructions live in its `SKILL.md`, which is what every client reads. The `agents/openai.yaml` beside it is interface metadata only (the name, blurb, and opening prompt Codex shows in its agent picker); it carries no logic of its own.

## Where it runs

The skills follow the Agent Skills format, so any client that reads `SKILL.md` can load them. What is tested is smaller than that claim, and this table says which is which.

| Client | Status | What is actually checked |
|---|---|---|
| Claude Code | Primary | The install path and the nine skills are used daily; CI checks the conventions and the fixtures, not a model run |
| Codex | Adapter shipped | The `agents/openai.yaml` fields, and its `display_name` matching the skill, on every `npm run check` |
| Cursor, Gemini CLI, other Agent Skills clients | Expected to work | The format only, not a run |

Tell us which client you use when you report a problem.

### Migrating a project from `jsmastery-pro/skills`

Already using the original workflow in a project? Switch on a branch, with your current work committed:

1. Run the install line above in the project (both lines if it has both `.claude/skills/` and `.agents/skills/`), and accept replacing the nine workflow skills. Then check `skills-lock.json`: each of the nine must list `ElDeepFull/skills` as its source, and a copy left in either folder must match this fork. Skills from other sources are not part of this change.
2. Keep your files as they are. The scope and specs need no migration: legacy spec statuses (`Proposed`, `In Progress`, `Accepted`) read as `Decided`, and an old `Assumed` spec's `## Assumption built on` reads as its build decisions. Nothing rewrites them.
3. Never run `npx skills update` against the old source again: it would bring the original workflow back. Update from this fork instead.

## Where to start

**New product (greenfield):** `/scope` the idea, then `/architect` the stack, then scaffold the project, then `/audit` to seed AGENTS.md from the real project, then the feature loop. The stack is decided and the project scaffolded before `/audit` runs, so it reads a real project, not an empty one.

**Existing codebase (brownfield):** `/audit` first so every skill understands your project, then `/scope` the next slice on top of what exists, then the feature loop.

**Any single change:** run only what it needs. A bug goes straight to `/debug`. A small change can be `/develop` then `/check verify`.

**Monorepo:** everything scopes to the target workspace, which has its own AGENTS.md, scope, stack, and commands.

### The feature loop

```
/architect → /develop → /check verify → /test → /check review → /document → /sync
```

At the end of `/scope` you also pick a **workflow depth** for the project (override per feature anytime): `Prototype` (just `/develop`, self-checked, for throwaway work), `Alpha` (adds `/check verify`), `Beta` (adds `/test`), or `GA` (adds a fresh-model `/check review` and `/document`). The depth is a *suggested* checking tail after `/develop`, never a track you're locked onto: you're in charge, you run or skip any step. One skill asks `done`, once (the last step of your depth), or you say "mark it done" anytime; after that nothing reopens it. The one thing the workflow asks — at every depth — is that a load-bearing decision gets written down (`/architect`), not that any check be run.

`/scope` fixes what to build. `/architect` designs how, as a spec whose acceptance criteria are the contract; every later step traces back to that contract. `/develop` never invents a decision silently: a hard to undo choice (auth, payments, the main data model) gets one question with a recommended pick; a reversible open choice gets decided, written into the spec under `## Build decisions`, and listed in the report so you can overrule it. No spec at all → it records its choices in a small `Assumed` spec, a complete record you can revisit with `/architect` whenever you want.

The gate is layered, not magic: `/architect` names the source of every value a feature must produce (so gaps surface at design time), `/develop` checks that coverage again before building, and at Beta+ `/architect` recommends running an independent cross-model critic over the spec for decisions it never settled (you decide, and you decide on any gaps it finds). It's a strong, defense-in-depth gate that catches the vast majority — not an absolute guarantee, no prompt can be. Behavioral correctness is caught by the `/check verify` and `/test` layers.

## What gets written, and where

| Artifact | Path | Owner |
|---|---|---|
| Scope | `docs/scope/` | scope |
| Specs | `docs/specs/` | architect |
| Context files | AGENTS.md (plus a thin CLAUDE.md pointer) | audit, kept current by sync |
| Design system | `design.md` (art direction; token values live in CSS) | develop |
| Review findings and verification evidence | `docs/reviews/` | check |
| Tests | your test dirs | test |
| App code | your source tree | develop |
| Human docs | PR body, CHANGELOG.md, `docs/releases/`, `docs/postmortems/` | document |

If `docs/` is a published docs site, these move to `.workflow/` so they do not ship with your site. Because state lives in files, the skills suggest `/clear` between features and after `/architect`'s long design conversation, so a fresh session reads from disk again and long chats do not pile up cost.

## Skill reference

For each skill: what it does, and when to run it.

**scope**: Turns an idea into a living, coarse plan of what to build, in order.
When: to start a new product or plan the next slice. Greenfield: run it first. Brownfield: it enrolls what already exists, then plans the new work. Monorepo: writes one scope per workspace.

**audit**: Writes the AGENTS.md context files that give every skill your project's stack, commands, and conventions.
When: brownfield, run it first. Greenfield, run it after the stack is chosen and the project is scaffolded. Monorepo: gives each workspace its own nested AGENTS.md.

**architect**: Runs a deep design conversation and writes the decision as a build spec.
When: a load bearing choice is unmade (a stack, a data model, a provider, a page design), or `/develop` says a decision is owed. Greenfield: it decides the stack first. Monorepo: reads the target workspace's stack.

**develop**: Builds a feature, UI or backend, from its spec, runs migrations, and advances the scope.
When: after the decision exists, or straight away for a change with no spec: it asks once, before building, only if a choice is hard to undo, and records every other choice it makes in the spec. Monorepo: builds inside the target workspace using its commands.

**check**: Confirms a change before merge, in two modes.
When: `/check verify` after `/develop` to run the real app and prove the feature works against the spec; `/check review` before a PR for a senior review on a different model than wrote the code. Any project type.

**test**: Writes a senior test suite for your uncommitted change and saves your framework choice.
When: after building a feature or fixing a bug. Monorepo: resolves the framework per package.

**document**: Writes the human facing prose (PR, changelog, release note, postmortem) from the real diff.
When: a finished change needs writing up. Any project type.

**sync**: Reconciles AGENTS.md, the scope, and spec statuses to what the repo now shows.
When: the last step around merge. Monorepo: reconciles the right workspace.

**debug**: Runs a disciplined root cause loop and hands a regression test to `/test`.
When: anytime something is failing, throwing, or behaving wrong. Not tied to project type.

## Checks in this repo

- `npm test`: the convention check, the fixtures, and the unit tests, in one command.
- `npm run check`: the conventions and budgets every skill must meet.
- `npm run fixtures`: the artifact doctor against three small projects, compared with the defects each one declares.
- `npm run test:unit`: 30 unit tests for the doctor, the artifact invariants, the prose rules, and the eval CLI.
- `npm run doctor <project>`: the same doctor on a project that uses the workflow. Report only, it edits nothing.
- `npm run eval -- --fixture brownfield --scenario verify --cmd "<your agent command>"`: copies the fixture, runs the prompt, and scores the artifacts produced. No model is bundled, so it is only as reproducible as the command you name.

## Versions

`package.json` carries the version, and each release is tagged. `npx skills` records the source in `skills-lock.json`: after an install or an update, check that the nine skills point at `ElDeepFull/skills`, and pin your team to a tag when you need a known state.

## Learn more

The **[Workflow Guide](docs/workflow-guide.md)** is the deep dive: how the scope, specs, AGENTS.md, and design system live and who is allowed to change them; the acceptance-criteria thread that ties every stage together; a full worked example from idea to shipped; the debug loop; and how the same flow runs on an existing codebase and in a monorepo.

---

Built with the [Agent Skills](https://agentskills.io) open format.
