import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));

test('the portability check passes on this repo', () => {
  const run = spawnSync(process.execPath, ['scripts/check-portability.mjs'], { cwd: repo, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /Portability check passed/);
});
