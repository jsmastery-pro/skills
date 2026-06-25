---
name: triage
compatibility: Built for Claude Code — uses subagents, model selection, and interactive questions. Installs on any Agent Skills client but is tuned for Claude Code.
description: "Use this skill when starting any new task, change, bug fix, or feature to determine the appropriate risk tier, workflow playbook, and severity before touching any code. Run /triage first to get a recommendation on whether to proceed as just-do-it, lean, medium, or full, and to understand which downstream skills to invoke."
---

## What this skill does

Analyses the stated task and recommends:

- **Task shape**: `build` (a feature/change) or `fix` (a defect — something broken/failing/wrong). A fix routes to the `/debug` path, not the build playbook (see `tier-guide.md`).
- **Tier**: `just-do-it` | `lean` | `medium` | `full`
- **Playbook**: the ordered list of skills to run for that tier and shape
- **Severity**: `low` | `medium` | `high` | `critical` (impact if this goes wrong)
- **Rationale**: one short paragraph explaining why

It proposes; the engineer confirms. No code is touched until confirmation.

## Asks vs acts

**Asks first** when any of the following is unknown from the task description:
- Is this production-facing?
- Does it touch auth, payments, data migrations, or shared infrastructure?
- What is the rough size: one-liner, a feature, or a cross-cutting refactor?

**Acts without asking** when all three are clear from the description.

Maximum three clarifying questions. If still uncertain after answers, default one tier higher.

## Output formats

### When multiple independent tasks are detected

Haiku outputs a multi-task block — relay it verbatim:

```
## Triage — multiple tasks

N independent tasks detected. Each is triaged separately.

### Task 1: <summary>
**Tier**: <tier>
**Severity**: <severity>
**Playbook**: /skill → /skill → ...

### Task 2: <summary>
**Tier**: <tier>
**Severity**: <severity>
**Playbook**: /skill → /skill → ...

**Recommendation**: <one sentence>

---
Confirm? Reply `yes` to lock this in, or redirect me.
```

### When enough information is available (single task)

Haiku outputs this block directly — relay it verbatim:

```
## Triage

**Tier**: <tier>
**Severity**: <severity>
**Playbook**: <ordered list: /skill → /skill → ...>

**Rationale**:
<one paragraph — mention the specific signals that drove the tier>

---
Confirm? Reply `yes` to lock this in, or redirect me.
```

### After the engineer confirms

Single task:
```
Triage locked. Begin with: `/<first-skill-in-playbook>`
```

Multiple tasks — list each task with its starting point:
```
Triage locked.

- Task 1 (<summary>): begin with `/<first-skill>`
- Task 2 (<summary>): begin with `/<first-skill>` — handle in this session or a new one, your call
```

Do not output code. Do not touch files at any point.

## Portability (any OS, any agent)

Written for any Agent Skills client on macOS, Linux, or Windows. Bundled files (`tier-guide.md`, `agent-prompt.md`) are referenced by paths relative to this skill's folder; the **main agent reads them and injects their text** into the subagent prompt (the haiku subagent has no file tools, so it can't resolve skill paths). No POSIX-only shell utilities are required — use your agent's own cross-platform file tools to read files. If your tool has no subagent or interactive-question support (both Claude Code features), run the triage reasoning inline yourself and present the questions as plain-text options.

## Execution — spawn a haiku subagent

### Pre-flight (main model does this before spawning)

1. Read the repo's canonical context file: `AGENTS.md` at the root (fall back to `CLAUDE.md` if there's no `AGENTS.md`). If neither exists, note "no context file found".
2. Read `tier-guide.md`.
3. Read `agent-prompt.md` to get the prompt template.
4. Fill the template with: task description, context-file contents, tier-guide contents.

### Spawning

Spawn an Agent with:
- `model: "haiku"`
- `description: "Triage: recommend tier, playbook, severity"`
- `prompt`: the filled template from `agent-prompt.md`
- No tools (all context is injected; haiku must not read files or browse)

### Multi-turn (when questions are needed)

Haiku signals it needs clarification by outputting a JSON object with `"type": "TRIAGE_QUESTIONS"` (see `agent-prompt.md` for the schema). When the main model receives this:

1. Check if the haiku output is valid JSON containing `"type": "TRIAGE_QUESTIONS"`. If it is, treat it as a questions block and parse the `questions` array — each entry has a `question`, `header`, and three `options` (label + description).
2. **If the output is not valid JSON, cannot be parsed, or lacks `"type": "TRIAGE_QUESTIONS"`**: fall back to asking the questions as plain numbered text in chat. Collect the engineer's text answers and continue to step 4.
3. Call `AskUserQuestion` with those questions and options exactly as structured. Do not rewrite them. The tool automatically appends "Other" as a free-text fourth option.
4. Collect the user's answers from the tool result.
5. Re-spawn the haiku agent using the same filled template, appending the answers under a `CLARIFICATIONS` section at the bottom.
6. Relay the final recommendation verbatim.

Maximum one round of questions. If haiku outputs a JSON questions block a second time, default to `full` tier and proceed — do not spawn again.

### Post-confirmation

When the engineer replies `yes`, output the "After confirmation" format above. The skill is now complete.

If the engineer rejects or redirects (anything other than `yes`): treat their response as updated task context. Re-spawn haiku using the same filled template with the engineer's feedback appended under a `CLARIFICATIONS` section at the bottom. Do not ask clarifying questions again — proceed directly to a revised recommendation.

## Re-triage rule

If unexpected complexity surfaces during execution — a lean task turns out to touch shared infrastructure, scope grows beyond what was described — stop and re-run `/triage` with the updated understanding before continuing. Never silently upgrade scope. The engineer must confirm any tier change.

## Tier decision guide

See `tier-guide.md`.

## Subagent prompt template

See `agent-prompt.md`.

## Artifact

This skill owns no files. Chat output only.
