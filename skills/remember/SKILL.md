---
name: remember
description: Save what matters at the end of a session so the next session picks up exactly where you left off. Or restore context at the start of a new session so nothing is lost between them.
---

AI has no memory between sessions. Every new session starts blank. This skill fixes that.

Run it at the end of a session to save. Run it at the start of a new session to restore. That is all it does — but done consistently, it means nothing ever gets lost.

## How to Invoke

**To save at end of session:**

```
/remember save
```

**To restore at start of new session:**

```
/remember restore
```

If the developer just runs `/remember` without specifying — ask them which one they need.

---

## Save Mode

When the developer runs `/remember save`:

### What to capture

Review the current conversation to extract only what a developer would genuinely need to continue this work in a completely fresh context. Do not include sensitive data such as credentials, API keys, or tokens in the saved memory. Not a transcript. Not a summary of everything that happened. The essential state.

Think like someone handing off a project to a colleague who is equally skilled but knows nothing about what happened today. What would they need to know to continue without losing anything?

Capture:

**What was built** — specific files created or modified, features completed, components added. Be precise. Not "built the auth flow" — "created app/(auth)/login/page.tsx, app/(auth)/callback/page.tsx, and middleware.ts. OAuth with Google and GitHub working end to end."

**Decisions made** — choices that would be hard to reverse or that future work depends on. Not implementation details — architectural choices. "Chose to use server-side data fetching over client-side — avoids loading states and keeps sensitive logic off the client."

**Problems solved** — any issue that took time to figure out. So the next session does not solve the same problem twice. "Third party auth callback requires a trailing slash in the redirect URL — fixed in the callback handler."

**Current state** — exactly where things stand right now. What works, what is partial, what is known to be broken.

**What comes next** — the very next thing that needs to happen. Specific enough that the next session can start immediately without figuring out where to begin.

**Open questions** — anything unresolved that the next session needs to address.

### What not to capture

- Implementation details that are visible in the code
- Decisions already documented in context files
- Anything that can be inferred by reading the codebase
- The process of how something was built — only what was built and what was decided

### Where to save

Write the memory to `memory.md` in the project root. This file always contains only the most recent session state.

If `memory.md` already exists, show the developer a brief summary of what is currently saved and ask for confirmation before overwriting:

```
memory.md already exists from a previous session.
Current memory covers: [one-line summary of existing content].

Overwrite with this session's memory? (yes / no)
```

Only overwrite after the developer confirms. If they say no, do not write anything.

### Format

```markdown
# Memory — [Feature or Session Name]

Last updated: [date and time]

## What was built

[Specific files, components, features completed this session]

## Decisions made

[Architectural and implementation decisions that future work depends on]

## Problems solved

[Issues resolved this session — so they are not solved again]

## Current state

[Exactly where things stand — what works, what is partial, what is broken]

## Next session starts with

[The very first thing to do in the next session — specific and actionable]

## Open questions

[Anything unresolved that needs addressing]
```

After writing the file, confirm to the developer:

```
Memory saved to memory.md.

Next session: run /remember restore to pick up from here.
```

---

## Restore Mode

When the developer runs `/remember restore` at the start of a new session:

### Step 1 — Find the memory

Look for `memory.md` in the project root. If it does not exist, tell the developer:

```
No memory.md found in this project.

Either this is the first session, or the file was not saved.
To save memory at the end of a session, run /remember save.
```

### Step 2 — Read everything available

Read `memory.md` first. Then check for these specific context files if they exist and read only those:

- `CLAUDE.md`, `.claude/context.md` — Claude Code
- `.github/copilot-instructions.md` — GitHub Copilot
- `.cursorrules`, `.cursor/rules/` — Cursor
- `.windsurfrules` — Windsurf
- `AGENTS.md` — Codex
- `.clinerules` — Cline
- `context.md` — generic fallback

Do not scan or read other files beyond this list. Build the most complete picture possible from what is available.

### Step 3 — Confirm what was restored

Do not start building. Do not assume the developer wants to continue immediately. Summarise what was restored so the developer can verify Claude understood correctly.

```
Memory restored. Here is where we are:

**Last session:** [what was built]
**Current state:** [what works right now]
**Decisions in place:** [key decisions that are locked]
**Next up:** [what the next session should start with]

Is this correct? Say yes to continue, or correct anything
that does not look right before we proceed.
```

Only after the developer confirms does the session continue.

### If memory is incomplete or unclear

If `memory.md` exists but is missing important context, say so honestly:

```
I found memory.md but some context seems missing —
[what is unclear or absent].

Should we continue with what we have, or do you want
to fill in the gaps before we start?
```

Do not guess. Do not assume. Surface the gap and let the developer decide.

---

## The Rule

Every session ends with `/remember save`.
Every session starts with `/remember restore`.

That is the whole system. Consistent use is what makes it work.
A skill used sometimes is a skill that cannot be relied on.
