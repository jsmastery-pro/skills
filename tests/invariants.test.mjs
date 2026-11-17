import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { scoreArtifacts } from '../scripts/lib/invariants.mjs';

const fixture = (name) => fileURLToPath(new URL(`../fixtures/${name}/`, import.meta.url));

test('a fixture with a broken link and unproven ticks fails those invariants', () => {
  const { scored } = scoreArtifacts(fixture('brownfield'));
  assert.equal(scored.specs_linked, false);
  assert.equal(scored.evidence_persisted, false);
  assert.equal(scored.scope_file, true);
});

test('a fixture with evidence behind its ticks passes every invariant', () => {
  const { scored } = scoreArtifacts(fixture('monorepo'));
  assert.deepEqual(scored, {
    scope_file: true,
    specs_linked: true,
    contract_present: true,
    evidence_persisted: true,
  });
});

test('a greenfield fixture has no scope yet', () => {
  const { scored } = scoreArtifacts(fixture('greenfield'));
  assert.equal(scored.scope_file, false);
  assert.equal(scored.specs_linked, true);
});

test('scoring can be limited to the invariants a scenario names', () => {
  const { scored } = scoreArtifacts(fixture('greenfield'), ['scope_file']);
  assert.deepEqual(Object.keys(scored), ['scope_file']);
  assert.equal(scored.scope_file, false);
});
