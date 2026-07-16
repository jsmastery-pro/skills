# Scope Mode: plan

### Step 1: Locate the scope; greenfield / brownfield / monorepo

Detect (skip `node_modules/` and `.git/`): source files (any `.ts`, `.tsx`, `.js`, `.py`, `.go`, `.rs`; presence ⇒ brownfield, none ⇒ greenfield); root `AGENTS.md`; existing scope under `docs/scope/` (`scope.md`, or `index.md` + epic files; monorepo: `docs/scope/<workspace>/`), noting the shape.

Read exactly one route file before continuing to Step 2:

- `modes/plan-monorepo.md` when workspace markers or multiple app/package manifests show a monorepo.
- `modes/plan-brownfield.md` when source files or a manifest show an existing codebase or an existing scope is being extended.
- `modes/plan-greenfield.md` when there is no source code and no manifest yet.

Do not read the other plan route files unless the classification changes. After the selected route has established the scope/workspace context, continue with Step 2 below.

### Step 2: Ask (generated question walk, as decision panels)

Do not follow a fixed script or a set number of rounds. Enumerate the planning dimensions THIS product needs (generate them from the idea and `AGENTS.md`), then ask them one after another as batched decision panels (up to 4 per panel), as many panels as it takes. Infer and skip anything already stated; ask everything else. The more thoroughly you ask, the better the scope: never cap the questions to save time, and never end while a load bearing dimension is unasked.

Cover at least these dimension groups (a checklist of what to reach, not an order to recite; add product specific dimensions freely):

- **Product & business**: MVP boundary (smallest version delivering the core value; most important); primary audience (only if unclear); monetization (free / subscription / one time / usage based / ads / none yet; shapes billing features); success metric (signups, activation, revenue; informs analytics features); hard constraints (deadline, budget, team size, compliance scope; shape phasing and weights).
- **Capabilities**: the cross cutting capabilities the product plausibly needs, by type (e.g. authentication, multi tenant orgs, payments/billing, email/notifications, file/media upload, search, realtime, admin panel, public API), as a multi select. Confirm in scope this slice vs deferred; each selected becomes one or more features. Name capabilities, never the implementing tool.
- **Cross cutting & go to market** (routinely forgotten, in the plan from day one): SEO (public/marketing pages, metadata, sitemap, structured data, social cards, SSR/SSG needs; skip for purely internal/auth walled apps); performance (Core Web Vitals targets, caching, expected load); analytics & tracking (product analytics, error monitoring, conversion events); accessibility (WCAG target); internationalization (languages/locales, RTL); legal/compliance (cookie consent, privacy/terms, GDPR/CCPA, age gating).

Each "yes" becomes its own feature or folds into a relevant feature's acceptance criteria seeds (e.g. "SEO metadata present" on each public page; cookie consent its own feature).

### Step 3: Choose the build approach (decision panel)

Decides how every feature is sliced and sequenced. No fixed procedure; reason about this product (goal, the product & business constraints from Step 2, production build vs throwaway), then present a panel of the named approaches, each stated by its guiding principle (not steps), recommending exactly one:

- **Tracer Bullet**: vertical slices; each feature built end to end through every layer, working.
- **Skateboard**: MVP first; ship the thinnest usable whole first, then grow it.
- **Facade**: UI first; a clickable shell on placeholder data, then wire the back. Prototype grade (fast to demo, not production complete).
- **Journey**: a complete user path end to end per phase.

Reason out the pick, never hardcode it or its mechanics: default for a proper production build is Tracer Bullet; shift only when the goal calls for it (fast validation of one core loop → Skateboard; the experience/funnel is the product → Journey; a quick clickable prototype → Facade, said plainly to be prototype grade). One line why in terms of this product. Never name a tool; the approach shapes how, not with what.

**Once the approach is chosen, read its persona file and adopt that engineer's role for decomposition** (`approaches/tracer-bullet.md`, `approaches/skateboard.md`, `approaches/facade.md`, or `approaches/journey.md`). Read only the chosen one. Each persona defines how that engineer slices, what the first slice or deliverable is, what is real vs deferred, and the sequencing, with a worked example. All slicing and sequencing in Step 4 and Step 5 follows that persona, so the four approaches produce genuinely different scopes for the same product, not the same list relabeled. A per feature override (Step 5) reads that feature's chosen persona and applies it to that feature only.

Record it (the propagation source) in the scope header: `Build approach: <name> (<one-line principle>)`. A project wide convention: `/audit` and `/sync` persist it into root `AGENTS.md`; `/architect`, `/develop`, `/check verify` read and honor it. It also sets each feature's Phase (its slice / journey), shown in the At a glance table and as section grouping.

Header value = project default; a single feature may override via the optional per feature Approach (Step 5), a tag beside its heading (e.g. `· Facade`). Precedence: own tag if set, else project default; tag only when it differs (no tag = inherit).

### Step 4: Foundations first sequencing (a principle every build approach obeys)

