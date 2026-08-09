# Ticket 1: Mojibake in 17 report templates

**Status:** done
**Phase:** 1
**Size:** S
**Depends on:** none
**Files touched:** 11 files listed under Evidence

## Problem

The middle dot separator in the completion report templates is double encoded. The bytes on disk are `c3 82 c2 b7` (renders as `Â·`) where they should be `c2 b7` (renders as `·`).

These strings sit inside the report block that each skill copies verbatim into its output, so the garbled character is printed to the user on every run of the affected skill. Some lines carry both the broken and the correct form, so a partial re encode happened at some point rather than a clean one.

`npm run check` does not catch this. Ticket 10 adds the guard.

## Evidence

Confirmed by hexdump, not by eye. `sync/SKILL.md:130` reads `... complete c3 82 c2 b7 reconciled ...` while line 132 of the same file correctly reads `... files c2 b7 scope ...`.

All 17 sites:

| File | Lines |
|---|---|
| `docs/conventions.md` | 26 |
| `skills/sync/SKILL.md` | 130 |
| `skills/test/SKILL.md` | 192, 196 |
| `skills/debug/SKILL.md` | 93 |
| `skills/document/SKILL.md` | 107, 109 |
| `skills/check/modes/verify.md` | 152 |
| `skills/check/modes/review.md` | 123, 125, 126, 128 |
| `skills/scope/scope-template.md` | 140 |
| `skills/architect/agent-prompt.md` | 240 |
| `skills/audit/agent-prompt.md` | 355 |
| `skills/develop/ui/implementation.md` | 166, 168 |

Find them again with:

```bash
grep -rn "Â" --include="*.md" .
```

## Fix

Replace every `Â·` with `·`. This is a straight byte substitution: drop the `c3 82` prefix, keep the `c2 b7`.

Do not hand edit line by line. Do a scripted pass over the whole repo, then verify the grep returns nothing.

Check the same pass for any other double encoded character while you are in there (`â€`, `Ã`, `ï»¿` byte order marks). The grep above only finds the `Â` family.

## Done when

- `grep -rn "Â" --include="*.md" .` returns no matches.
- `npm run check` still passes.
- `git diff` shows only separator characters changed, no prose edits rode along.

## Notes

Do not change the character to a plain ASCII bullet or a hyphen. The house style bans hyphens as punctuation, and the surrounding templates already use `·` correctly, so `·` is the right target.

## Resolution

Fixed with a single byte level pass over the 11 affected files:

```bash
perl -i -pe 's/\xc3\x82\xc2\xb7/\xc2\xb7/g' <the 11 files>
```

17 lines changed, 17 insertions, 17 deletions. `git diff` confirmed every changed line differs only in the separator character; no prose rode along. `sync/SKILL.md:130` re hexdumped and now reads `c2 b7`. `npm run check` passes.

**Two occurrences deliberately left in place**, because both files are documenting the bug rather than suffering from it:

- `docs/current-isssue.md:7` (the audit notes)
- `docs/tickets/ticket-1.md` and `ticket-10.md` (this ticket and the guard that will catch it)

Ticket 10's guard A must exclude `docs/tickets/` and `docs/current-isssue.md`, or it will fail on these two files forever.

**The wider sweep found nothing else.** A full non ASCII inventory across the corpus (excluding `docs/tickets/`) returned only legitimate characters: `→ · … ✅ ⚠ ❌ ≥ ≤ ⇒ ≠ • ← ö` and status emoji. No `â€`, no `Ã¢`, no byte order marks anywhere.

One thing noticed in passing, not fixed here: `README.md` and `docs/current-isssue.md` contain 15 em dashes. The checker's rule 10 bans them but only scans `skills/`, so `README.md` is outside its reach. Worth deciding in ticket 10 whether the no dash rule should extend to `README.md` and `docs/`, since those are the most read files in the repo.
