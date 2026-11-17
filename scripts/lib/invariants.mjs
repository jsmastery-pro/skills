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

export function scoreArtifacts(dir, invariants = INVARIANTS) {
  const result = diagnose(dir);
  const codes = new Set(result.findings.map((f) => f.code));
  const base = result.base ? join(result.root, result.base) : null;
  const checks = {
    scope_file: base ? hasMarkdown(join(base, 'scope')) : false,
    specs_linked: !codes.has('D020'),
    contract_present: base ? hasMarkdown(join(base, 'specs')) && !codes.has('D010') && !codes.has('D011') : false,
    evidence_persisted: !codes.has('D030') && !codes.has('D031'),
  };
  return {
    result,
    checks,
    scored: Object.fromEntries(invariants.map((name) => [name, Boolean(checks[name])])),
  };
}
