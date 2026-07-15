# 0001 · The develop gate records overrides as Assumed specs

**Status**: Accepted
**Date**: 2026-07-15
**Owner**: architect (this decision spec)

## Summary

`/develop` has a gate that stops the build when a load bearing decision is owed and unrecorded, and routes to `/architect`. The gate detects the condition correctly, but two of its escape options let the build proceed on a decision that is never written to the repo: the assumption lives only in the chat and in the resulting code. This spec closes that gap by adding one spec status, `Assumed`, so that any override still leaves a durable record, and by blocking a feature from `done` until an `Assumed` decision is ratified by `/architect`.

## Context

The workflow's central promise is that every load bearing decision lives in a file in the repo, not in a chat, so work survives a cleared session and a teammate can pick it up. `/develop` is the control that enforces this: before building, it asks "to build this, would I have to invent something the engineer hasn't decided?" and if yes it stops.

A review (David, 2026-07) found a path where the guarantee does not hold. There are two checkpoints in `/develop`:

- **The spec gate** (`skills/develop/SKILL.md`, Step 0): fires first. Its `Skip for now` option was described as "build it without a spec; I'll backfill the decision later," and proceeded to build, leaving only a `⚠ spec pending` note in the scope.
- **The completeness check** (`skills/develop/flow/build.md`, Step 2): fires after the spec is read. When a load bearing section (data model, API surface, security model) was missing, its `Use your best judgment` option let the agent invent the missing architecture and build against it.

Chained, these let `/develop` detect a missing decision, build anyway on an assumption it is forbidden to write down (`/develop` never writes specs), and leave the actual decision (the data model, the provider, the security behavior) only in the conversation. After `/clear`, a new session or a teammate sees the code and a pending note, but not the decision, its constraints, or the alternatives. `/sync` can flag that something was built but cannot recover the reasoning from code. That is the exact failure the workflow was built to prevent.

The README stated "it stops and sends you to `/architect` first." The behavior was "it stops, unless the user authorizes it to continue without recording the decision." That is a materially different contract.

## Options considered

1. **Strict: remove the load bearing bypass entirely.** Only two paths at the gate: architect it first, or the engineer asserts there is genuinely nothing to decide. Strongest guarantee, no new artifact. Rejected as the default: it forces a full `/architect` round trip and a session handoff on every feature that carries a real but small decision, which fights the "run only what you need" design and pushes people to lie at the "nothing to decide" option.
2. **Separate waiver file.** A new artifact type recording the deferred decision. Rejected: it invents a parallel store beside specs, with its own lifecycle for everyone to learn, and duplicates what a spec already is.
3. **Assumed spec status (chosen).** Reuse the existing spec artifact and its status line. Add one status, `Assumed`, that means "recorded but not deliberated, must be ratified before the feature can close." Keeps a single source of decisions, reuses the lifecycle `/sync` and `/check` already understand, and makes ratification a normal `/architect` run.

## Decision

Add the spec status **`Assumed`** to the lifecycle (`Proposed → In Progress → Accepted`, with `Superseded`; `Assumed` is a parallel, pre deliberation state).

An `Assumed` spec means: a load bearing decision was taken provisionally during a build, on a stated assumption, and has not been deliberated by `/architect`. It must be ratified before the feature it governs can be marked `done`.

The gate keeps a human override, but an override can no longer be ephemeral. Concretely:

- **The spec gate (`/develop` Step 0).** The third option changes from "skip and backfill later" to **`Build now, record it as an assumed spec`**: `/develop` writes a minimal `Assumed` spec, then builds. The first two options (`Architect it first`, `No real decision, build directly`) are unchanged.
- **The completeness check (`/develop` build flow Step 2).** `Use your best judgment` survives **only for local implementation details** already governed by the spec (a pagination size, a sort order). It is removed for load bearing fields (provider, data model, security model, public interface, feature behavior). For those the options are `Update the spec first`, or `Tell me the answer now`, and either the engineer's answer or the assumption is written into the `Assumed` spec before the build continues.
- **The done gate.** A feature cannot reach `done` while any governing spec is `Assumed`. This is enforced by the status machine: `/develop` only ever moves a spec `In Progress → Accepted`; it never moves `Assumed → Accepted`. An `Assumed` spec therefore cannot reach `Accepted` until `/architect` clears it.

### Ownership

The `Assumed` spec has two parts, written by two skills at two times. This keeps `/architect`'s ownership of real decisions intact.

