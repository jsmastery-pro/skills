// The four artifact invariants an eval scores. Pure functions over a project
// directory, so a test can call them without running a model.

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { diagnose } from '../doctor.mjs';

export const INVARIANTS = ['scope_file', 'specs_linked', 'contract_present', 'evidence_persisted'];

export function hasMarkdown(dir) {
  if (!existsSync(dir)) return false;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory() && hasMarkdown(p)) return true;
    if (entry.endsWith('.md')) return true;
  }
  return false;
}

const key = (f) => `${f.code}|${f.file}|${f.message}`;

// `baseline` is the doctor's findings on the untouched fixture. A fixture carries
// deliberate defects; an invariant that guards against breakage fails only on a
// finding the run introduced. evidence_persisted stays absolute: after a verify
// run every tick needs its evidence, whoever wrote the tick.
export function scoreArtifacts(dir, invariants = INVARIANTS, baseline = []) {
  const result = diagnose(dir);
  const before = new Set(baseline.map(key));
  const introduced = result.findings.filter((f) => !before.has(key(f)));
  const added = (...codes) => introduced.some((f) => codes.includes(f.code));
  const has = (...codes) => result.findings.some((f) => codes.includes(f.code));
  const base = result.base ? join(result.root, result.base) : null;
  const checks = {
    scope_file: base ? hasMarkdown(join(base, 'scope')) : false,
    specs_linked: !added('D020'),
    contract_present: base ? hasMarkdown(join(base, 'specs')) && !added('D010', 'D011') : false,
    evidence_persisted: !has('D030', 'D031'),
  };
  return {
    result,
    introduced,
    checks,
    scored: Object.fromEntries(invariants.map((name) => [name, Boolean(checks[name])])),
  };
}
