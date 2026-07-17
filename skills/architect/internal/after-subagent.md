# Architect Main Flow: after the spec is written

### After the spec is written

You wrote the spec yourself on the main thread. Now check your own work for completeness, offer the engineer a cross check, and confirm it. That check and every fix stay on the main thread; the only thing you may delegate is an optional read only cross check the engineer asks for (it reads the spec and returns a critique, writing nothing). Never fetch any of the spec's links again, at any point (they were fetched once during the design conversation and are now human facing).

**First: did the write land?** If the spec file is missing or empty, something went wrong in the write; report it and write it again, never fabricate a spec summary. Only if the file exists, continue:

**Check your own work before presenting**: Read the spec you just wrote again. For a directory spec read both `index.md` and its `rationale.md` (the decision record sections live in `rationale.md`; the single file shape has everything in the one file). Verify all required sections exist across the file(s):
- All modes: `## Summary` (the plain words human quick read, no dashes, in `index.md`/the file), `## Requirements` (IDed acceptance criteria, the confirmed spine), `## Decision`, `## Consequences` (build spec, in `index.md`/the file); and `## Context`, `## Options considered` (unless "Documenting a made decision"), `## Rationale` (decision record, in `rationale.md` for a directory spec, inline otherwise). A directory `index.md` also carries the one line `## Rationale` pointer to `rationale.md`.
- Data backed modes: `## Build plan`: ordered tasks, each tagged with the AC(s) it satisfies, migration first; every AC traces to at least one task
- Feature mode: `## Feature design` with the confirmed data model, the **Value sourcing** table (every value each action produces, computes, or displays has a named source; no blank source for a value an AC requires, that would be an undecided input left for the build), and Critical test scenarios (mapped to ACs) populated
- Architecture mode: `## Proposed stack` with every relevant layer filled
- Decision only specs (Architecture, Cross cutting): no `## Build plan` of implementation steps and no invented meta ACs; the spec is `## Proposed stack` / `## Standard definition`, and the executing feature (e.g. the scaffold sub task) derives its steps at `/develop` time. If a scaffold style build plan appears in a stack spec, strip it before presenting.
- Enhancement mode (a migration that is not trivial): `## Migration plan` with Strategy, Phases, Rollback, and Risks
- Cross cutting mode: `## Standard definition` with Canonical pattern, Replaces, Enforcement, Rollout, and Exceptions

If a required section is missing or a field is blank/placeholder, add this line directly after the spec path in the presentation: `⚠️ Incomplete: [section name] came out blank, e.g. "⚠️ Incomplete: ## Feature design > Security model was left as a placeholder. Request it in your feedback."`

**Cross check (independent read of the spec, especially for decision completeness).** An independent model catches load bearing gaps the author is blind to (see spec 0002). **Always ASK; never run it, and never skip it, on the engineer's behalf** (the point is to keep the engineer aware of load bearing decisions, so the decision to run it is theirs). Present the panel below; set the recommended option by the feature's effective workflow tier (its own tier tag if set, else the project default on the scope `**Workflow:**` line, read in pre-flight), and always make the recommendation explicit with a one line why:
- **`Full` or `Medium` tier** → recommend `Another model` **strongly**: these are where a load bearing gap does real damage, and the bug that motivated this (spec 0002) was a `Medium` feature. Recommend it clearly, but the engineer chooses.
- **`Lean` tier** → recommend `Another model` for a foundational or risky spec, else offer without a strong push.
- **`Vibe` tier, or no scope row** → recommend `Skip` (or `Same model` for a foundational spec).

Present the panel (capability first: `AskUserQuestion` on Claude Code, else the same options as plain text; exactly one option marked recommended per the tier rule above, the picker adds the custom slot):
- **question**: "Cross check this spec before you review it? (Recommended: `<tier-based pick>`.)"
- **header**: "Cross check"
- **options**:
  - `Another model`: a read only critique pass on a different, capable model, which catches what the model that wrote the spec is blind to.
  - `Same model`: a read only critique pass on this same model (a fresh eyes critique of its own work).
  - `I'll review it myself`: no AI critique; show the spec and let the engineer scrutinise it.
  - `Skip`: go straight to accept.

