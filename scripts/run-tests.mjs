#!/usr/bin/env node
// Run the unit tests with the Node test runner, discovered rather than globbed so
// the same command works on Windows.
//
// Run: node scripts/run-tests.mjs [extra node --test flags]

import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const dir = fileURLToPath(new URL('../tests/', import.meta.url));
const files = readdirSync(dir)
  .filter((entry) => entry.endsWith('.test.mjs') || entry.endsWith('.test.js'))
  .sort()
  .map((entry) => join(dir, entry));

if (files.length === 0) {
  console.error('run-tests: no tests found in tests/');
  process.exitCode = 1;
} else {
  const run = spawnSync(process.execPath, ['--test', ...process.argv.slice(2), ...files], { stdio: 'inherit' });
  process.exitCode = run.status ?? 1;
}
