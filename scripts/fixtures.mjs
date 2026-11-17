#!/usr/bin/env node
// Deterministic fixture checks. No model, no network, no API key.
//
// Run: node scripts/fixtures.mjs [--list]
//
// Each fixture declares the doctor codes it must produce. A fixture that stops
// producing them means the doctor stopped finding a real defect; a new code means
// the fixture drifted. Either way the build fails, which is the point.

import { fixtureNames, loadFixture, checkFixture } from './lib/fixtures.mjs';

function main() {
  const args = process.argv.slice(2);
  const names = fixtureNames();

  if (args.includes('--list')) {
    for (const name of names) {
      const spec = loadFixture(name);
      console.log(`${name}: ${spec.description}`);
      for (const scenario of spec.scenarios) console.log(`  ${scenario.id}: ${scenario.prompt}`);
    }
    return 0;
  }

  let failed = 0;
  for (const name of names) {
    const result = checkFixture(name);
    if (result.ok) {
      console.log(`PASS ${name}: ${result.expected.length ? result.expected.join(' ') : 'no finding expected'}`);
      continue;
    }
    failed += 1;
    console.error(`FAIL ${name}`);
    for (const problem of result.problems) console.error(`  - ${problem}`);
    if (result.missing?.length) console.error(`  expected but not found: ${result.missing.join(' ')}`);
    if (result.unexpected?.length) console.error(`  found but not expected: ${result.unexpected.join(' ')}`);
  }

  console.log(`\n${names.length - failed}/${names.length} fixtures passed.`);
  return failed === 0 ? 0 : 1;
}

process.exitCode = main();