Act on the pick:
- **Another model / Same model** → spawn a READ-ONLY cross check subagent that reads the drafted spec and returns its critique only; it writes nothing, the main thread applies any fix. Set its model explicitly, not inherited: for `Another model`, a capable model different from the one that wrote the spec; for `Same model`, this session's model. Brief it to stress test the design from the spec text and its own knowledge only, covering two jobs:
  1. **Decision completeness (the primary job).** List every value each action, endpoint, or read path must produce, compute, or display to satisfy the acceptance criteria whose **source the spec does not name**, and every decision the builder will have to make that this spec does not settle. This is the check that catches a load bearing gap the spec author's own introspection missed (e.g. an AC that needs "the user's local day" with no timezone source named). Report each as a gap to close before build, not a nitpick.
  2. **Soundness.** Does the design hold up? Is there a materially simpler option? What failure mode is missed?
  Brief it to NOT fetch the spec's reference links, now or later (human facing). Surface its findings as a short "Cross check" note. **Do NOT silently resolve or auto edit a decision completeness gap** (each one is a load bearing decision, and those are the engineer's, not yours): list every gap with the resolution you recommend (the source you would name, or the answer you would pick, always give your best recommendation, do not just present options), then ASK how to proceed, `Apply the recommended fixes` (recommended) · `Let me answer each one` · `Leave them, I'll decide later`. Edit the spec only on the engineer's pick. Pure soundness nitpicks (not a decision, e.g. a clearer wording) you may fix directly and note. No subagent capability → do the same model pass inline on the main thread (weaker, note that the independent check did not run).
- **I'll review it myself** → run no AI critique. Present the spec for the engineer to read, and say they are reviewing it themselves.
- **Skip** → no critique.

**All four branches then go to step 1.** The cross check never ends the run and never decides anything: it only produces a note. The moment it is done, whether a subagent critiqued the spec, the engineer read it themselves, or nothing ran at all, you present the spec and ask whether to accept it. Never treat a finished cross check as acceptance, and never accept the spec on the engineer's behalf.

1. Tell the engineer the spec path, a one line preview from your report, and (if a cross check ran) its note:

   ```
   Draft spec written to `docs/specs/<NNNN-title>.md`
   Decision: <Decision line from report>
   Key tradeoff: <Key tradeoff line from report>
   Cross-check: <one-line verdict + any issue raised · or "you're reviewing it yourself" · or "skipped">
   ```

   Then present the confirmation decision panel (capability first: `AskUserQuestion` on Claude Code, else the same options as plain text):
   - **question**: "Accept this spec, or change it?"
   - **header**: "spec"
   - **options**: `Accept, looks solid (recommended)` · `Change something, I'll tell you what` · `Rethink the approach`
   On **Change something**, ask what to change (this also covers overriding a ⚠️ Premise note: if the engineer disagrees with it, remove it and proceed with their direction) and apply targeted **Edit**s to the sections called out, never a from scratch rewrite. On **Rethink the approach**, revisit the relevant stage(s)/options and revise. Either way, present the SAME panel again (not a plain "reply yes") and loop until the engineer picks **Accept**.
