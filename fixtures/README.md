# Fixtures

Small projects the workflow can be pointed at. They exist so a skill change can be
checked against something other than its own prose.

- `npm run fixtures` runs the deterministic checks: `doctor` on each fixture, compared
  with the codes its `fixture.json` expects.
- `npm run eval -- --fixture brownfield --scenario verify --cmd "<your agent command>"`
  copies the fixture to a temp directory, runs the scenario prompt, then scores the
  artifacts the agent produced (`scope_file`, `specs_linked`, `contract_present`,
  `evidence_persisted`).

`greenfield` starts with no scope. `brownfield` carries one broken spec link, one spec
with no acceptance criteria, one legacy status, and one ticked verification with no
evidence. `monorepo` has two workspaces and one missing `verify.md`. The defects are
deliberate: they are what the checks must find, and what an eval run must not add.
