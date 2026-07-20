# 0004 · Design the data model whole, migrate it sized to the feature

**Status**: Accepted
**Date**: 2026-07-17
**Owner**: architect (this decision spec)

## Summary

The build plan framed the data model migration as "task 1", implying you migrate the whole feature's schema up front. That is big design up front and it fights incremental slicing. This spec keeps the design whole (architect still models the full coherent feature model) but sizes the migration to the feature: one migration for a normal feature, sliced across slices only for a large feature or a thin thread approach, omitted for a slice touching no schema.

## Context

`/architect` runs per feature, so there was never a product wide up front model. But within a feature the build plan opened with the whole data model migration as task 1. For a Tracer Bullet thin thread that needs two columns, or a Facade shell that needs none yet, migrating the entire feature schema first is work the slice does not need, and it contradicts the build approach the same spec claims to follow. The counter pressure is real: the data model is the costliest thing to redo, which is why it must be *designed* carefully. The two were conflated: designing the model and creating all of it.

## Decision

Separate the design grain from the migration grain.

- **Design grain = the feature (unchanged).** Stage (b) still designs the whole coherent model for the feature, bounded by YAGNI (what the feature's ACs need, no speculation). The `Data model sketch` is the **target**, not a migration order.
- **Migration grain = sized to the feature.** One migration for a normal feature; sliced across the build slices that need it when the feature is large or the approach wants a thin thread first (Tracer Bullet), deferred under Facade; omitted for a slice that touches no schema. The build realizes the target incrementally.
- **Foundation feature = minimum viable schema**, only enough to stand the app up.
- **Unchanged:** the per migration rule that a data layer task is not done until its migration is applied and the schema confirmed live; and the "spec wrong partway → `/architect` updates the target → resume" path for real model changes discovered mid build.

## Consequences

- No speculative tables sitting empty for three slices; the schema is exactly as far along as the shipped slices need.
- Corner painting risk stays low because the whole shape is still designed up front; only creation is deferred.
- A late data decision is a normal slice migration (or an `/architect` enhancement/supersede), not a schema rewrite.
- Behavior change to the build plan ordering, so it should ride with the validation run owed on this session's changes.

## Follow-up

Files changed: `architect/agent-prompt.md`, `architect/spec-template.md`, `architect/agent-modes/feature.md`, `architect/internal/design-conversation.md`, `architect/internal/after-subagent.md`, `architect/SKILL.md`, `develop/flow/build.md`, `develop/logical-guide.md`. Owed: an end to end validation run of a data backed feature to confirm the sliced migration behaves.
