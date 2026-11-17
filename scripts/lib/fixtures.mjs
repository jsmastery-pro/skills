// Load and check the fixture projects. Shared by the CLI runner and the tests.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { diagnose } from '../doctor.mjs';
import { INVARIANTS } from './invariants.mjs';

export const FIXTURES_DIR = fileURLToPath(new URL('../../fixtures/', import.meta.url));

export function fixtureNames() {
  return readdirSync(FIXTURES_DIR)
    .filter((entry) => {
      const dir = join(FIXTURES_DIR, entry);
      return statSync(dir).isDirectory() && existsSync(join(dir, 'fixture.json'));
    })
    .sort();
}

export function loadFixture(name) {
  const dir = join(FIXTURES_DIR, name);
  const path = join(dir, 'fixture.json');
  if (!existsSync(path)) return null;
  const spec = JSON.parse(readFileSync(path, 'utf8'));
  spec.dir = dir;
  return spec;
}

export function validateFixture(name, spec) {
  const problems = [];
  if (spec.name !== name) problems.push(`fixture.json name "${spec.name}" does not match its directory "${name}"`);
  if (!Array.isArray(spec.expectedFindings)) problems.push('expectedFindings must be an array');
  if (!Array.isArray(spec.scenarios) || spec.scenarios.length === 0) problems.push('scenarios must be a non-empty array');
  for (const scenario of spec.scenarios ?? []) {
    if (!scenario.id) problems.push('a scenario has no id');
    if (!scenario.prompt) problems.push(`scenario ${scenario.id} has no prompt`);
    for (const invariant of scenario.expect ?? []) {
      if (!INVARIANTS.includes(invariant)) problems.push(`scenario ${scenario.id} expects unknown invariant "${invariant}"`);
    }
  }
  return problems;
}

export function checkFixture(name) {
  const spec = loadFixture(name);
  if (!spec) return { name, ok: false, problems: [`no fixture.json in fixtures/${name}`] };
  const problems = validateFixture(name, spec);
  if (problems.length > 0) return { name, ok: false, problems };

  const result = diagnose(spec.dir);
  const actual = [...new Set(result.findings.map((f) => f.code))].sort();
  const expected = [...new Set(spec.expectedFindings)].sort();
  const missing = expected.filter((code) => !actual.includes(code));
  const unexpected = actual.filter((code) => !expected.includes(code));
  return {
    name,
    ok: missing.length === 0 && unexpected.length === 0,
    problems: [],
    expected,
    actual,
    missing,
    unexpected,
  };
}
