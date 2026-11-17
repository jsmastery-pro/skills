# Changelog

## 2.2.0 (2026-11-17)

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

## 2.1.0 (2026-08-09)

Fork baseline: one owner for `done`, batched questions, sound recommendations ranked correct then secure then reliable, decisions recorded in the spec, reference mockup flow, attribution follows the project's Git rule.

## 2.0.0 (upstream)

The `jsmastery-pro/skills` baseline this fork starts from.