2. **On Accept: ratify the decision; the status follows the spec kind** (per the status model in *What this skill does*; discriminator: whether a buildable scope feature links this spec, computed in step 3):
   - Feature linked spec: do not edit the status line; a confirmed but unbuilt spec correctly stays `Proposed` (/develop advances it).
   - Standalone decision spec: set `**Status**:` to `Accepted` on this confirmation (ratification is the deliverable; /develop won't advance it, `Proposed` would strand it).
   - Already shipped documentation path: born `Accepted`; leave it, /sync reconciles against the scope.
3. **Derive tasks + link the scope (after confirmation).** Use the scope feature found in pre-flight (or find it again cheaply by scanning scope filenames/headings across per workspace subdirs; open only the single scope file containing it, `scope.md` or the matching `<epic>.md`).

   **Finding the decision box (do not match on one fixed string).** Every feature carries exactly one decision box: the sub task whose label ends with `(spec)`. Its wording varies by feature, `Design it (spec)` on a normal feature and `Decide the stack (spec)` on the Stack and architecture feature, so locate it by that `(spec)` suffix, not by an exact label. Every other sub task is an execution box (`Scaffold from the decision: /develop …`, `Build it: /develop …`, `Verify it`, `Test it`) and is never ticked here.

   - **Decision only spec** (ARCHITECTURE stack decision or CROSS-CUTTING standard, no `## Build plan` by rule) → no build tasks to copy. Link the row's `spec` cell (relative path, as below), tick the decision box `[x]`, and leave the execution sub task(s) untouched (e.g. `Scaffold from the decision: /develop …` on the Stack and architecture feature) so `/develop` derives those steps from the decision at build time. Do not write scaffold or implementation steps into the row (the double spec bug this avoids).
   - **A matching scope feature exists (buildable feature spec)** → update the feature to the built ready shape (the scope's main living update, done every time a spec is captured). Make exactly these edits, nothing else:
     1. Tick the decision box `[x]` (located as above) and remove the `· needs a decision` tag from the heading (it is decided now).
     2. Link the spec on the feature's pointer line, computed as a relative path from the scope file to the spec: from `docs/scope/api/…` to `docs/specs/api/0001-x.md` is `[0001](../../specs/api/0001-x.md)`; to a directory spec (umbrella or single with files), `[0001](../../specs/api/0001-x/index.md)`; single repo `docs/scope/` → `docs/specs/` is `../specs/…`.
     3. Define the build milestones, a rollup, never the atomic dump: add a `- [ ] Build it: /develop <feature>` box, and under it 2 to 5 milestone sub items rolled up from the spec's `## Build plan` by grouping its atomic tasks into coherent chunks (by AC cluster or by layer), each tagged with the ACs it covers. The atomic tasks and per task detail stay in the spec's `## Build plan`. The 2-to 5 is a guideline you reason about, not a rule: if it won't fit in about five milestones the feature is too big and should be split. Never a fixed milestone list; derive them from THIS spec's Build plan.
     4. Add `- [ ] Verify it: /check verify <feature>` and `- [ ] Test it: /test <feature>` boxes after Build.
     5. Move the feature's status to `in-progress` (designing is progress) in the At a glance table and beside the heading.
     6. Enroll what the spec surfaced: a `## Follow-up` item that is really a separate feature (not part of this one) becomes a new scope feature tagged `from spec NNNN`. Deferred follow ups that block nothing go to the Deferred list.

     Edit only this feature (and any newly enrolled follow-up), never other features' contents. The result stays coarse (a milestone rollup, not a task dump) while every box is a command or a tracked milestone: Design → Build (+ milestones) → Verify → Test.
   - **NO matching feature** → the atomic tasks stay in the spec's `## Build plan`; ask via a panel (capability first): question "Track this feature on the scope?", header "Scope", options `Yes, enroll it` · `No, keep it in the spec only`. On **Yes**, enroll a coarse scope feature (heading + intent + `Done when:` line) with the same built ready shape as above (Design ticked + spec link + the milestone rollup + Verify + Test boxes). On **No**, leave the scope untouched and note in your final message: "This spec isn't on the scope. Its build tasks live in `## Build plan`; run `/scope` later to enroll it." (Silent orphan specs are exactly the drift a later bare `/scope` reconcile has to surface.)
4. **Spoken summary in chat (plain words, no dashes).** After acceptance and scope linking, show a short plain language summary (per *Output style*): what the spec decided, why in one line, and what happens next (the build tasks it produced, and which skill to run next). A template:

   ```
   Done. Here is the quick version.
   What we decided: <one plain sentence>.
   Why: <one plain sentence>.
   What is next: run /clear to start a fresh session (it reads this spec from disk, so nothing is lost and the long design chat you just had stops costing tokens), then /develop <feature> to build it.
   ```

   Keep it plain; gloss any jargon in parentheses. This is the human read, separate from the spec file's own `## Summary`.

/architect is complete when the engineer confirms the spec (status per step 2 above). It does not invoke other skills.

---
