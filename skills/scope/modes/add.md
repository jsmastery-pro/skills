# Scope Mode: add

## Add (enroll one ad hoc feature, lightweight)

Inferred when a scope exists and the argument names a single feature: `/scope <a feature>` enrolls one coarse row without planning again, for a feature invented partway through. No `add` subcommand to type.

1. Read the scope again and dedup: present at any status → extend that row, don't duplicate.
2. Ask only what's needed (a short panel if intent/tier is ambiguous, else infer): intent, workflow tier (only if it differs from the project default, else inherit), placement (`Order` / `Phasing`).
3. Offer the per feature Approach: top option `(recommended) inherit the project default`, plus the named approaches (Tracer Bullet · Skateboard · Facade (prototype grade) · Journey); tag beside the heading only if it differs from the header default.
4. Set `Needs spec?` with the invent test: would building it require a decision the engineer has not made? Yes for a provider/library choice, a data model, a cross cutting pattern, the design system, a whole page/screen with no spec yet, or behavior that is not trivial (search, filtering, recommendations). No only for pure implementation an existing `design.md`/spec/convention covers. Unsure → yes; `Full`/`Medium` tier → almost always yes. Yes means its next step is `/architect <feature>`.
5. Append: an At a glance row (next free `#`, status `planned`) + a feature section under its phase with intent, a `Done when:` line, its one entry checkbox (no build task breakdown, derived from the spec later). Epic split: add to the right epic file, bump that epic's rollup in `index.md`.
6. Report briefly (mode: add): the row, tier (inherited or overridden), approach (inherited or overridden), Needs spec, next command.

Never enumerate build tasks in add mode; `/architect` derives milestones after the spec, and atomic tasks stay in the spec.
