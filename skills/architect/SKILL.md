---
name: architect
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /architect when choosing between approaches, designing a feature or page, picking a tech stack, or when /develop says a decision is owed, anytime a load bearing technical decision is unmade. Asks deep questions, recommends an answer, and writes a build spec to docs/specs/. Owns all spec files."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

Runs structured discovery, weighs options, and writes or updates a build spec in `docs/specs/`. The main thread does the writing itself; it only offloads two things to a cheap subagent, reading the codebase or fetching from the web (see *Subagents*). Four modes:

| Mode | When | Design behaviour |
|---|---|---|
| `FEATURE` | Designing a new feature from scratch, with or without existing code | First principles design, best practices, minimal code reading |
| `ARCHITECTURE` | Choosing a tech stack or foundational architecture for a new project | Comprehensive stack evaluation, industry patterns, no code to read |
| `ENHANCEMENT` | Improving, replacing, or scaling something that already exists | Read existing code + specs, focused option comparison |
| `CROSS-CUTTING` | Standardising a pattern across the whole codebase (error handling, logging, auth, naming) | Sample current state, define the standard precisely, recommend enforcement |

- **Create**: new decision → new spec with status `Proposed`
- **Update**: evolving an existing decision → edit existing spec in place
- **Supersede**: replacing a past decision → new spec + update old spec's status line
- **Ratify**: deliberating an `Assumed` spec that `/develop` recorded when the engineer chose to build before deciding → see *Ratify an assumed decision* below

Spec status behaves one of two ways, decided by whether a buildable scope feature links the spec (a `docs/scope/` row whose `spec` cell points to it):

- **Feature linked spec** (typical FEATURE/ENHANCEMENT, or an ARCHITECTURE foundation that has a scope row): status mirrors the feature lifecycle. /architect creates it as `Proposed` and owns its content but never advances the status; /develop advances it to `In Progress` when the feature goes in-progress, then `Accepted` when built and verified (scope `done`). Engineer confirmation ratifies content only; `Accepted` means shipped.
- **Standalone decision spec** (foundational/stack or cross cutting standard, no scope row links it): decision status. `Proposed` when written, `Accepted` once the engineer ratifies it on confirmation (the decision is then in force). /develop does not advance it.

A spec documenting already shipped work (the "already built" path, or a linked feature already `existing`) is born `Accepted`.

**The `Assumed` status.** `/develop` may create a spec in status `Assumed` when the engineer chooses to build before a load bearing decision is deliberated (see spec 0001). It records the assumption the build used, not a deliberated decision, and it blocks the feature from `done`. Only `/architect` clears it, by ratifying (below). `/architect` never creates an `Assumed` spec; it only deliberates one that already exists.

Writes no code. Never updates `AGENTS.md`/`CLAUDE.md` (/sync owns that).

## Subagents (main thread writes; subagents only read, fetch, or cross check)

The main thread runs the whole design conversation AND writes the spec itself. It never hands the writing (or any fix) to a subagent. Every subagent it does spawn is read only and never inherits the session model:

