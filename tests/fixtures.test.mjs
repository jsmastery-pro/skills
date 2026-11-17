import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixtureNames, checkFixture } from '../scripts/lib/fixtures.mjs';

test('every fixture produces exactly the findings it declares', () => {
  const names = fixtureNames();
  assert.ok(names.length >= 3, 'expected at least three fixtures');
  for (const name of names) {
    const result = checkFixture(name);
    assert.ok(
      result.ok,
      `${name}: problems ${JSON.stringify(result.problems)} missing ${result.missing} unexpected ${result.unexpected}`
    );
  }
});

test('the brownfield fixture still carries the defects it was built for', () => {
  assert.deepEqual(checkFixture('brownfield').actual, ['D010', 'D011', 'D012', 'D020', 'D030', 'D050']);
});

test('the monorepo fixture still misses one verify.md', () => {
  assert.deepEqual(checkFixture('monorepo').actual, ['D032']);
});
