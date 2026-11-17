import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { diagnose } from '../scripts/doctor.mjs';

const AGENTS = '# AGENTS.md\n\n## Stack\n\n- Node 20.\n';

function project(files) {
  const root = mkdtempSync(join(tmpdir(), 'doctor-test-'));
  for (const [rel, content] of Object.entries(files)) {
    const path = join(root, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  return root;
}

function codes(root) {
  return [...new Set(diagnose(root).findings.map((f) => f.code))].sort();
}

const spec = (status = 'Decided', body = '### AC-1\n\nA person signs in.\n') =>
  `# 0001 Auth\n\n**Status**: ${status}\n\n## Requirements\n\n${body}`;

const scope = (link, verifyBox = false) =>
  `# Scope\n\n- [x] Design it (spec): \`${link}\`\n${verifyBox ? '- [ ] Verify it: /check verify auth\n' : ''}`;

const verify = (evidence) =>
  `# Verify\n\n- [x] Sign in → AC-1\n${evidence === null ? '' : `\n## Evidence\n\n${evidence}\n`}`;

function run(t, files) {
  const root = project(files);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('a clean project has no findings', (t) => {
  const root = run(t, {
    'AGENTS.md': AGENTS,
    'docs/scope/scope.md': scope('docs/specs/0001-auth/index.md', true),
    'docs/specs/0001-auth/index.md': spec(),
    'docs/specs/0001-auth/verify.md': verify('- AC-1 → docs/reviews/auth/verify/after.png'),
  });
  assert.deepEqual(codes(root), []);
});

test('an empty project reports D000 and keeps the AGENTS.md requirement quiet', (t) => {
  const root = run(t, { 'AGENTS.md': AGENTS });
  assert.deepEqual(codes(root), ['D000']);
});

test('a project with no AGENTS.md reports D040', (t) => {
  const root = run(t, {
    'docs/scope/scope.md': scope('docs/specs/0001-auth.md'),
    'docs/specs/0001-auth.md': spec(),
  });
  assert.deepEqual(codes(root), ['D040']);
});

test('a spec with no Status reports D002', (t) => {
  const root = run(t, {
    'AGENTS.md': AGENTS,
    'docs/specs/0001-auth.md': '# 0001 Auth\n\n## Requirements\n\n### AC-1\n\nThing.\n',
  });
  assert.ok(codes(root).includes('D002'));
});

test('an unknown status reports D003', (t) => {
  const root = run(t, {
    'AGENTS.md': AGENTS,
    'docs/specs/0001-auth.md': spec('Done'),
  });
  assert.ok(codes(root).includes('D003'));
});

test('a legacy status reports D050', (t) => {
  const root = run(t, {
    'AGENTS.md': AGENTS,
    'docs/specs/0001-auth.md': spec('Proposed'),
  });
  assert.ok(codes(root).includes('D050'));
});

test('a spec with no Requirements and no criterion reports D010 and D011', (t) => {
  const root = run(t, {
    'AGENTS.md': AGENTS,
    'docs/specs/0001-auth.md': '# 0001 Auth\n\n**Status**: Decided\n\n## Decision\n\nDo it.\n',
  });
  const found = codes(root);
  assert.ok(found.includes('D010'));
  assert.ok(found.includes('D011'));
});

test('a repeated criterion reports D012', (t) => {
  const root = run(t, {
    'AGENTS.md': AGENTS,
    'docs/specs/0001-auth.md': spec('Decided', '### AC-1\n\nOne.\n\n### AC-1\n\nAgain.\n'),
  });
  assert.ok(codes(root).includes('D012'));
});

test('a scope link to a missing spec reports D020', (t) => {
  const root = run(t, {
    'AGENTS.md': AGENTS,
    'docs/scope/scope.md': scope('docs/specs/0002-billing.md'),
    'docs/specs/0001-auth.md': spec(),
  });
  assert.ok(codes(root).includes('D020'));
});

test('ticked steps with no Evidence section report D030', (t) => {
  const root = run(t, {
    'AGENTS.md': AGENTS,
    'docs/specs/0001-auth.md': spec(),
    'docs/specs/verify.md': verify(null),
  });
  assert.ok(codes(root).includes('D030'));
});

test('an empty Evidence section reports D031', (t) => {
  const root = run(t, {
    'AGENTS.md': AGENTS,
    'docs/specs/0001-auth.md': spec(),
    'docs/specs/verify.md': verify('<!-- filled later -->'),
  });
  assert.ok(codes(root).includes('D031'));
});

test('a Verify it box with no verify.md reports D032', (t) => {
  const root = run(t, {
    'AGENTS.md': AGENTS,
    'docs/scope/scope.md': scope('docs/specs/0001-auth/index.md', true),
    'docs/specs/0001-auth/index.md': spec(),
  });
  assert.ok(codes(root).includes('D032'));
});

test('the doctor never changes a file', (t) => {
  const root = run(t, {
    'AGENTS.md': AGENTS,
    'docs/specs/0001-auth.md': '# 0001 Auth\n',
  });
  const before = codes(root);
  diagnose(root);
  assert.deepEqual(codes(root), before);
});
