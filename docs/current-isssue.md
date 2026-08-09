Claude found these by reading everything:

I read all 9 skills, both docs, the README, and the portability checker. Here's what I found, honestly — including where I think the real problem is, which isn't in the list of bugs.

Confirmed defects (verified, not inferred)

1. Mojibake in 17 report templates. The middle-dot separator is double-encoded as Â· (bytes c3 82 c2 b7) instead of · (c2 b7). I hexdumped to confirm. These are all in the completion-report blocks agents copy verbatim, so every affected skill prints a garbled header:

sync/SKILL.md:130 · test/SKILL.md:192,196 · check/modes/verify.md:152 · check/modes/review.md:123,125,126,128 · document/SKILL.md:107,109 · debug/SKILL.md:93 · scope/scope-template.md:140 · architect/agent-prompt.md:240 · audit/agent-prompt.md:355 · develop/ui/implementation.md:166,168 · docs/conventions.md:26

Some lines contain both the correct and broken form, so a partial re-encode happened at some point. npm run check doesn't catch it.

2. /check can't do what its own mode files instruct. check/SKILL.md:3 declares allowed-tools: Bash, Read, Grep, Glob, Write, Agent — no Edit, no AskUserQuestion. But verify.md:140-146 tells it to tick scope checkboxes and surgically rewrite a spec's **Status**: line, review.md:137 tells it to tick Review it, and review.md:44 explicitly says "Present via AskUserQuestion on Claude Code." Every other skill that edits files declares Edit. This one is the odd one out and it's the skill doing the most delicate surgical edits.

3. Broken code fences in two files. test/SKILL.md has 13 fence markers (odd count) — the report template at 191-197 closes, then the **Not covered** block at 201-203 sits outside it and line 204 is an orphan closer. check/modes/verify.md:148-167 is shifted by one: line 148 opens a fence around the prose instruction, so the actual template body at 152-160 renders as plain text and the **For /check review** note ends up inside a fence.

4. The README's headline diagram teaches the wrong order. README.md:8 shows /scope → /audit → /architect → /develop. README.md:49, workflow-guide.md:110-114 and audit/SKILL.md:17 all say the opposite for greenfield — stack decided and project scaffolded before /audit, and running it earlier is explicitly "premature." The most-read line in the repo contradicts the rest.

5. Hardcoded model attribution in commits. develop/flow/git.md:26 bakes Co-Authored-By: Claude Opus 4.8 (1M context) into every commit template. This is a tool-agnostic workflow that ships to Codex, Cursor, and Gemini users. It's also already stale.

6. Two skills claim ownership they violate. document/SKILL.md:30 says "It writes nothing else," then line 111 ticks Document it in the scope. check/modes/review.md:13,23 says findings are the only artifact, then line 137 ticks Review it. In a workflow whose whole trust model is fixed file ownership, the ownership tables need to be exact.

7. Stale subagent references in /document. Step 3 says the main thread writes and "Do not spawn a writer," but line 85 says "Pass the resolved range/version to the subagent" and line 87 says "The subagent must not invent timeline entries." Leftovers from the pre-refactor design.

8. Git integration is unreachable on brownfield. The ## Git block is only ever asked for in audit/modes/greenfield.md:18. Phases 2/3/4 never mention it. An existing codebase running /audit gets integration: off permanently unless the user hand-writes the block.

9. Smaller ones: /scope points twice at a "## /scope complete block" (scope/SKILL.md:65, plan.md:120) that doesn't exist under that name in the template. develop/SKILL.md:144 lists ./design.md among skill-bundled reference files — it's a project-root file, and /test correctly calls it that. sync/SKILL.md:62 uses $BASE two lines before defining it. audit/SKILL.md:61 "not a existing codebase."

Design issues worth arguing about
The tier contract is implemented five times in prose, and it's already drifting. "Effective tier = feature tag, else project default, else inferred" is re-derived independently in /scope, /architect, /develop, /check verify, and /test. The drift is visible: scope/SKILL.md:19 says /architect fills in Verify it and Test it; after-subagent.md:71 correctly says the boxes are tier-dependent and include Review it + Document it at GA. One of those is what the model will actually follow, and it's whichever it read last.

At GA, done fires before review and documentation. /test closes the feature at Beta/GA, but a GA feature still has Review it and Document it unticked. So /check review ticks a box on an already-done feature, and /test simultaneously offers done and suggests "/check review if a Review it box remains." Defensible if intentional, but nothing states the intent, and the tier's "last stage" is not its last box.

The output-style rule leaks into the user's product. "Write everything this skill produces, files and messages alike... never a hyphenated compound" governs /develop writing UI copy and /document writing changelogs and release notes. That's your house voice being imposed on the customer's product surface. /develop is explicitly told to write "real product specific copy (headline, supporting line, honest microcopy)" — under a rule that bans "state-of-the-art." Worth carving out generated product content and end-user-facing prose.

The thing I'd actually fix first
None of the above. There are no behavioral tests, and the skills are at their size ceiling simultaneously.

npm test runs the portability linter and nothing else. It checks bytes, dashes, and frontmatter — it cannot tell you whether /develop's spec gate actually fires, whether /check verify ever fabricates a PASS, or whether the tier logic resolves consistently. For a product whose entire value proposition is "the agent behaves this way," that's the load-bearing gap. Every defect above is a lint class of bug; the ones that would actually hurt users are behavioral, and nothing in the repo can see them.

Meanwhile the size numbers say you're out of room to add the guardrails that would compensate. 6 of 9 hot paths are over 90%; four are at 93.9%, 91.5%, 94.5%, 96.1%, 96.4%. A full /architect run loads SKILL.md (28KB) + design-conversation (26KB) + agent-prompt (28KB) + spec-template (17KB) + a mode file + after-subagent — roughly 25k tokens of instruction before it reads a single project file. Your own script comments warn against exactly the state it's in: "Fitting a ceiling to the current byte count makes the guard fire on every edit, and the only way past a guard that always fires is to raise it." That's where these budgets are now.

/develop's Step 0 gate is ~1,500 words explaining what counts as load-bearing. It's genuinely well-reasoned — the input-coverage test is a good idea, and the docs are commendably honest that it's "a strong gate, not an absolute guarantee." But past a certain instruction volume, more prose stops buying compliance, and you have no way to know where that line is because you can't measure it.

My recommendation: before the next feature, build a fixture harness — a handful of small repos, each with a known-right answer (a task that should trip the gate, one that shouldn't, a Prototype feature that should close at /develop, a verify run with no runnable app that must return BLOCKED). Run the skills against them and diff the artifacts. That's what tells you whether trimming 3KB off architect/SKILL.md broke anything, which right now you're guessing at.

Two things I'd push back on if you disagree: the fence and mojibake bugs are trivial to fix and I'd just do them. The testing gap is the one worth arguing about, and I'd hold that position.

Want me to fix the confirmed defects (1-9), or start on the test harness?
