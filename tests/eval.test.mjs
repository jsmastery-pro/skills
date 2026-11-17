import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const fixture = (name) => fileURLToPath(new URL(`../fixtures/${name}/`, import.meta.url));

function evalRun(args) {
  return spawnSync(process.execPath, ['scripts/eval.mjs', ...args], { cwd: repo, encoding: 'utf8' });
}

test('scoring the untouched fixture fails only the absolute invariant', () => {
  const run = evalRun(['--fixture', 'brownfield', '--scenario', 'verify', '--workspace', fixture('brownfield')]);
  assert.equal(run.status, 1);
  assert.match(run.stdout, /FAIL\s+evidence_persisted/);
  // The broken billing link is a deliberate fixture defect, not something a run broke.
  assert.match(run.stdout, /PASS\s+specs_linked/);
});

test('a command run scores without crashing and installs the skills', () => {
  const run = evalRun(['--fixture', 'brownfield', '--scenario', 'verify', '--cmd', 'node -e "process.exit(require(\'fs\').existsSync(\'.claude/skills/check/SKILL.md\') ? 0 : 3)"']);
  assert.doesNotMatch(run.stderr, /TypeError/);
  assert.match(run.stdout, /Installed this checkout's skills into \.claude\/skills/);
  assert.doesNotMatch(run.stderr, /exited with status 3/, 'the skills were not in the workspace');
  assert.match(run.stdout, /PASS\s+specs_linked/);
});

test('a skills dir outside the workspace is rejected before anything runs', () => {
  const run = evalRun(['--fixture', 'brownfield', '--cmd', 'node -e 0', '--skills-dir', '../escape']);
  assert.equal(run.status, 2);
  assert.match(run.stderr, /inside the workspace/);
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
