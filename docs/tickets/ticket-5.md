# Ticket 5: Hardcoded model name in the commit trailer

**Status:** todo
**Phase:** 1
**Size:** S
**Depends on:** none
**Files touched:** `skills/develop/flow/git.md`, `skills/sync/agent-prompt.md`, `skills/test/SKILL.md`

## Problem

The commit message template bakes one specific Claude model version into the co author trailer. Three problems with that, in order of how much they matter:

1. These skills ship to Codex, Cursor, and Gemini users. A Gemini session writing `Co-Authored-By: Claude Opus 4.8` is wrong attribution in the user's git history, which is durable and hard to clean up later.
2. The version is already stale, and it will go stale again on every model release. Nothing in the repo will tell you when.
3. The portability checker has a rule against hardcoded model aliases (rule 2) but it only matches the `model: "haiku|sonnet|opus|fable"` spawn directive pattern, so this slips through.

## Evidence

`skills/develop/flow/git.md:26`, inside the commit message template:

```
feat(auth): add session persistence

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

Two other skills reference the trailer without spelling out a model, so they inherit whatever `git.md` establishes:

- `skills/sync/agent-prompt.md:177` "plus the `Co-Authored-By` trailer".
- `skills/test/SKILL.md:187` "plus the `Co-Authored-By` trailer".

## Fix

Replace the literal model name with an instruction to use the running agent's own identity. Something in the shape of:

```
Co-Authored-By: <the agent and model actually running this session> <its noreply address>
```

with one line telling the agent to fill it from what it is, and to omit the trailer entirely if it cannot determine that.

Then decide the policy question this exposes and write the answer down in `git.md`: should the workflow add a co author trailer at all by default? It is an outward, durable mark on the user's repository that they did not explicitly ask for. A reasonable alternative is to make the trailer part of the `## Git` block captured by `/audit` (`trailer: on | off`, default `on`), so it is the engineer's recorded choice rather than the skill's assumption.

Recommended: keep the trailer on by default, but resolve the identity at run time and make it overridable in the `## Git` block. That keeps the current behavior for the common case and stops the workflow from asserting something false about who wrote the code.

## Done when

- No skill file names a specific model version in a commit trailer.
- `grep -rn "Co-Authored-By" skills/` shows every site either resolving the identity at run time or pointing at the one place that does.
- `npm run check` passes.

## Notes

Consider extending checker rule 2 to catch any `claude-*` or bare `Opus|Sonnet|Haiku|Fable` followed by a version number anywhere in the corpus, not just in a spawn directive. That belongs in ticket 10 if you want it; note it there rather than doing it here.