No approach starts a feature slice before the ground it stands on exists (working skeleton before features): lead with explicit foundation features (stack, tooling, data model, design system, walking skeleton), never buried sub tasks, cheaper foundation before what depends on it. Then the feature slices, ordered and phased per Step 3 (Phasing column: `Foundation`, `Skeleton`, the slice/journey e.g. `Slice 2`, or `Deferred`; Order column: integer build sequence across the whole scope).

- **Greenfield (and greenfield monorepo)**: apply the full foundations first sequencing in `modes/plan-greenfield.md` (the ordered foundation features, then how each build approach shapes the slices). That route file is your Step 4 detail.
- **Brownfield**: the foundations already exist; do not plan them again. Plan the next slice on top per `modes/plan-brownfield.md`, shaping it to the Step 3 approach; enroll already built features rather than laying foundations.

### Step 5: Decompose into coarse feature sections (you reason; don't ask)

From the answers, produce the feature list: foundations first (Step 4), then slices, then explicitly deferred nice to haves. Per feature:

- Keep features small: one page or one cohesive unit each (a listing, a product page, and a cart are three features, not one "storefront"); split anything spanning unrelated screens.
- **Intent (1 to 2 lines)**: what it is and why it matters.
- **Done when line (acceptance criteria seeds)**: one compact `Done when:` line of observable outcomes (e.g. "user can filter the list and the URL reflects it; empty and error states render"). Seeds, not a spec; `/architect` grows them into the spec's full requirements and acceptance criteria. Load bearing outcomes only.
- **Workflow tier** (only when it differs from the project default set in Step 5b): `Vibe` / `Lean` / `Medium` / `Full`, from this feature's risk, scope, and compliance sensitivity. Most features inherit the project default; tag a feature (e.g. `· Full`) only when it warrants more or less rigor than the rest. Higher tier → more likely `Needs spec: yes`.
- **Approach (optional per feature override)**: defaults to inherit. Only when genuinely best built differently, run a Build approach panel for THAT feature: `(recommended) inherit the project default` on top, plus the named approaches (Tracer Bullet · Skateboard · Facade (prototype grade) · Journey) as overrides; same panel and no hardcoded tool conventions as Step 3, tag and precedence rules per Step 3.
- **Needs spec?**: the invent test: would building it require a decision the engineer hasn't made? Yes for a provider/library choice, a data model, a cross cutting pattern, the design system, a whole page/screen with no spec yet, or behavior that is not trivial (search, filtering, recommendations). No only for genuinely pure implementation an existing `design.md`/spec/convention covers. Unsure → yes; an unflagged decision is the expensive miss. `Full`/`Medium` tier → almost always yes.
- One decision per spec: multiple distinct decisions in one feature → one `Needs spec: yes` item each, never one lumped "strategy" spec. Several sharing one broad decision that then splits → an umbrella that dependents reference; never mark a dependent `no` when it carries its own decision.

