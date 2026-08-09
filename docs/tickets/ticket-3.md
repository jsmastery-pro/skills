# Ticket 3: Broken code fences in two skill files

**Status:** todo
**Phase:** 1
**Size:** S
**Depends on:** none
**Files touched:** `skills/test/SKILL.md`, `skills/check/modes/verify.md`

## Problem

Two files have misplaced triple backtick fences. The effect is that a template block the agent is meant to copy renders as prose, and a prose instruction renders as a code block. The agent reads whatever the fences say, so this changes what gets treated as literal output.

## Evidence

### `skills/test/SKILL.md`

13 fence markers, an odd count, so at least one is unmatched. Fence lines: 80, 85, 105, 110, 127, 131, 135, 142, 163, 167, 191, 197, 204.

The report template opens at 191 and closes at 197. The `**Not covered**` block at lines 201 to 203 then sits outside any fence, and line 204 is an orphan closer with nothing to close. The `**Not covered**` section is part of the report template and should be inside it.

### `skills/check/modes/verify.md`

Four fence markers at 148, 151, 161, 167, and they are shifted by one position:

- 148 opens a fence around the prose instruction on line 149 ("Lead with the verdict; list only what failed...").
- 151 closes it.
- Lines 152 to 160, the actual report template, are left outside any fence.
- 161 opens a new fence.
- Lines 162 to 166, prose plus the `**For /check review**` note, end up inside that fence.
- 167 closes it.

## Fix

`skills/test/SKILL.md`: fold the `**Not covered**` block into the report template fence. The template should open once, contain the headline, `Next`, `Heads up`, the run steps note, and `**Not covered**`, then close once. Remove the orphan fence at 204.

`skills/check/modes/verify.md`: shift the fences back into place. Line 149's prose instruction belongs outside a fence. The template from `## /check verify <feature>` through the `Ran via ...` line belongs inside one. The `**For /check review**` block is part of the report the skill emits, so it belongs inside the template fence too, not in a fence of its own.

## Done when

- Every `.md` file under `skills/` has an even number of lines starting with three backticks. Verify with:
  ```bash
  for f in $(find skills -name "*.md"); do n=$(grep -c '^```' "$f"); [ $((n % 2)) -ne 0 ] && echo "ODD ($n): $f"; done
  ```
- In both files, reading top to bottom, every instruction is prose and every template the agent copies is fenced.
- `npm run check` passes.

## Notes

An even fence count is necessary but not sufficient. `verify.md` already has an even count and is still wrong, because the fences are balanced but misplaced. Read both templates end to end after editing rather than trusting the counter. Ticket 10 adds the counter as a guard, which catches the `test/SKILL.md` class but not the `verify.md` class.
