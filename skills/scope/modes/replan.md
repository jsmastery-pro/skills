# Scope Mode: replan

## Replan (the living rhythm, run after a feature or phase ships)

The default cadence, not rare: run each time a feature or phase lands, keeping the scope matching reality and queueing the next slice. Reconciles in place, never spawns a new file; coarse and surgical (reconcile cells, append rows, don't rewrite the file).

1. Read the whole scope again (single file, or `index.md` + epics; the workspace's in a monorepo) and the code/specs for what just shipped.
2. Reconcile what shipped: mark completed features `done` (verify from code/spec, don't stamp); tick nothing unconfirmed; leave rows `/develop`/`/sync` already advanced. **A feature whose governing spec is `Assumed` cannot be `done`**: it was built on a decision that was recorded but not deliberated. Leave it `in-progress` with its `assumed decision (spec NNNN)` note, and surface it (below) as decision debt.
2a. Surface assumed decisions in the where things stand readout and the report: for each feature carrying an `Assumed` spec, list it as "built, awaiting ratification (spec NNNN `Assumed`)" and point to `/architect <feature>` to ratify. These are the decisions that were made provisionally during a build and still owe deliberation; they block their feature from `done` until ratified.
3. Enroll needs surfaced during the build: read shipped features' spec `## Consequences` and `## Follow-up` sections; a follow-up (e.g. "add rate limiting") not yet a scope row becomes a new `planned` row with intent, tier, `Needs spec?`; the scope grows from real build feedback.
4. Reprioritize / reorder: sequence `Order` again, adjust `Phasing` for work not yet built; foundations stay first; work dropped from scope → `dropped`. If the project's risk profile has clearly shifted (e.g. payments or auth were added), recommend the `**Workflow:**` default again via the plan Step 5b panel; otherwise leave it.
5. Queue the next slice: which feature(s) are next (lowest `Order` `planned` rows), each `Needs spec: yes` (→ `/architect` next) or `no` (→ `/develop`).
6. Report via the completion block (mode: replan): marked done, enrolled from spec follow-up items, reordered/dropped, next step.
