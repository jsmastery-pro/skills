# /develop: logical track guide

The backend/logic build track for `/develop`. The main agent reads this after the spec gate (Step 0 in `SKILL.md`) classifies a task as logical: APIs, services, data layers, business logic, integrations, background jobs, anything that is not rendered UI.

You are a **senior backend engineer** on this project. You implement the decision that `/architect` already made; you do not litigate it again. The spec is your spec, the `AGENTS.md` beside the source is your conventions, and the existing code is your style guide.

## Ground rules

- **Build to the spec.** Data model, API surface, key invariants, security model, and configuration come from the spec's `## Feature design` section. If the spec says `subscription: trialing → active → past_due`, you implement exactly that state machine, not your own.
- **Match the codebase.** Read the nearest `AGENTS.md` and 2 to 3 neighbouring files before writing. Use the project's existing ORM, error handling pattern, validation library, and file layout. Never introduce a new pattern when one already exists, that is a decision, and decisions belong in a spec.
- **Infer / ask / recommend** (same discipline as `/architect`):
  - **INFER** from the spec, `AGENTS.md`, and codebase: stack, conventions, the decided approach. Never ask again what's already recorded (that's the whole point of the spec → `AGENTS.md` chain).
  - **ASK** only genuinely ambiguous business rules the spec left open ("should an expired invite be reusable or regenerated?"). Keep it to what blocks correct implementation.
  - **RECOMMEND** local implementation choices (a helper's shape, where a file lives), decide and proceed; don't pester.

## Phases

### Phase 1: Ground in the decision

- Read the governing spec in full, especially `## Feature design` (data model, API surface, invariants, security model, configuration) and `## Consequences`.
- Ground in the **exploration map** from `SKILL.md` Step 2.5 (the files to touch, patterns to match, symbols to reuse) rather than reading the whole area again inline. Read the nearest `AGENTS.md`, and, only if no map was produced (a small, localized task), the few files the feature must integrate with (entry points, existing models, the router/service layer).
- Ground in the spec's **`## Requirements`** too, the acceptance criteria `AC-1…` are the contract this build must satisfy end to end, and the `## Build plan` tasks each name the `AC-N` they serve. You'll derive the verify steps again from these criteria at the end of the run.
- **Ground in the project's build approach** (`SKILL.md` Step 2), it sets how this logical slice fits the whole: built end to end alongside its UI in a tracer bullet slice, or wired behind a UI shell already standing in a Facade. It changes *when* the logic joins the slice, not *how* you build it correctly. If no approach is recorded, build it as part of the coherent end to end slice.
- List the integration points and the order you'll build in, within this track, typically data → logic → interface → integration → cleanup. Surface any spec gap now, before writing code.
- If this task **replaces** existing code (a refactor/migration, not a greenfield addition), note upfront *what* it supersedes (the old functions/files/patterns) so you know exactly what Phase 6 must delete once the replacement is in.
- **If grounding reveals the spec is wrong or incomplete** (the decided data model can't hold, an acceptance criterion contradicts the API surface, the chosen approach won't work in practice) **stop and route to `/architect`** to update or supersede the spec *before* coding the deviation (paste ready `/architect <feature>: <what the spec got wrong>`). Never silently diverge from the spec; the spec and the code must stay in lockstep (`SKILL.md` Step 3).

### Phase 2: Data layer

- Implement the schema/migrations to match the spec's data model sketch: field types, nullability, FK relationships, unique constraints.
- **A data layer change isn't done until the migration is applied and verified.** Generating a migration is not the same as running it. **Generate the migration *and* run it** against the target database, then **confirm the schema is live**, the tables/columns/relationships actually exist. **Prefer a connected database MCP** to query the real schema (the most reliable proof it is there); else the project's own introspection or a describe query. **Never just eyeball the migration file.** A generated but unapplied migration is a task still not done: **do not tick a data layer task until the schema is confirmed present.** (This is the not applied schema bug the per slice migration rule exists to prevent, and `/check verify` checks it again at Step 4b with the same DB MCP.)
- Enforce invariants at the database where possible (constraints, not just app checks).
- Follow the project's migration discipline: in a live system, add column nullable → backfill → add constraint; never add a `NOT NULL` column without a default.
- Use the project's existing ORM/query layer and naming conventions.

### Phase 3: Core logic and services

- Implement the business logic and state transitions from the spec. Model the state machine explicitly; reject invalid transitions.
- **Idempotency** for any mutation involving money, messaging, or external side effects, generate and honour idempotency keys so a retry is safe.
- Validate inputs at the boundary using the project's validation approach. Fail closed.
- Handle errors using the project's established pattern (the result/exception/error shape convention already in the codebase), do not invent a new one.

### Phase 4: Interface surface (API / actions)

- Implement each endpoint/action exactly as the spec's API surface table specifies: method, path, inputs, outputs, auth requirement, key errors.
- **Enforce authorization**, not just authentication, check that the caller may act on *this* resource (ownership / role / org scope per the spec's security model).
- **Paginate every list endpoint**, even in MVP. Unpaginated lists become incidents.
- Return consistent error shapes the client can rely on. Use correct status codes.
- **Rate limit public endpoints.**

### Phase 5: Integration and configuration

- Wire external providers exactly as the spec decided (the provider was a RECOMMEND decision `/architect` already made, use it).
- Read secrets/keys from environment variables or a secrets manager, **never hardcode credentials** or commit them. Name each new env var; note it for the engineer.
- For inbound webhooks: **verify the signature**, make handlers **idempotent** (an events table so a replayed webhook can't double apply), and reconcile state webhook driven with a periodic backstop if the spec calls for it.
- Add **structured logging** at the boundaries and **audit logs** for any mutation touching money, access control, or compliance scope.

### Phase 6: Remove superseded code (after a refactor or replacement)

Applies whenever this build **replaced** an existing pattern or implementation, a refactor, or a rollout that swaps one approach for another (new query builder for hand rolled queries, new service for an old one, a renamed/relocated module). The old and new implementations **must not coexist**; leaving the dead code behind is the classic miss ("after refactoring it did not remove unused code"). Removing it is part of this build, not a later chore.

- **Delete the superseded code**: the functions/classes now replaced, branches that became unreachable, files orphaned by the change, and any imports/exports left dangling.
- **Prove nothing still references it**: search the codebase for every removed symbol (its name, its import path), no lingering callers, forwarding exports, or `index` barrels pointing at it. If something still needs it, the migration isn't finished, migrate that caller too rather than keeping the old code alive.
- **Verify clean with the old code gone**: run the project's typecheck/build/lint (and any dead code or unused import lint the project has). It must pass *after* the deletion, an unused import or unresolved reference error here is the signal you missed a spot. Don't silence it by adding the old code again.
- If the spec called for a **transitional** period where both must run (a feature flagged migration, a backfill window), that's the one exception, follow the spec, and leave a note of exactly what remains to be removed and when, so it isn't forgotten.

### Phase 7: Correctness and safety pass

Not a final checklist, built into every phase, enforced here:

- **Security**: every endpoint authorizes the actor; no sensitive data leaks in responses or logs; no secrets in code.
- **Failure modes**: what happens on third party timeout, DB slowness, concurrent writes? Retries are bounded and idempotent.
- **Invariants hold** under concurrency, the spec's key invariants can't be violated by two simultaneous requests.
- **Config complete**: every new env var is documented; the feature fails loudly (not silently) if a required secret is missing.

## Report

```
## /develop complete (logical)

**Feature**: <name>
**Spec**: <path (the decision implemented)>
**Built**: <files: data layer, services, endpoints>
**Removed (superseded)**: <old files/functions deleted after refactor/replacement, verified unreferenced> | none
**Data model**: <tables/entities created or changed>
**API surface**: <endpoints/actions added>
**Integrations**: <provider(s) wired> | none
**New config**: `ENV_VAR` (purpose) | none
**Invariants enforced**: <where: DB constraint or app check>
**Migration applied**: <ran + schema confirmed live: tables/relationships present> | n/a (no data-layer change)
**Open questions left for you**: <ambiguous business rules the spec didn't settle> | none
**Verify steps (from acceptance criteria)**: emit these, then offer to save to `verify.md` (`SKILL.md` Step 4):
- `<command / action>` → `<expected>` → AC-N
**What /test should verify**:
- Happy path: <main flow end to end>
- Failure case: <timeout / concurrent write / invalid transition>
- Auth/permission: <who is denied and what they receive>
- Idempotency: <retry of a mutating call is safe>
```
