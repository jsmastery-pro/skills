# Develop: git handling (read only when git integration is on)

Read this only when the nearest `AGENTS.md` `## Git` block says `integration: on`. Absent or `off` → do no active git; the engineer manages branches and commits, and the read only freshness checks still apply. Git is the one hard dependency; skip silently if there is no repo.

Read the setting: `integration`, `branch prefix` (default `feat/`), `commit` (`per-milestone` default, `end-of-build`, or `manual`). Local ops (branch, commit) are offers with a recommendation; **push and PR always confirm** (outward) and PR is `/document`'s job, not this skill's.

**Ensure a repo exists first.** If integration is on and the project is not yet a git repo (`git rev-parse` fails), run `git init` before any branch or commit, and stage what is already there for the first commit. `/audit` normally does this the moment integration is turned on; this is the backup for a project that reached a build without it.

## Branch (before building, in the freshness & collaboration check)

- On the default branch (`main`/`master`) → **offer to branch** (recommended): `<prefix><feature-slug>` from the scope feature name (kebab case; e.g. `feat/accounts-sign-in`). Never build on the default branch.
- On a feature branch already → reuse it; do not create another.
- Resuming a half built feature (Step 3) → check out that feature's branch first if it exists and you are not on it.
- Use the change type for the prefix when it is not a feature (`fix/`, `refine/`), else the setting's default.

## Commit (as milestones land, per the `commit` setting)

- `per-milestone` (default) → when a milestone lands and its typecheck is green, **offer to commit** just that milestone's files.
- `end-of-build` → one commit when the build lands.
- `manual` → never commit; the engineer does.

Message: a **one line Conventional Commit subject**, no prose body, plus the `Co-Authored-By` trailer (required). Type from the work (`feat`, `fix`, `refactor`, `test`, `chore`), optional scope from the feature, summary in the imperative:

```
feat(auth): add session persistence

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

The why lives in the spec and the PR, never in the commit body (single source). Commit only what actually landed and typechecks; never commit a half done milestone. Never `git push` here (that is `/document` at PR time, confirmed).

## Report

Add one line to the `/develop` summary: the branch you are on, and what you committed (`feat(auth): … · 3 commits`) or that commits are `manual`. If integration is off or absent, say nothing about git.