No build task breakdown here. A not yet designed feature gets exactly one checkbox, its entry command: `/architect <feature>` when it `needs a decision`, else `/develop <feature>` (the coding standards and tooling foundation's first box is `/audit`, never `/develop`). Never enumerate UI / data model / API / test sub tasks; `/architect` fills the built ready shape on spec capture (see What this skill does; atomic tasks stay in the spec). The next step is then always the first unticked box, always a command or tracked milestone (no separate `Next:` line). See the lifecycle table in `scope-template.md`.

Analysis/inventory is not a scope row: cataloguing duplication, listing call sites, auditing current state is decision support research living with the spec (`/architect` puts it in the spec's `rationale.md`). Never plan a row or step that writes a `.md` into `docs/scope/`.

### Step 5b: Recommend the workflow depth (decision panel)

Now that the features exist, propose the project's default **workflow depth**: how many stages a feature normally runs after `/develop`. This is a recommendation, not a question you ask cold: reason from the product (throwaway prototype vs internal tool vs real product vs payments/auth/compliance/regulated/team work) and the mix of feature weights you just assigned, then present a panel with exactly one recommended. Each level names the stages it runs, so the tradeoff is visible. Frame it: "Based on what you're building, here's the workflow I recommend. You can override, and any single feature can still run heavier."

Depth governs only the stages **after** `/develop` (verify, test, review, document). It does **not** turn off the `/architect` gate: at every depth, a feature that needs a load bearing decision still runs `/architect` first (or records an `Assumed` spec). Lean does not mean "skip architect"; it means lean features are usually `Needs spec: no`, so you rarely reach it.

- **question**: "How much workflow do you want by default for this project? Each level sets the stages a feature normally runs after `/develop`; a risky feature can still be bumped up, and `/architect` still applies whenever a decision is owed."
- **header**: "Workflow"
- **options** (mark exactly one `(recommended)` by the product signals, one line why):
  - `Vibe`: "Just `/develop`. Nothing after it, you rely on `/develop`'s own build time self check (typecheck, and rendering the screen when it can) and your own eye. No `/check verify`, no test suite, no review. `/develop` can mark the feature `done` itself. Best for throwaway prototypes, experiments, and personal projects."
  - `Lean`: "After `/develop`, `/check verify` on the real app. No separate test suite or second model review unless a feature needs it. Best for low risk features and internal tools you still want proven."
  - `Medium`: "After `/develop`, `/check verify` then `/test`. No fresh model review by default. Best for most real products."
  - `Full`: "After `/develop`, `/check verify`, `/test`, a fresh model `/check review`, then `/document`; and most features are treated as needing a spec. Best for high risk, payments, auth, compliance, regulated, or team projects."

The picker appends a free text Other automatically; in a plain text fallback offer the same four. Recommend by signal: throwaway prototype, experiment, or a personal one off → `Vibe`; a low risk product or internal tool you still want proven → `Lean`; a normal production product → `Medium`; payments, auth, PII, compliance, regulated, or a team codebase → `Full`.

Each tier also sets what `done` means (see `scope-template.md`): `Vibe` closes on build plus self check (`/develop` marks it), `Lean` on `/check verify` passing, `Medium`/`Full` on the tests being in (and the review for `Full`). The `Assumed` spec done gate still holds at every tier: a feature built on an unratified assumption cannot be `done` until `/architect` ratifies it.

Record the pick as the project default in the scope header `**Workflow:**` line (see `scope-template.md`). It sets the baseline each feature inherits; a feature tagged with a higher tier than the project default (Step 5) runs its heavier path, and one tagged lower runs lighter. This default is what `/develop` reads (via the effective tier) to scale the next steps it recommends after a build.

### Step 6: Write the scope (single file or epic split)

List the scope location again immediately before writing (a teammate may have changed it), then write per `scope-template.md`:

- Small product → single file `docs/scope/scope.md` (monorepo: `docs/scope/<workspace>/scope.md`): At a glance table (including brownfield enrolled features) + phase grouped feature sections + legend.
- Large product → epic split per Artifact ownership (`docs/scope/index.md` + `docs/scope/<epic>.md`); promote only when `scope.md` has outgrown a comfortable scan, else stay single file.
- Run again (living update): edit in place, never a dated file: append new rows with the next free `#`, sharpen existing rows' intent/seeds, leave existing statuses untouched; set a now out of scope row to `dropped` (never delete). Brownfield: append enrolled `existing`/`in-progress` rows above the `planned` ones.

Citations are gated by Step 6b: ask that panel first (or confirm the chosen level) before adding any `(basis: …)` or `## References` content, and honor its level.

### Step 6b: References consent (one panel, covers sources AND links)

Ask ONE consent question governing both the `(basis: …)` citations and any reference links (one clear ask, not two). Panel; record the outcome as the References level:
- question: "Add a References section to the scope (where the recommendations come from, and optionally links)? The intent and reasoning stay either way. The links option runs a subagent that web searches and fetches pages to confirm official docs and standards, which costs some extra tokens."
- header: "References"
- options:
  - `No references, keep it clean (recommended)`
  - `Sources only (named project sources and practices, no web fetch)`
  - `Sources plus web verified links (fetches pages to confirm the links, costs some extra tokens)`

No references (or no answer): no `## References` section, no `(basis: …)` citations anywhere; the scope keeps its intent and reasoning and reads clean. Done.

Sources only (or the agent has no web tools): wherever the scope recommends something the engineer didn't dictate (phasing choice, order rationale, a suggested capability, a `Needs spec` flag, a tier call), append a short `(basis: …)`: a project source (`your AGENTS.md`, a spec, the existing stack) or a named practice (`vertical slices ship real value early`, `foundations before features`, `data model is the costliest thing to redo`); inline you have no web tools, so name the source or practice, never a URL. Add a `## References` section naming *Project sources* (verifiable) and *Practices & standards* (named); no Links group, no subagent. Done.

Sources plus web verified links: as Sources only, then verify the links with a read only web subagent (it only fetches; you do the writing), so links are confirmed, never fabricated:
- Spawn a read only `researcher` subagent (capability first). `model`: the cheapest tier; do not inherit the session model (Claude Code: the `researcher` type pins `haiku` and carries the web tools; a light model elsewhere) · `description: "Scope: verify reference links"`
- Tools: `Read`, `WebSearch`, `WebFetch` (no `Edit`; it does not write)
- `prompt`: the scope recommendations and the candidate sources. Job: confirm each load bearing `(basis: …)` is sound; where a canonical source is worth linking (an official doc, a named standard/practice), web search and fetch to confirm it exists and says what's claimed; return only the compact list of verified links (title + URL), or "none verified". Never invent a URL. Keep it lean.
- Then YOU (main thread) write the `## References` *Links* group from that verified list (web verified only, else "none verified"); the fetch happens once here, and nothing fetches these links again afterward. They are for a human to follow.
- No web tools or subagents: degrade to the Sources only behavior.

### Step 7: Report and hand off

Print the completion report using the `## /scope complete` block in `scope-template.md`, filled with this run's specifics. `/scope` does not run `/architect` or `/develop` for you; it hands you the ordered, coarse, weighted list to walk feature by feature (architect the `Needs spec: yes` ones, then build).
