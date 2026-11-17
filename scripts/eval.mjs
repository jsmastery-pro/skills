#!/usr/bin/env node
// Score a workflow run against a fixture. No model is bundled: you name the command.
//
//   node scripts/eval.mjs --fixture brownfield --scenario verify --cmd "claude -p"
//   node scripts/eval.mjs --fixture brownfield --workspace /path/to/produced/project
//
// The command may contain {prompt}; otherwise the prompt is appended as one argument.
// The fixture is copied to a temp directory first, so a run never writes into fixtures/.
// A run is reproducible only as far as the command you name is, which is why the
// deterministic half lives in `npm run fixtures` and this half stays opt in.

import { existsSync, cpSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fixtureNames, loadFixture } from './lib/fixtures.mjs';
import { scoreArtifacts } from './lib/invariants.mjs';

function parseArgs(argv) {
  const args = { keep: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--keep') args.keep = true;
    else if (a.startsWith('--')) args[a.slice(2)] = argv[i + 1] ?? '';
  }
  return args;
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
    console.log('Usage: node scripts/eval.mjs --fixture <name> [--scenario <id>] (--cmd "<command>" | --workspace <dir>) [--keep]');
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
    return report(`Scored ${args.workspace}`, scoreArtifacts(args.workspace, scenario.expect).scored);
  }

  if (!args.cmd) {
    console.error('eval: pass --cmd "<your agent command>" to run the scenario, or --workspace <dir> to score one');
    return 2;
  }

  const workdir = mkdtempSync(join(tmpdir(), `workflow-eval-${args.fixture}-`));
  cpSync(spec.dir, workdir, { recursive: true });
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

  const result = scoreArtifacts(workdir, scenario.expect);
  const code = report(`Scored ${args.fixture}/${scenario.id}`, result.scored);
  if (run.status !== 0) {
    console.error(`\nThe agent command exited with status ${run.status}; the artifacts were scored anyway.`);
  }
  for (const finding of result.findings) console.error(`  ${finding.code} ${finding.file}: ${finding.message}`);

  if (args.keep) console.log(`\nKept: ${workdir}`);
  else rmSync(workdir, { recursive: true, force: true });

  return run.status === 0 ? code : 1;
}

process.exitCode = main();
