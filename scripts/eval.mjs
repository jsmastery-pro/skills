#!/usr/bin/env node
// Score a workflow run against a fixture. No model is bundled: you name the command.
//
//   node scripts/eval.mjs --fixture brownfield --scenario verify --cmd "claude -p"
//   node scripts/eval.mjs --fixture brownfield --workspace /path/to/produced/project
//
// The command may contain {prompt}; otherwise the prompt is appended as one argument.
// The fixture is copied to a temp directory first, so a run never writes into fixtures/,
// and this repo's skills/ are installed into it (`--skills-dir`, default .claude/skills;
// `none` to skip), so the run exercises the skills in this checkout, not whatever the
// machine has installed.
// Scores are relative to the fixture: its deliberate defects do not count against a
// run, only what the run introduced (evidence_persisted excepted, see invariants.mjs).
// A run is reproducible only as far as the command you name is, which is why the
// deterministic half lives in `npm run fixtures` and this half stays opt in.

import { existsSync, cpSync, mkdtempSync, rmSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fixtureNames, loadFixture } from './lib/fixtures.mjs';
import { scoreArtifacts } from './lib/invariants.mjs';
import { diagnose } from './doctor.mjs';

const SKILLS_SRC = fileURLToPath(new URL('../skills/', import.meta.url));

function parseArgs(argv) {
  const args = { keep: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--keep') args.keep = true;
    else if (a.startsWith('--')) args[a.slice(2)] = argv[i + 1] ?? '';
  }
  return args;
}

function printIntroduced(introduced) {
  for (const f of introduced) console.error(`  new ${f.code} ${f.file}: ${f.message}`);
}

function report(label, scored) {
  const entries = Object.entries(scored);
  console.log(`\n${label}`);
  for (const [name, pass] of entries) console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}`);
  return entries.every(([, pass]) => pass) ? 0 : 1;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.fixture) {
    console.log('Usage: node scripts/eval.mjs --fixture <name> [--scenario <id>] (--cmd "<command>" [--skills-dir <dir>|none] | --workspace <dir>) [--keep]');
    console.log('Fixtures: ' + fixtureNames().join(', '));
    return 0;
  }

  const spec = loadFixture(args.fixture);
  if (!spec) {
    console.error(`eval: unknown fixture "${args.fixture}". Known: ${fixtureNames().join(', ')}`);
    return 2;
  }

  const scenario = spec.scenarios.find((s) => s.id === args.scenario) ?? (args.scenario ? null : spec.scenarios[0]);
  if (!scenario) {
    console.error(`eval: unknown scenario "${args.scenario}". Known: ${spec.scenarios.map((s) => s.id).join(', ')}`);
    return 2;
  }

  if (args.workspace) {
    if (!existsSync(args.workspace)) {
      console.error(`eval: ${args.workspace} does not exist`);
      return 2;
    }
    const scored = scoreArtifacts(args.workspace, scenario.expect, diagnose(spec.dir).findings);
    const code = report(`Scored ${args.workspace} against fixture ${args.fixture}`, scored.scored);
    printIntroduced(scored.introduced);
    return code;
  }

  if (!args.cmd) {
    console.error('eval: pass --cmd "<your agent command>" to run the scenario, or --workspace <dir> to score one');
    return 2;
  }

  const skillsDir = args['skills-dir'] ?? '.claude/skills';
  if (skillsDir !== 'none' && (isAbsolute(skillsDir) || skillsDir.split(/[\\/]/).includes('..'))) {
    console.error('eval: --skills-dir must be a path inside the workspace, or none');
    return 2;
  }

  const workdir = mkdtempSync(join(tmpdir(), `workflow-eval-${args.fixture}-`));
  cpSync(spec.dir, workdir, { recursive: true });
  const baseline = diagnose(workdir).findings;
  if (skillsDir !== 'none') {
    cpSync(SKILLS_SRC, join(workdir, skillsDir), { recursive: true });
    console.log(`Installed this checkout's skills into ${skillsDir}`);
  }
  const prompt = scenario.prompt;
  const command = args.cmd.includes('{prompt}')
    ? args.cmd.replaceAll('{prompt}', JSON.stringify(prompt))
    : `${args.cmd} ${JSON.stringify(prompt)}`;

  console.log(`Running "${command}" in ${workdir}`);
  const run = spawnSync(command, {
    cwd: workdir,
    shell: true,
    stdio: 'inherit',
    timeout: 15 * 60 * 1000,
    env: { ...process.env, WORKFLOW_PROMPT: prompt, WORKFLOW_FIXTURE: args.fixture },
  });

  const result = scoreArtifacts(workdir, scenario.expect, baseline);
  const code = report(`Scored ${args.fixture}/${scenario.id}`, result.scored);
  if (run.status !== 0) {
    console.error(`\nThe agent command exited with status ${run.status}; the artifacts were scored anyway.`);
  }
  printIntroduced(result.introduced);

  if (args.keep) console.log(`\nKept: ${workdir}`);
  else rmSync(workdir, { recursive: true, force: true });

  return run.status === 0 ? code : 1;
}

process.exitCode = main();
