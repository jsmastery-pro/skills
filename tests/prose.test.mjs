import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proseOnly, isExemptTerm } from '../scripts/lib/prose.mjs';

test('prose keeps a plain compound word visible to the rule', () => {
  assert.match(proseOnly('The read-only view is fine.'), /read-only/);
});

test('an inline code span is masked', () => {
  assert.doesNotMatch(proseOnly('Run `read-only` first.'), /read-only/);
});

test('a fenced block is masked', () => {
  assert.doesNotMatch(proseOnly('```\nread-only\n```\n'), /read-only/);
});

test('a markdown link target is masked', () => {
  assert.doesNotMatch(proseOnly('[docs](https://example.com/read-only)'), /read-only/);
});

test('the description stays prose while frontmatter keys are masked', () => {
  const fm = '---\nname: read-only-tool\ndescription: "read-only is a word here"\n---\n';
  const masked = proseOnly(fm);
  assert.doesNotMatch(masked, /read-only-tool/);
  assert.match(masked, /read-only/);
});

test('exempt terms are the named literals and ALL CAPS', () => {
  assert.equal(isExemptTerm('CI-CD'), true);
  assert.equal(isExemptTerm('in-progress'), true);
  assert.equal(isExemptTerm('read-only'), false);
});
