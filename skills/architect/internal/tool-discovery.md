# Architect: Agent Skill and MCP discovery, asked for before it runs

Read this only when the stack walk (Stage c) settles one or more **new** tools (a framework, database, auth library, provider, and so on) that are not already installed or recorded as declined in `AGENTS.md`. Skip it entirely when no new tool is chosen (e.g. an ENHANCEMENT reusing the existing stack).

## Step 1: Ask first (the consent gate)

<!-- TOOL-CONSENT:START (identical in /architect, /audit and /sync; edit all or none) -->
**Asking is mandatory. Searching is not.** Nothing is searched, fetched, installed, or spawned for Agent Skill and MCP discovery until the engineer has picked. Offer four choices: find them for me, I will name the ones I want, no and record the decline, or not now. Only the first may run a search command. Never silently skip the offer, and never run a search before the engineer agrees to one.
<!-- TOOL-CONSENT:END -->

Explain the value in a sentence or two, in your own words, then ask. Something close to:

> An Agent Skill teaches the agent a tool's real conventions, so the build follows them instead of guessing at them. An MCP server gives the agent live access to the real system (your database, your dashboard) rather than assumptions about it. Both are optional, both usually make the build better, and the ones that fit this stack are worth knowing about.

Then present a panel (capability first: `AskUserQuestion` on Claude Code, else the same options as plain text). Mark exactly one recommended. The picker appends its own free text option, so add one yourself only in a plain text fallback.

- **question**: "Want me to find Agent Skills and MCP servers for this stack?"
- **header**: "Agent skills"
- **options**:
  1. `Yes, find them for me` (recommended): "I'll search the registry for the tools we just chose, then show you what I find. Nothing installs without your pick."
  2. `I'll name the ones I want`: "Tell me which skills or servers, and I'll add exactly those. No searching."
  3. `No, skip it`: "Build without them. I'll record the decline so nothing offers them again."
  4. `Not now, later`: "I'll note them in the spec's `## Follow-up` so you can add them when you want."

**Act on the pick:**

- **`Yes, find them for me`** → Step 2, then Step 3.
- **`I'll name the ones I want`** → run no search. Ask which ones, take the list as given, confirm each with `npx skills add <owner>/<repo> --list` where that is practical, then install per Step 4 and record per Step 5.
- **`No, skip it`** → run nothing. Record the decline per Step 5, so a later stage does not offer the same tools again (the no nag rule).
- **`Not now, later`** → run nothing. Add the passive spec `## Follow-up` note per Step 6, naming the tools and what a skill or server would give them.

Only `Yes, find them for me` may run a search. Until that option is picked, do not spawn the discovery subagent, do not run `npx skills find`, and do not fetch anything.

## Step 2: Discover (only after `Yes, find them for me`)

- **Inventory first, discover in batch.** Build `TOOL_DISCOVERY_SET` from every chosen tool this feature touches: runtime, framework, router, styling or UI kit, database, ORM or query layer, auth and session, payments, email, storage, search, queue, AI or vector DB, browser testing, observability, hosting. Include package names and aliases. Do not stop after the first technology.
- **Run it in the background, keep interviewing.** Consent is given, so hand the whole `TOOL_DISCOVERY_SET` to a read only discovery subagent and do NOT wait on it: spawn it in the background (it blocks nothing) if your agent supports that, set its model explicitly to a fast, low cost tier (do not inherit the session model; on Claude Code spawn it as the `researcher` subagent type, which pins the model and gives it the registry CLI plus web tools), and have it run the detect and filter work below and return ONLY the compact candidate list (skills and MCP servers grouped by technology, already minus installed and declined). While it runs, continue the design conversation (stages d, e, f); collect its result just before the offer panel. This keeps the searches and fetched pages out of the main context and overlaps them with the interview. Fallback chain: no background support → run the same subagent blocking (it still isolates the search noise); no subagent at all → do the searches inline on the main thread. The offer panel always stays on the main thread (a subagent cannot prompt the engineer).
- **Detect fresh, never hardcode (the discovery subagent's job, or inline in the fallback).** For EACH item, run `npx skills find <tool-or-package>`; if weak, retry aliases from package or org names. Collect every credible Agent Skill; one hit must not suppress another tool's search. Confirm with `npx skills add <owner>/<repo> --list` when practical. If the CLI is interactive or unavailable, search `"<tool>" "agent skill"` and confirm before offering. MCP: connector list first, else `"<tool>" "MCP server"` per item. Never hardcode which tools have skills or servers.
- **Skip the known.** Do not offer what `npx skills list` or `AGENTS.md` shows already installed, or what `AGENTS.md` records as declined (the no nag rule). MCP (Model Context Protocol) is a cross tool standard: if a relevant server is already connected its tools simply appear available, so use them and do not offer them again.
- **Cache discovery.** Use `docs/.agent-cache/tool-discovery/<slug>.md` when available: date, tool, skill and MCP candidates, installed and declined. Reuse it when under 30 days old, then subtract installed and declined before offering.

## Step 3: Offer what you found, the engineer chooses

Present one Agent Skills panel: "Install relevant Agent Skills for this stack?" with every found skill grouped by technology, plus skip and decline. Do not pick one winner. Then a separate optional MCP panel: "Optional MCP servers that could help this stack" with every found server, plus skip and decline. MCP is upside, not required.

Found nothing? Say so plainly and move on. Never invent a candidate to fill the panel.

## Step 4: Act on the pick

Skill: `npx skills add <owner>/<repo> -y` (into the project's agent). MCP: connecting is a user config step (their MCP settings, e.g. `claude mcp add …`), so you cannot do it for them. Point them there, and note that the tools are used automatically once connected.

## Step 5: Record

Skills installed → carry into the spec's `## Decision` **Implementation skills** field when you write it, and flag for the `## Agent skills` section of `AGENTS.md` (one bullet per skill, with its location, so only the needed skills load). Servers connected → flag for that section's compact `MCP servers:` line. Anything declined or skipped → flag for its compact `Declined:` line so a later stage does not offer it again (root for project wide tech, the nested area doc for area specific tech). `/audit` and `/sync` own writing `AGENTS.md`.

## Step 6: When nothing can be searched, installed, or connected

No search, install, or connect capability, or the engineer picked `Not now, later`: add a passive spec `## Follow-up` naming the skill or the MCP server the engineer could add for this tool, and what it would buy them.
