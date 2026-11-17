# Contributing

Thanks for helping. This repo is a fork of `jsmastery-pro/skills`. The workflow is described in [docs/workflow-guide.md](docs/workflow-guide.md), and the rules a skill edit must meet are in [docs/conventions.md](docs/conventions.md). Read the conventions first: they are the review bar.

## Before you open a pull request

1. `npm run check` passes, with no new warning above 90% of a budget.
2. `npm run fixtures` passes.
3. `npm run test:unit` passes.
4. If the change alters what a skill does, add or adjust a scenario in `fixtures/<name>/fixture.json`. A behavior change with no fixture cannot be reviewed, because there is nothing to compare it against.
5. `npm test` runs the first three together.

## What gets merged

- An edit that removes a line it replaces, not a rewrite around it.
- No new skill unless it covers a phase the nine do not. The suite is small on purpose.
- No content that loads on every run unless it changes what the agent does. Rare and long material goes in a file the skill reads only when the case arises.
- Plain words, no dashes, exactly one recommended option per question, and suggestions before gates.

## Releasing

1. Bump `version` in `package.json` and add its section to `CHANGELOG.md`.
2. Run `npm test`.
3. Commit, then tag and push the tag: `git tag -a v2.2.0 -m "v2.2.0"` then `git push origin v2.2.0`. A team pins to the tag; `main` is not a release.

## Reporting a problem

Open an issue with the skill, the input, and what you expected. If the workflow produced a wrong artifact, attach the file. Never attach a secret.
