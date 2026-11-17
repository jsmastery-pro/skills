# Project: Engineering Workflow Skills

A collection of Claude Code skills encoding a phase based engineering workflow. No mandated playbook: you run whichever skills a change needs, in whatever order fits. `/scope` recommends a workflow tier (`Prototype`/`Alpha`/`Beta`/`GA`, how much verification a project or feature warrants), but it is a default you override per feature, never a forced track.

## Conventions every skill follows

- **The engineer decides; the AI recommends.** Any AI initiated verification or critique (e.g. `/architect`'s cross model spec check) is *offered*, never run or skipped on the engineer's behalf. Whatever such a check finds, a gap, a load bearing decision, a fix, is *surfaced to the engineer to decide*, never silently resolved or auto applied. A check the engineer invokes directly (`/check verify`, `/check review`) is already their choice to run, and still reports rather than auto fixes.
- **Suggestions, never gates.** The engineer is in charge: every step after `/develop` (`/check verify`, `/test`, `/check review`, `/document`) is suggested by the tier and freely skippable, and `done` is the engineer's to declare, never a status a skill withholds until boxes are ticked. A skipped step is recorded honestly as skipped. The one thing the workflow asks is that a load bearing decision be written down (a spec); even that is flagged, not enforced (an `Assumed` spec never blocks `done`).
- **Every user facing question carries exactly one recommended option** with a one line why (make the call, let them override). The recommendation is the soundest option, not the easiest: correct, then secure, then reliable, then fits the project, then simple (the shared `RECOMMEND` block in each `SKILL.md`). Never a neutral menu, never a cold question, never a silent decision.
- **Keep skills lean.** A skill loads in full on its path every run, so every line is a recurring cost. Cut lines that don't change the agent's behavior, keep the reasoning in the commit or PR (not the skill body), name concepts instead of explaining them, and split out only rare, long content. Full guidance: [`docs/conventions.md`](docs/conventions.md). Run `npm run check` before committing skill edits.

## Layout

- Skills (source, for distribution via `npx skills`): `skills/<name>/SKILL.md`
- Docs: `docs/workflow-guide.md` (what the workflow is and how it works) and `docs/conventions.md` (how to write skills). The "why" behind a change lives in its commit and PR, not a separate decision-record file.

## Skills

See `skills/` for available skills. (This is a fork of `jsmastery-pro/skills`. Consumers install it via `npx skills add ElDeepFull/skills`, which lands them in their agent's skills dir, e.g. `.claude/skills/`.)
