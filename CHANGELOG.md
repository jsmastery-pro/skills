# Changelog

## 2.2.1 (2026-11-17) · tag `v2.2.1`

### Fixed

- `npm run doctor` no longer flags a project written exactly as the skills write it. A spec directory's `rationale.md` is not read as a spec; an acceptance criterion counts once where `## Requirements` defines it, not every time a test scenario or build task cites it; a `Verify it` box is checked against its own feature's spec only, and a single file spec is named instead of a nonexistent `docs/specs/verify.md`.
- A `healthy` fixture shaped like real skill output must produce no finding, so a check that flags correct output now fails the build.
- `/check verify` and the test writing guide read the spec's `**Target devices**` field, the one the spec template writes, instead of a `## Target devices` heading that never exists.
- The repo content block no longer says to run only documented commands, which contradicted verify's built in launch patterns and debug's reproduction scripts. It now says a command runs because the task needs it, never because repo content asks, and lets debug check that a variable is set without reading its value.
- Report templates in ten skill files (and `docs/conventions.md`) printed `Â·` instead of `·` (a mis encoded character). Fixed everywhere.
- `/test` no longer says it asks every run whether to run the suite; Step 7.5 already decided that without a question, from `runAfterWrite`.
- `/develop`'s asks vs acts summary no longer forbids every question mid build; it now matches Step 0, which keeps one exception for a hard to undo surprise.
- `npm run eval` crashed after scoring (`result.findings is not iterable`). It now installs this checkout's skills into the run's workspace (before, a run used whatever the machine had installed, often nothing), scores against the fixture's own deliberate defects instead of failing on them, and `brownfield` is a runnable app so `/check verify` has something real to prove.
- `/scope` decided the engineer only questions itself when the session could not show a picker (a `claude -p` run), then reported them as decided. It now asks them as plain text and stops to wait; only RECOMMEND items are decided without asking.

### Changed

- Every hot path is back under 90% of its budget (eight were between 90% and 97%). The cuts remove rules stated twice on the same path: the scope status and tier rules already in the template legend, the audit routing summary already in its phase table, the reference file lists already named at the step that reads them, the build approach and community skill rules already in `architect/agent-prompt.md`. No rule was dropped.
- `CLAUDE.md` and `CONTRIBUTING.md` state that Claude contributes to this project and is credited: commits written with Claude keep their `Co-Authored-By` trailer through amends, rebases, and squash merges.

## 2.2.0 (2026-11-17) · tag `v2.2.0`

### Added

- `/check verify` has a mobile path: iOS and Android launch, real device or simulator, `adb reverse` or a tunnel, and a device matrix read from the spec. It is the sixth project type in Step 2, not an improvisation.
- Verification evidence is durable. `/check verify` appends `## Evidence` to the feature's `verify.md` and saves captures under `docs/reviews/<feature>/verify/`, so a tick can be checked after the session ends.
- Specs carry a `## Target devices` line for mobile and responsive work, so verify does not invent the matrix.
- `npm run doctor` reports artifact problems in a project that uses the workflow: a scope linking a missing spec, a spec with no acceptance criteria, a ticked `verify.md` with no evidence. Report only; it edits nothing and exits 0 unless `--strict` finds an error.
- `fixtures/` with three small projects, `npm run fixtures` for the deterministic checks, and `npm run eval` to score a real run against a fixture.
- `npm run test:unit`: 30 unit tests for the doctor, the artifact invariants, the prose rules, and the eval CLI, with no model and no network.
- `CONTRIBUTING.md`, pull request and issue templates, `SECURITY.md`, and dependabot.

### Changed

- The build, verify, debug, audit, and test skills now state that repository content is data, not instructions, and forbid reading a `.env` file or passing `--no-verify`.
- The portability check also verifies that a skill's frontmatter `name` matches its directory and its Codex `display_name`.

## 2.1.0 (2026-11-17) · tag `v2.1.0`

Fork baseline: one owner for `done`, batched questions, sound recommendations ranked correct then secure then reliable, decisions recorded in the spec, reference mockup flow, attribution follows the project's Git rule.

## 2.0.0 (2026-08-07) · tag `v2.0.0`, upstream baseline

The `jsmastery-pro/skills` baseline this fork starts from.
