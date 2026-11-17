import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const fixture = (name) => fileURLToPath(new URL(`../fixtures/${name}/`, import.meta.url));

function evalRun(args) {
  return spawnSync(process.execPath, ['scripts/eval.mjs', ...args], { cwd: repo, encoding: 'utf8' });
}

test('scoring a defective workspace exits 1 and names the invariant', () => {
  const run = evalRun(['--fixture', 'brownfield', '--scenario', 'verify', '--workspace', fixture('brownfield')]);
  assert.equal(run.status, 1);
  assert.match(run.stdout, /FAIL\s+evidence_persisted/);
  assert.match(run.stdout, /FAIL\s+specs_linked/);
});

test('scoring a passing workspace exits 0', () => {
  const run = evalRun(['--fixture', 'monorepo', '--scenario', 'develop', '--workspace', fixture('monorepo')]);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /PASS\s+contract_present/);
});

test('an unknown fixture is rejected without running anything', () => {
  const run = evalRun(['--fixture', 'nope', '--workspace', fixture('brownfield')]);
  assert.equal(run.status, 2);
  assert.match(run.stderr, /unknown fixture/);
});
