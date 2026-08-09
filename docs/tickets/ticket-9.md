# Ticket 9: Four small text defects

**Status:** todo
**Phase:** 1
**Size:** S
**Depends on:** none
**Files touched:** `skills/scope/SKILL.md`, `skills/scope/modes/plan.md`, `skills/scope/scope-template.md`, `skills/develop/SKILL.md`, `skills/sync/SKILL.md`, `skills/audit/SKILL.md`

## Problem

Four unrelated small defects, grouped into one ticket because each is a single line and none deserves its own thread.

## Evidence and fix

### 9a. Dangling reference to a `## /scope complete` block

Two files tell the agent to use a report block by a name that does not exist.

- `skills/scope/SKILL.md:65` "the `## /scope complete` report block".
- `skills/scope/modes/plan.md:120` "Print the completion report using the `## /scope complete` block in `scope-template.md`".

The block in `skills/scope/scope-template.md:135` is headed `## Completion report block` and its template line reads `## /scope <plan | replan | add> · <product, one line>`. There is no `## /scope complete` anywhere.

Fix: make the two references match the template. Either rename the heading in `scope-template.md` to something both files can point at unambiguously, or change the two references to name the actual section. Prefer whichever leaves one name for the thing.

Note the other skills are consistent here (`## /sync complete`, `## /debug complete`, `## /architect complete`, `## /audit complete`), so `/scope` is the outlier. Consider whether the template line should become `## /scope complete · <product>` for consistency, which would make both references correct with no edit to them.

### 9b. `./design.md` listed among skill bundled files

`skills/develop/SKILL.md:144` lists `- Project design system (UI track): ./design.md` in the `## Reference files` list, alongside `ui-guide.md`, `logical-guide.md`, and `checklist.md`, which are all files inside the develop skill folder. There is no `design.md` in `skills/develop/`. It is a project file.

`/test` gets this right at `skills/test/SKILL.md:155`: "Note whether `design.md` exists at the project root".

Fix: state that it is a project file, not a bundled one. Same in `skills/develop/ui-guide.md:138`, which has the same `./design.md` form.

### 9c. `$BASE` used before it is defined

`skills/sync/SKILL.md:62` refers to `origin/$BASE` in the freshness check. `$BASE` is defined two lines later at line 64. Every other skill defines the base branch before using it.

Fix: move the base branch resolution above the freshness check, or inline the resolution into line 62.

### 9d. Grammar

`skills/audit/SKILL.md:61` "the manifest and scaffold source that now exist are the scaffold, not a existing codebase". Should be "an existing codebase".

## Done when

- `grep -rn "/scope complete" skills/` and the heading in `scope-template.md` agree on one name.
- No `## Reference files` list in `skills/develop/` presents a project file as a bundled one.
- `skills/sync/SKILL.md` defines the base branch before referring to it.
- The typo is fixed.
- `npm run check` passes.

## Notes

9a is a good candidate for a checker guard: any backticked `## <heading>` referenced across files should resolve to a heading that exists somewhere in that skill. Note it in ticket 10 rather than building it here.
