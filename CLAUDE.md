# Project: Engineering Workflow Skills

A collection of Claude Code skills encoding a phase based engineering workflow. No mandated playbook: you run whichever skills a change needs, in whatever order fits. `/scope` recommends a workflow tier (`Vibe`/`Lean`/`Medium`/`Full`, how much verification a project or feature warrants), but it is a default you override per feature, never a forced track.

## Conventions every skill follows

- **The engineer decides; the AI recommends.** Any AI initiated verification or critique (e.g. `/architect`'s cross model spec check) is *offered*, never run or skipped on the engineer's behalf. Whatever such a check finds, a gap, a load bearing decision, a fix, is *surfaced to the engineer to decide*, never silently resolved or auto applied. A check the engineer invokes directly (`/check verify`, `/check review`) is already their choice to run, and still reports rather than auto fixes.
- **Every user facing question carries exactly one recommended option** with a one line why (make the call, let them override). Never a neutral menu, never a cold question, never a silent decision.

## Stack

- Skills (source, for distribution via `npx skills`): `skills/<name>/SKILL.md`
- Decision records: `docs/specs/`

## Skills

See `skills/` for available skills. (Consumers install them via `npx skills add JavaScript-Mastery-Pro/skills`, which lands them in their agent's skills dir, e.g. `.claude/skills/`.)

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.
