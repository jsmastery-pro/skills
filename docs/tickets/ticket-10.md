# Ticket 10: Add four lint guards to the portability checker

**Status:** todo
**Phase:** 2
**Size:** M
**Depends on:** tickets 1, 2, 3, 9 should land first so the guards go green on arrival
**Files touched:** `scripts/check-portability.mjs`, `docs/conventions.md`

## Problem

Every defect in Phase 1 was found by reading all 5,900 lines of the corpus by hand. Almost all of them are mechanically detectable. The checker already exists and is the right shape; it just does not know about these classes yet.

Without these guards, the same bugs come back and the only thing that catches them is another full manual audit.

## Fix

Add four rules to `scripts/check-portability.mjs`, following the existing structure (numbered rule with a comment block explaining what it enforces and why, push to `violations`).

### Guard A: no mojibake or stray encoding artifacts

Fail on any occurrence of the double encoded families: `Â` (`c3 82` before a Latin-1 byte), `â€`, `Ã¢`, and a byte order mark anywhere but position zero.

Catches ticket 1. Cheap: a regex over the raw file text.

**Exclude `docs/tickets/` and `docs/current-isssue.md`.** Both deliberately contain `Â·` because they document the bug. Without the exclusion this guard fails forever on arrival.

Consider making it broader: flag any non ASCII character not on an allowlist. The corpus legitimately uses `·`, `→`, `⇒`, `≥`, `✅`, `❌`, `⚠️`, `🚫`, `…`, and box drawing in tables. An allowlist makes new encoding damage visible immediately instead of only when someone reads the line. Recommended, but start with the narrow version if the allowlist turns out to be long.

### Guard B: balanced code fences

Fail when a file has an odd number of lines beginning with three backticks.

Catches the `skills/test/SKILL.md` class from ticket 3. Does **not** catch the `verify.md` class, where the count is even but the fences are misplaced. Say so in the rule comment so nobody trusts it further than it goes.

### Guard C: declared tools cover the tools the body names

For each `SKILL.md`, parse `allowed-tools`, then scan that skill's whole folder for prose naming a tool the skill uses on itself. Start with the two that actually bit: `AskUserQuestion` and `Edit`.

`Edit` is the harder one to detect from prose. Two workable signals: the word `Edit` as a capitalized bare token, and instruction phrasing like "surgical", "edit only the", "tick its ... box", "rewrite the ... line". Start narrow and only on explicit tool names; a guard with false positives gets disabled.

Catches ticket 2.

### Guard D: no dangling references

Two checks:

1. **Bundled file references.** A backticked path ending in `.md` that looks like a bundled file (contains no `docs/`, no `<placeholder>`, is not a known project file like `AGENTS.md`, `CLAUDE.md`, `design.md`, `verify.md`, `index.md`, `rationale.md`) must resolve relative to the skill folder or the referring file's folder.
2. **Named section references.** A backticked `## <heading>` referred to from another file must exist as a heading somewhere in that skill.

Catches ticket 9a, and the `after-subagent.md` style loose reference in `skills/architect/agent-prompt.md:231`.

Expect false positives on the illustrative paths in examples (`src/auth/AGENTS.md`, `packages/api/AGENTS.md`, `0001-adopt-relational-db-for-primary-storage.md`). Build the exclusion list from a real run rather than guessing it.

## Also consider

Two things that came up in Phase 1 and belong here if you want them:

- **Stale model names.** Extend existing rule 2 to catch any `claude-*` identifier or a bare `Opus|Sonnet|Haiku|Fable` followed by a version number, anywhere in the corpus, not just in a spawn directive. This is what would have caught ticket 5.
- **Budget policy.** Six of nine hot paths are over 90 percent and four are over 93. The script's own comment argues that a ceiling fitted to current size is a tripwire, not a budget. Do not raise them in this ticket. Decide separately whether the answer is trimming or splitting; that decision belongs with ticket 15, which is what will tell you whether a trim broke anything.

## Done when

- `npm run check` implements all four guards and passes on a clean tree.
- Each guard has a comment saying what it catches and, where relevant, what it does not.
- Reintroducing any Phase 1 defect by hand makes `npm run check` fail. Test this for at least guards A, B, and C by temporarily breaking a file and confirming the failure.
- `docs/conventions.md` mentions the new guards in its "Before committing a skill edit" section, so the rules are discoverable from the doc and not only from the script.

## Notes

Keep the guards deterministic and free. No model calls, no network. That is the entire point of this phase: it runs on every commit at zero cost, which the behavioral harness in ticket 15 never will.
