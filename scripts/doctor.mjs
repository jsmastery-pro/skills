#!/usr/bin/env node
// Artifact doctor for a project that uses the workflow.
// Report only: it never edits a file.
//
// Run: node scripts/doctor.mjs [projectDir] [--json] [--strict]
//
// Codes:
//   D000  no docs or .workflow directory, nothing to check
//   D001  specs exist but no scope file
//   D002  a spec has no **Status**: line
//   D003  a spec status is not a known value
//   D010  a spec has no acceptance criteria (AC-N)
//   D011  a spec has no ## Requirements section
//   D012  a spec defines the same acceptance criterion id twice
//   D020  a scope file links a spec path that does not exist
//   D030  verify.md has ticked steps but no ## Evidence section
//   D031  verify.md has a ## Evidence section with no entries
//   D032  a scope feature has a Verify it box but its spec has no verify.md yet
//   D040  no AGENTS.md at the project root
//   D050  legacy spec status (Proposed / In Progress / Accepted)
//   D099  a file could not be read
//
// Every finding is a signal for the engineer. Nothing is corrected, and the exit
// code is 0 unless --strict is passed and a finding is at error level.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

const KNOWN_STATUS = new Set(['Draft', 'Decided', 'Assumed']);
const LEGACY_STATUS = new Set(['Proposed', 'In Progress', 'Accepted']);
const ERROR_CODES = new Set(['D020', 'D040']);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const p = join(dir, entry);
    let s;
    try {
      s = statSync(p);
    } catch {
      continue;
    }
    if (s.isDirectory()) walk(p, out);
    else if (entry.endsWith('.md')) out.push(p);
  }
  return out;
}