- **Read the codebase** (cheapest model, Claude Code `haiku`): a read only scan of existing code when the repo is large (ENHANCEMENT/CROSS-CUTTING). Claude Code: the `scout` type. Returns a compact map, never file dumps.
- **Fetch from the web** (cheapest model, Claude Code `haiku`): the current tool landscape check and the Agent Skill / MCP discovery, both during the design conversation (Stage c), when a decision needs current facts. Claude Code: the `researcher` type. Returns a compact summary, never raw pages.
- **Cross check the drafted spec** (its primary job is decision completeness: finding values an action must produce whose source the spec never names, and decisions the builder would otherwise invent, see spec 0002): a read only pass that reads the finished spec and returns a critique, writing nothing. `/architect` **always asks** whether to run it (never runs or skips it on the engineer's behalf), recommending `Another model` strongly at `Full`/`Medium` (the tiers where these bugs live), offering it at `Lean`, and recommending `Skip` at `Vibe`; any gap it finds is presented to the engineer with a recommended fix for them to decide, not auto resolved. See *After the spec is written*.

Web fetching happens once, at the point a decision needs it (the Stage (c) landscape and tool discovery checks). The links those checks return are written into the spec's References for a human to follow later; the AI never fetches them again, not during the cross check, not in /develop, not in /audit. No subagent ever writes to the spec; the main thread does all writing and all fixes.

## Asks vs acts

Ask targeted questions before you write the spec (and before spawning any read/fetch helper); spend the budget on substance. Sort every question:

- **INFER**: anything the prompt or codebase reveals (feature vs architecture, the stack, UI in scope, an already chosen provider). Derive, never ask.
- **ASK**: only what the engineer alone knows (requirements, preferences, business rules, compliance scope).
- **RECOMMEND**: anything expertise settles (which provider/library/pattern fits). State the pick, a one line why, and the runner up; they may override. Never a neutral menu, never a silent decision.

Never bundle a complete data model, full stack, or ready made acceptance criteria set into one accept or change panel, and never silently decide a tool, provider, or setup choice for them.

Recommendations align with the stack in use (on a BaaS, prefer its auth/storage over new external tools; reuse beats sprawl). Web or mobile alike: infer the platform, never assume web.

That is the intent, not the procedure. How to actually run the questioning (phase by phase, batched rounds, what to grill on, what to infer from `AGENTS.md` instead of asking) lives in `internal/design-conversation.md`, which the Execution section below makes you read in full before you ask a single design question.

## Artifact ownership

Spec files in `docs/specs/`, created or updated by this skill only, plus any supporting evidence it produces (inventories, audits), which lives in the spec's `rationale.md` (directory spec) or inline (single file spec), never in the scope folder (`docs/scope/` is owned by `/scope`, not a spec).

Two independent choices, location (repo shape) and shape (decision size):

- **Location = repo shape.** Single repo → `docs/specs/`. Monorepo → `docs/specs/<workspace>/` for a workspace decision, `docs/specs/_root/` for a repo wide one (mirrors the scope). Numbering is per location (scan that dir for the next `NNNN`). Call the resolved location `$SPEC_DIR`.
- **Shape = decision size**, the same in any repo shape. Simple decision: one file `$SPEC_DIR/NNNN-title.md` (everything inline, written tight). A decision that is an umbrella (related sub decisions), or heavy/foundational, or warrants a `verify.md`, uses the directory shape: `$SPEC_DIR/NNNN-title/` with `index.md` as its top file plus a `rationale.md` beside it (and child specs `NNNN-<child>.md` for an umbrella). Never double the name (`NNNN-title/NNNN-title.md`); the directory carries the number, the top file is `index.md`. Default to a single file; use the directory shape when there are child decisions, or the spec is heavy enough that keeping the reasoning out of every build read pays off, or a `verify.md` is warranted.

  A directory spec always has exactly two core files (plus optional `verify.md` and child specs):
  - **`index.md`**: the build spec `/develop` reads: `## Summary`, `## Requirements`, `## Decision`, the design/spec section, `## Build plan`, `## Consequences`, `## Follow-up`, and a one line `## Rationale` pointer to `rationale.md`. For an umbrella it also opens with a `## Structure` manifest listing and linking every child spec (one line each: what it is plus which decision it supports), and holds any cross child contract.
  - **`rationale.md`**: the decision record `/develop` skips: `## Context`, `## Options considered`, `## Rationale`, the `## References` section, and any bulky evidence (inventories, audits) under its own subheading. There is no `research/` folder; all evidence lives here.
  - Child specs (umbrella only) are flat `NNNN-<child>.md` files, each complete enough to build from on its own with a short inline rationale (not its own `rationale.md`); promote a child to its own directory only when it grows heavy. Cross child contracts live in the umbrella `index.md`.
- **One narrow exception into the scope:** after the spec is confirmed, update the matching feature to the ready to build shape (exact edits in *After the spec is written*, step 3). Never dump the atomic task list into the scope. No matching feature: offer to enroll one (see the derive tasks step).

**Artifact base.** specs live under `docs/` by default. If `docs/` is a published docs site (`docusaurus.config.*`, `.vitepress/`, `mkdocs.yml`, Astro Starlight, or Nextra detected), use `.workflow/` instead (`.workflow/specs/`). Always follow whichever base already exists (paths here assume `docs/`).

---

## Portability (any OS, any agent)

- **Commands**: `git` is the only required CLI, same on every OS. Other shell snippets (`mkdir -p`, `date`, `find`, `ls`, `cat`, `wc`) are POSIX reference, not literal scripts; use your agent's cross platform file tools (read, search/glob, write, create dir) and your knowledge of today's date. Create `docs/specs/` with your write tool, not `mkdir`.
- **Bundled files**: `agent-prompt.md`, `agent-modes/*.md`, and `spec-template.md` live at paths relative to this skill's folder. The main thread reads these itself right before it writes the spec (see *Write the spec*): `agent-prompt.md` (the persona, rules, and report format), the one matching `agent-modes/<mode>.md`, and `spec-template.md` (the section structure). Read them only at write time, not during pre-flight, so they don't sit in context through the whole interview.
- **No interactive question support?** Use whatever your agent provides (an options picker) and fall back only where missing: ask the question rounds as plain text with the same options.

## Execution

### Step 0: Topic check (before pre-flight)

If no design topic was provided (`/architect` with no argument or an empty description), stop and ask before doing anything else:

"What design decision do you want to work through? Describe the feature, system, or choice you need to design in one or two sentences."

Wait for the answer; use it as the design topic before pre-flight.

---

### Pre-flight (main model)

Run these steps (the `git` commands are literal; everything else uses your agent's file tools):

- **Freshness (teams):** `git fetch` quietly, pick the base branch (`main` if `git rev-parse --verify main` succeeds, else `master`), count commits behind with `git rev-list --count HEAD..origin/<base>`. If >0, warn "pull first" before deciding (a teammate may have added specs or changed this feature).
- **Resolve the spec location** (`SPEC_DIR`) = the scope workspace mirrored into `docs/specs/`: single repo → `docs/specs/`; monorepo workspace → `docs/specs/<workspace>/`; repo wide → `docs/specs/_root/`. Determine `<workspace>` as the scope does (topic/path/scope row). Create the directory if missing.
- **Today's date**: use today's date (inject it into the spec).
- **List existing specs in this location**: files named `NNNN-*.md` plus any `index.md` in `$SPEC_DIR`, for numbering (per location) and related decision detection.
- **Count source files** (e.g. `.ts`, `.tsx`, `.js`, `.py`, `.go`, `.rs`, `.java`), excluding `node_modules/`, `.git/`, `dist/`. Informs how much code there is to read, and whether to offload that reading to a `scout` subagent.
- **Read project context**, the source of truth for the stack and community skills: root `AGENTS.md` (fall back to `CLAUDE.md`, else MISSING), plus the nested `<area>/AGENTS.md` for this feature's area if one exists (e.g. `src/auth/AGENTS.md` for an auth feature).
- **Read the build approach for THIS feature**: the delivery strategy that governs how the spec's `## Build plan` is ordered and sliced. Precedence: this feature's scope row `Approach` override if declared, else the project default (root `AGENTS.md` first, else the scope header in `docs/scope/`). A feature with its own approach is built by ITS approach; others use the project default. The family: **Tracer Bullet** (thin vertical slices end to end through every layer), **Skateboard** (thinnest usable whole first, then grow), **Facade** (UI shell first, wire the backend later, a prototype path), **Journey** (one complete user path per phase), or a project specific variant. If neither records one, note the assumption and set the default by Staff/Principal judgment (prefer end to end / Tracer Bullet slices for production work). Carry what you find into the spec. Reason about what the approach implies for this feature; no fixed per approach recipe. The four approaches imply materially different `## Build plan` orderings, not the same order relabeled: Facade leads with the UI shell on placeholder data and defers the migration; Journey completes one user path's tasks fully before another's; Tracer Bullet stands up a thin end to end thread first, then thickens; Skateboard builds the smallest usable slice. Let the recorded approach visibly shape the ordering.
- **Locate the linked scope feature (if any):** cheaply scan `docs/scope/` filenames/headings (including per workspace subdirs) for a feature matching this topic; open only the single scope file containing it (`scope.md`, or the matching `<epic>.md` in a split). If found, read that row's intent plus any acceptance criteria seeds (they seed Stage (a)) and remember the file/row for the derive tasks and linking steps; this also settles feature linked vs standalone status. If no row matches, note the standalone decision path and don't create one now.
- **(Optional)** list installed skills dirs for availability only (`.claude/skills/`, `.agents/skills/`, `skills/`). Relevance is decided by AGENTS.md plus the feature, not name matching.

From the spec list (paths relative to `$SPEC_DIR`):
- **Next number**: highest existing + 1, zero padded to 4 digits; `0001` if none (an umbrella directory counts as one number). Collision guard (teams): list again `$SPEC_DIR` immediately before you write; if the chosen `NNNN` exists, bump to the next free number. Never overwrite an existing spec; after writing, confirm no concurrent run took the same number.
- **Filename / shape**: `kebab-case` slug from the topic, max 5 words, no articles, lowercase.
  - Simple decision → `$SPEC_DIR/NNNN-kebab-title.md`.
  - Umbrella (splits into ≥2 related sub decisions) → directory `$SPEC_DIR/NNNN-kebab-title/` with `index.md` (the umbrella decision listing its children), `rationale.md` (the reasoning + any inventories/audits), and child specs `NNNN-child.md` inside it. Decide from the topic's breadth before you write, and hold the shape in mind as you write.
- **Related specs**: go in two passes so this stays cheap as specs accumulate. First read only the title line of each existing spec (cheap even at dozens of them); then read the first 20 lines (title, status, opening of Context) of just the few whose title plausibly overlaps this topic, to confirm. Flag matches.
- **Child of umbrella detection**: if the topic is a sub decision of an existing umbrella (`$SPEC_DIR/NNNN-<umbrella>/`), e.g. one that surfaced while building under it, place the new spec inside that directory as the next child (`NNNN-child.md`) and add it to the umbrella's `index.md` list, not a new top level spec. Same path when `/develop` hits a decision partway through a build. Tell the engineer where it's going.
- **Update/supersede detection**: if an existing spec clearly overlaps the topic (same domain, system, decision), before the staged conversation present a decision panel (plain text options where the agent has no picker; the picker adds Other automatically): "I found an existing spec that may overlap: `[path]`, [title]. How should I treat this?", options: **New decision (create a new spec)** · **Update the existing spec in place** · **Supersede it (a new spec replaces it)**. Default to the "(recommended)" option by overlap strength (nearly identical → Update or Supersede; adjacent → New). On update/supersede: set OPERATION, read the existing spec in full, and skip the staged conversation for in place updates.
  - **Assumed spec found**: if the overlapping spec's `**Status**:` is `Assumed`, this is a ratify, not the panel above. Follow *Ratify an assumed decision* (run the design conversation, then either fill in the real content and clear `Assumed`, or supersede if the assumption was wrong).

**Community skills** come from the project's `AGENTS.md`, never a hardcoded name table (names and stacks change). Project wide skills/conventions live in root `AGENTS.md`, area specific ones in the nested `<area>/AGENTS.md` (maintained by `/audit` and `/sync`):

1. Read root `AGENTS.md` and the nested `AGENTS.md` for this feature's area; their `## Agent skills` section lists each installed skill as a bullet with its location and a one line note on what it governs, so you can pick out the relevant ones and their paths directly.
2. Identify only the skills relevant to *this* feature. Take each relevant skill's path and note from that `## Agent skills` bullet, and open it on demand while writing, only if it materially shapes the decision (see *Write the spec*, item 12). Skip skills the feature doesn't touch.
3. Available ≠ relevant. You may list the installed skills dirs to see what exists, but relevance comes from the feature plus `AGENTS.md`. If a clearly relevant skill is installed but not yet referenced in `AGENTS.md`, use it anyway and flag (spec Follow-up) that it belongs in the right context file: root if project wide, nested `<area>/AGENTS.md` if area specific.
4. Whatever the context files show the project already uses (a BaaS, an ORM, a payment provider, an auth library) is what your library/provider recommendation must build on or prefer, not an unrelated external tool. If a genuinely better option isn't installed, note it as a spec Follow-up rather than silently assuming it.

**Workflow skills** (never treat as community skills): `audit`, `architect`, `scope`, `develop`, `check`, `test`, `document`, `debug`, `sync`, plus new workflow skills as they're created.

---

### Scope validation, framing, and staged design conversation

For create or supersede operations, this is a hard gate: **read `internal/design-conversation.md` in full before you ask the engineer a single design question, and follow it.** It contains Scope validation (including the already built documentation path), Framing, and the staged design conversation. The *Asks vs acts* section above is only a short summary of the intent; it is NOT the protocol and is not enough to run the conversation from. Do not open the interview, generate questions, or write the spec until you have read that file. (Skip it only for in place spec updates.)

### Write the spec (main thread)

After the staged conversation, you write the spec yourself. Do not spawn anyone to draft, research, or critique it. Resolve this skill's folder to an absolute path (you already resolve these relative paths, so you know the folder) and Read three files now (only now, so they don't sit in context through the interview): `agent-prompt.md`, `spec-template.md`, and the one mode file matching the inferred MODE:
- `FEATURE` → `agent-modes/feature.md`
- `ARCHITECTURE` → `agent-modes/architecture.md`
- `ENHANCEMENT` → `agent-modes/enhancement.md`
- `CROSS-CUTTING` → `agent-modes/cross-cutting.md`

Then write the spec, applying:
- **From `agent-prompt.md`**: adopt the persona ("Who you are / How you think / What you do NOT do") and follow the common instructions, Step 0, Step 0b, `## Expert rules that apply to all modes`, and `## Report format`. At `## Instructions by mode`, follow the one mode file above as the only mode specific block; ignore the other mode files. `agent-prompt.md` is written as a subagent brief with ALL_CAPS placeholders; read those placeholders as the inputs you already gathered in the conversation (listed below), and apply the rules to yourself.
- **From `spec-template.md`**: use only the part between `=== SPEC TEMPLATE START ===` and `=== SPEC TEMPLATE END ===` (the spec section structure + field guidance: Summary, Context, Options considered, Decision, Rationale, the mode specific design section, Consequences, Follow-up, References, etc.). The trailing reference/meta sections (`## Filename conventions`, the `## Status values` table, the umbrella structure / child status notes, `## Writing rules`) are your own guidance: you resolved the filename, shape, and initial `**Status**:` in pre-flight; write the `**Status**:` line per the "On the initial `**Status**:` line" rule in `## Expert rules that apply to all modes`. Do not edit `spec-template.md`.

**References and links: reuse the Stage (c) `REFERENCES_LEVEL`.** Write the References section and `(basis: ...)` citations only at the chosen level: `none` = no `## References` section and no citations anywhere (Rationale stays); `sources` = named Project sources and Practices only, no links; `sources+links` = sources plus the web verified links the Stage (c) landscape / tool discovery checks already returned. Do NOT fetch anything now; those checks ran once during the conversation and the links they confirmed are what you write. If a link you want was never verified in that check, cite the source by name with no URL rather than fetching at write time. The written links are for a human to follow, not for later AI reads. Only if Stage (c) never ran (e.g. the documentation path), present the References consent panel now (same panel, recommended pick `No references, keep it clean`) and set `REFERENCES_LEVEL` to `none` or `sources` (no fetch at write time is available, so `sources+links` is not offered here).

The inferred MODE (from Framing) is already one of `FEATURE` / `ARCHITECTURE` / `ENHANCEMENT` / `CROSS-CUTTING`.

The inputs to apply (you already have them from the design conversation and pre-flight):
1. Design topic (from the user's original message)
2. The inferred framing: MODE, platform (web/mobile/API), stack & conventions (from `AGENTS.md`), and any constraints/compliance inferred or confirmed
2a. The feature's build approach (pre-flight precedence: scope row `Approach` override, else the project default from `AGENTS.md`/scope header, else the noted default) → `BUILD_APPROACH`; order and slice `## Build plan` by what the approach implies for this feature
3. All staged conversation answers, stage by stage: the confirmed acceptance criteria (already IDed AC-1…, to seed `## Requirements`), the confirmed data model (entities/fields/relationships, to seed `## Build plan` task 1), the confirmed stack/tool picks, API surface, authz model, and edge cases. On the documentation path (staged conversation skipped) treat it as `"Staged design skipped, documenting an already-made decision"`, not an error
3a. The RECOMMEND items → `RECOMMEND_ITEMS_OR_NONE`: the specific decisions you must make and justify (tool/provider aligned to the stack, session model, etc.); make each call, don't echo it back as an open question. If none, treat as `"none"`
3b. The References level → `REFERENCES_LEVEL` (`none` | `sources` | `sources+links`, per the rule above). If Stage (c) never ran and you have not asked, default to `none`
4. Context file contents: `AGENTS.md` (root + the feature area's nested), or `CLAUDE.md` as fallback, or "MISSING"
5. Existing spec list (filenames + first line of each)
6. Related spec paths (flagged in pre-flight)
7. The resolved spec location (`$SPEC_DIR`), next number, and shape: a single file `$SPEC_DIR/NNNN-title.md`, or a directory `$SPEC_DIR/NNNN-title/` (`index.md` + `rationale.md`, plus child specs for an umbrella). Umbrella: write the named child decisions; any inventory/audit goes in `rationale.md`, never in `docs/scope/`, never loose in the code tree. Only the `index.md` carries a `**Status**:` line (it mirrors the feature); child specs omit the lifecycle Status (spec content governed by the umbrella)
8. Source file count (whether there's code to read; for a large ENHANCEMENT/CROSS-CUTTING codebase, offload the reading to a `scout` subagent per *Subagents* and write from its map)
9. Operation: `create` | `update` | `supersede`
10. Today's date (from pre-flight)
11. Documentation context (if the "already built" path ran: the engineer's free text answers about why this was chosen, alternatives, and tradeoffs)
12. Community skills relevant to this feature (identified from `AGENTS.md`, per pre-flight): open a skill file on demand, only if it materially shapes this decision; its conventions are authoritative when consulted. Name each in the `## Decision` **Implementation skills** field.

---

### After the spec is written

Once the spec file exists, read `internal/after-subagent.md` and follow it for checking the spec yourself, reviewing it yourself, confirmation, status ratification, scope linking, and the final spoken summary. Do not read it before you write the spec.

### Update / Supersede path

If the task is to update or supersede an existing spec:
- Pre-flight: read the existing spec in full
- Skip the staged conversation if operation is in place update
- Set the operation: `update` or `supersede`
- If supersede: write the new spec AND update the old spec's status to `Superseded by [NNNN](NNNN-title.md)`

### Ratify an assumed decision

When the topic resolves to an existing `Assumed` spec (the engineer built first via `/develop`'s escape hatch and is now ratifying, often phrased `/architect <feature>: ratify …`), pre-flight will find that spec. Read it in full: its `## Owed decision`, `## Assumption built on`, and `## Code area` tell you what was decided provisionally and where the code lives. Then run the normal design conversation, anchored to what was actually built, and deliberate the decision properly. Two outcomes:

- **The assumption holds.** Fill in the real decision content (Context, Options considered, Decision, Rationale, the design section, Consequences) so the spec becomes a genuine deliberated record, and clear `Assumed`: set the `**Status**:` line to the feature's lifecycle state (`In Progress` if the feature is built but not yet `done`, `Accepted` if it is already verified and tested). `/develop` then closes it to `Accepted` at `done` as usual. The decision is no longer ephemeral.
- **The assumption was wrong.** Write a corrected spec (`create` or `supersede`) with the real decision, mark the assumed spec `Superseded by [NNNN](…)`, and tell the engineer `/develop` must rebuild against the corrected spec before the feature can close.

Either way, ratification is why an `Assumed` spec can leave that state: `/develop` records the assumption, `/architect` confirms or corrects it and supplies the reasoning. Do not leave a spec `Assumed` after a ratify run.

---

## Reference files

- Spec template: `spec-template.md` (the main thread reads it at write time)
- Spec writing rules & persona: `agent-prompt.md` (the main thread reads it at write time)
- Mode specific writing instructions: `agent-modes/*.md` (read only the matching mode file, at write time)
- Main thread design conversation: `internal/design-conversation.md` (read only for create/supersede)
- Agent Skill & MCP offer: `internal/tool-discovery.md` (read only when the stack walk settles a new tool; it asks before it searches, and the registry fetch then runs in a `researcher` subagent)
- Main thread completion flow: `internal/after-subagent.md` (read only after the spec is written)
- The staged design conversation is generated per feature (see *Staged design conversation*, stages a to f), not stored; there are no canned question lists. If a topic is too vague to generate from, narrow it first (scope validation, or one clarifying question), never fall back to generic MCQs
