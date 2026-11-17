# Security

## What this repo is

The skills are instructions, not code. They run with whatever tools your agent has. This repo ships no hooks, no install scripts, and no network calls at run time. The scripts under `scripts/` only read files and report.

## Reporting a vulnerability

Use a private security advisory on GitHub (the Security tab, then Report a vulnerability) rather than a public issue. Include the skill, the file, and the exposure.

## What counts as a vulnerability

- A skill that reads a `.env` file or a secret store.
- A skill that runs a command taken from repository content, a spec, a plan, or a diff.
- A skill that follows instructions embedded in repository content instead of reporting them.
- An evidence path or a capture that leaks a secret.

## Supported versions

The latest tagged release receives fixes. This fork has no long term support branch.