function read(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function baseDir(root) {
  if (existsSync(join(root, '.workflow'))) return join(root, '.workflow');
  if (existsSync(join(root, 'docs'))) return join(root, 'docs');
  return null;
}

// A spec is a flat `NNNN-name.md` or the `index.md` of a spec directory. The
// other files /develop puts in that directory (rationale.md, verify.md) are not.
const NOT_SPEC = new Set(['verify.md', 'rationale.md']);
function isSpec(path) {
  const name = path.split(/[\\/]/).pop();
  if (NOT_SPEC.has(name)) return false;
  return name === 'index.md' || !existsSync(join(dirname(path), 'index.md'));
}

// An acceptance criterion is defined in ## Requirements, as a heading (`### AC-1`)
// or a list item (`- **AC-1**:`). Mentions elsewhere (test scenarios, build plan
// tasks) reference it and are expected to repeat.
function definedCriteria(text) {
  const start = text.search(/^##\s+Requirements\b.*$/m);
  if (start === -1) return [];
  const rest = text.slice(start).replace(/^.*\n?/, '');
  const end = rest.search(/^##\s/m);
  const section = end === -1 ? rest : rest.slice(0, end);
  return [...section.matchAll(/^\s*(?:#{2,6}\s+|[-*]\s+\*\*)AC-(\d+)\b/gm)].map((m) => m[1]);
}

// A scope file is a list of features, each under its own heading. Split it so a
// Verify it box is read against the spec of its own feature only.
function featureBlocks(text) {
  return text.split(/^(?=#{1,6}\s)/m);
}

function scopeLinks(scopeFile, text) {
  const targets = new Set();
  for (const m of text.matchAll(/`([^`\n]*\/[^`\n]*\.md)`/g)) targets.add(m[1]);
  for (const m of text.matchAll(/\]\(([^)\n]+\.md)\)/g)) targets.add(m[1]);
  return [...targets].filter((t) => t.includes('specs/'));
}

function resolveTarget(root, scopeFile, target) {
  if (isAbsolute(target)) return target;
  const fromRoot = join(root, target);
  if (existsSync(fromRoot)) return fromRoot;
  return resolve(dirname(scopeFile), target);
}

export function diagnose(rootInput = process.cwd()) {
  const root = resolve(rootInput);
  const findings = [];
  const add = (code, file, message) =>
    findings.push({ code, level: ERROR_CODES.has(code) ? 'error' : ['D000', 'D050', 'D032'].includes(code) ? 'info' : 'warn', file, message });

  const base = baseDir(root);
  if (!base) {
    add('D000', '.', 'no docs or .workflow directory, so there is no scope or spec to check');
    if (!existsSync(join(root, 'AGENTS.md'))) {
      add('D040', 'AGENTS.md', 'no AGENTS.md at the project root; run /audit so every skill has your project context');
    }
    return { root, base: null, findings };
  }

  const scopeFiles = walk(join(base, 'scope'));
  const specFiles = walk(join(base, 'specs')).filter(isSpec);

  if (specFiles.length > 0 && scopeFiles.length === 0) {
    add('D001', relative(root, join(base, 'scope')), 'specs exist but there is no scope file to point at them');
  }
  if (scopeFiles.length === 0 && specFiles.length === 0) {
    add('D000', relative(root, base), 'no scope and no spec yet, so there is nothing to check');
  }
  if (!existsSync(join(root, 'AGENTS.md'))) {
    add('D040', 'AGENTS.md', 'no AGENTS.md at the project root; run /audit so every skill has your project context');
  }

  // Scope files must point at specs that exist.
  for (const scopeFile of scopeFiles) {
    const text = read(scopeFile);
    if (text === null) {
      add('D099', relative(root, scopeFile), 'could not read this file');
      continue;
    }
    for (const target of scopeLinks(scopeFile, text)) {
      const resolved = resolveTarget(root, scopeFile, target);
      if (!existsSync(resolved)) {
        add('D020', relative(root, scopeFile), `links ${target}, which does not exist`);
      }
    }
    // A feature that promises Verify it needs the checklist verify reads.
    for (const block of featureBlocks(text)) {
      if (!/^\s*-\s*\[[ x]\]\s*Verify it/im.test(block)) continue;
      for (const target of scopeLinks(scopeFile, block)) {
        const resolved = resolveTarget(root, scopeFile, target);
        if (!existsSync(resolved)) continue;
        const isDir = statSync(resolved).isDirectory();
        const specDir = isDir ? resolved : dirname(resolved);
        if (!isDir && !resolved.endsWith('index.md')) {
          add('D032', relative(root, scopeFile), `has a Verify it box but ${target} is a single file spec with no verify.md yet; /develop adds one when it saves the verify steps`);
        } else if (!existsSync(join(specDir, 'verify.md'))) {
          add('D032', relative(root, scopeFile), `has a Verify it box but ${relative(root, join(specDir, 'verify.md'))} does not exist`);
        }
      }
    }
  }

  for (const specFile of specFiles) {
    const text = read(specFile);
    if (text === null) {
      add('D099', relative(root, specFile), 'could not read this file');
      continue;
    }
    const rel = relative(root, specFile);
    const status = text.match(/\*\*Status\*\*:\s*([^\n]+)/);
    if (!status) {
      add('D002', rel, 'no Status line, so nobody knows if the decision is settled');
    } else {
      const value = status[1].trim();
      if (LEGACY_STATUS.has(value)) {
        add('D050', rel, `legacy status "${value}" reads as Decided; update it when the file is next touched`);
      } else if (!KNOWN_STATUS.has(value)) {
        add('D003', rel, `status "${value}" is not one of Draft, Decided, Assumed`);
      }
    }
    if (!/^##\s+Requirements/m.test(text)) {
      add('D011', rel, 'no ## Requirements section, so there are no acceptance criteria to verify against');
    }
    const ids = definedCriteria(text);
    if (ids.length === 0) {
      add('D010', rel, 'no AC-N acceptance criterion defined under ## Requirements; /check verify has no contract to check');
    } else {
      const seen = new Set();
      const dupes = new Set();
      for (const id of ids) {
        if (seen.has(id)) dupes.add(id);
        seen.add(id);
      }
      if (dupes.size > 0) {
        add('D012', rel, `defines acceptance criterion ${[...dupes].map((d) => `AC-${d}`).join(', ')} more than once`);
      }
    }
  }

  // verify.md: ticks need evidence behind them.
  for (const verifyFile of walk(join(base, 'specs')).filter((p) => p.endsWith('verify.md'))) {
    const text = read(verifyFile);
    if (text === null) {
      add('D099', relative(root, verifyFile), 'could not read this file');
      continue;
    }
    const rel = relative(root, verifyFile);
    const ticked = /^\s*-\s*\[x\]/im.test(text);
    if (!ticked) continue;
    const heading = text.match(/^##\s+Evidence\s*$/m);
    if (!heading) {
      add('D030', rel, 'has ticked steps but no ## Evidence section, so the ticks are claims');
      continue;
    }
    const body = text.slice(heading.index + heading[0].length)
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/^#.*$/gm, '')
      .trim();
    if (body.length === 0) {
      add('D031', rel, 'has a ## Evidence section with no entries behind the ticks');
    }
  }

  return { root, base: relative(root, base), findings };
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const strict = args.includes('--strict');
  const dir = args.find((a) => !a.startsWith('--')) ?? process.cwd();

  if (!existsSync(dir)) {
    console.error(`doctor: ${dir} does not exist`);
    return 2;
  }

  const result = diagnose(dir);
  const counts = result.findings.reduce(
    (acc, f) => ({ ...acc, [f.level]: (acc[f.level] ?? 0) + 1 }),
    { info: 0, warn: 0, error: 0 }
  );

  if (json) {
    console.log(JSON.stringify({ ...result, counts }, null, 2));
  } else {
    console.log(`doctor: ${result.root}${result.base ? ` (artifacts in ${result.base})` : ''}`);
    if (result.findings.length === 0) {
      console.log('  no findings. Scope, specs, and evidence agree.');
    }
    const order = { error: 0, warn: 1, info: 2 };
    for (const f of [...result.findings].sort((a, b) => order[a.level] - order[b.level] || a.code.localeCompare(b.code))) {
      console.log(`  ${f.code}  ${f.level.padEnd(5)}  ${f.file}: ${f.message}`);
    }
    console.log(`\n${result.findings.length} finding(s): ${counts.error} error, ${counts.warn} warning, ${counts.info} info.`);
    console.log('Report only: nothing was changed.');
  }

  return strict && counts.error > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