| Part of the file | Author | When |
|---|---|---|
| Assumption record (owed decision, the assumption built on, who authorized it, code area) | `/develop` (new, narrow) | at build time |
| Decision content (context, options, rationale) | `/architect` (unchanged) | at ratification |

| Status move | Who |
|---|---|
| none → `Assumed` (mint the stub) | `/develop` (new) |
| `Assumed` → real (`In Progress`/`Accepted`) via ratification | `/architect` only |
| `Proposed → In Progress → Accepted` (build lifecycle) | `/develop` (existing) |
| anything → `Superseded` | `/architect` only |

The refined invariant: **deliberated decisions are authored only by `/architect`; `/develop` may record an undeliberated assumption as an `Assumed` spec, and may never write rationale, deliberate, or promote a spec past `Assumed`.** `/develop` writes the stub inline on the main thread (it is recording a stated assumption, the same class of write as the scope notes it already makes), never via a subagent and never by triggering `/architect` (a handoff would defeat the escape hatch; an architect subagent would deliberate, which is what the engineer chose to defer).

An `Assumed` spec does not follow the normal feature status mirroring (an `in-progress` feature would otherwise pull its spec to `In Progress`). It stays `Assumed` until `/architect` ratifies it.

### Ratification

Ratification is always a separate, manual `/architect` run. It is never automatic and never happens inside `/develop`.

- **Recommended timing:** right after the build lands, before `/check verify` and `/test`, because ratification can find the guess wrong and force a rebuild, and verify/test work against a doomed model is wasted.
- **Hard deadline:** before the feature can be marked `done` (the done gate enforces this).
- **`/develop` nudges it:** when a build finishes on an `Assumed` spec, the closing report recommends `/architect <feature>: ratify the assumed <decision>` as the next step, and states the feature cannot be marked `done` until then.

When `/architect` ratifies, it deliberates the decision against the code that was built and either:

- **the assumption holds** → it writes the real decision content and clears `Assumed` (the feature then closes the usual way, `/develop` moving the spec to `Accepted` at `done`), or
- **the assumption was wrong** → it writes the corrected decision, marks the assumed spec `Superseded`, and `/develop` rebuilds against the real one before anything is called `done`.

### Assumed spec shape

`/develop` writes a single file `docs/specs/NNNN-<slug>.md` (or `.workflow/specs/…`), minimal:

```markdown
# NNNN · <feature>

**Status**: Assumed
**Date**: <today>
**Authorized by**: <engineer>, during /develop

## Owed decision
<the load bearing choice that was not made, e.g. the roles / plans / permissions data model>

## Assumption built on
<the concrete assumption the build used>

## Code area
<paths the build touched>

## Requirements
<acceptance criteria seeds carried from the scope Done when, if any>

## Ratify
This decision was recorded by /develop, not deliberated. Run `/architect <feature>`
to deliberate and ratify it. The feature cannot be marked `done` until then.
```

## Consequences

- The README promise becomes true and honest: it stops and routes to `/architect`; if you override, the assumption is recorded as an `Assumed` spec and the feature cannot close until `/architect` ratifies it.
- Quick features are unaffected: pure implementation never trips the gate, and "no real decision, build directly" stays a one click path.
- Never ratifying is allowed but not free: the feature stays unclosable and the `Assumed` spec is surfaced as decision debt by `/scope` and `/sync`. The workflow does not block a `git merge` (its checks are warnings, not walls), but the assumption, its author, and the fact that it is owed are all durable in the repo, which is the guarantee we actually make.
- `/develop` gains one narrow spec write it did not have (create an `Assumed` spec). This is bounded: it can only mint `Assumed`, and only the assumption record fields.

## Follow-up

Files this decision changes:
- `skills/develop/SKILL.md`: Step 0 gate options, Artifact ownership (the `Assumed` exception), done gate note.
- `skills/develop/flow/build.md`: completeness check options, the `Assumed` spec write, done gate in Step 4, ratify nudge in the report.
- `skills/architect/SKILL.md`: add `Assumed` to the status behavior and the ratify path.
- `skills/sync/SKILL.md`: surface `Assumed` specs as decision debt (flag, never clear).
- `skills/scope/SKILL.md`: surface assumed built features in the where things stand readout.
- `README.md` and `docs/workflow-guide.md`: correct the promise, document `Assumed` and ratification.
