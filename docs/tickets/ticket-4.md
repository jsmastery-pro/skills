# Ticket 4: README headline diagram teaches the wrong greenfield order

**Status:** todo
**Phase:** 1
**Size:** S
**Depends on:** none
**Files touched:** `README.md`

## Problem

The pipeline diagram at the top of the README puts `/audit` before `/architect`. Three other places, including the README itself forty lines later, say the opposite for a new project: the stack is decided and the project scaffolded before `/audit` runs, so that `/audit` reads a real project instead of an empty folder.

This is the most read line in the repository and it teaches the order the workflow explicitly warns against.

## Evidence

`README.md:8`:

```
idea → /scope → /audit → /architect → /develop → /check verify → /test → /check review → /document → /sync
```

Contradicted by:

- `README.md:49` "New product (greenfield): `/scope` the idea, then `/architect` the stack, then scaffold the project, then `/audit` to seed AGENTS.md from the real project".
- `docs/workflow-guide.md:110` to `114`, stage 3, which states "The order here matters. The stack is chosen and the project exists before `audit` runs".
- `skills/audit/SKILL.md:17` which calls running `/audit` earlier "premature".

The brownfield order is the reverse (`/audit` first), which is probably where the diagram came from.

## Fix

The single line cannot be correct for both project types, so stop trying to make it. Two options, pick one:

1. Show the greenfield order in the diagram and label it, then note the brownfield variant on the line below. This matches `README.md:49` and the workflow guide.
2. Drop the ordering claim from the diagram entirely and list the skills, leaning on the "Where to start" section at line 47 which already gets both cases right.

Recommended: option 1. The diagram earns its place by showing a sequence; a list of nine names does not.

Whichever you pick, check `README.md:60`, the feature loop diagram, is still consistent. It starts at `/architect` and looks correct.

## Done when

- No line in `README.md` states an order that contradicts `README.md:49`, `docs/workflow-guide.md`, or `skills/audit/SKILL.md:17`.
- Both the greenfield and brownfield entry points are findable from the top of the README without reading to line 47.

## Notes

`docs/workflow-guide.md` is correct throughout and needs no change. This is a README only fix.
