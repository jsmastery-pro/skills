# /check ready (launch readiness review)

The `ready` mode of `/check`: before a feature or service meets real traffic, check that it can be run, watched, and rolled back. Follow it fully.

## What this mode does

Your role: the engineer who gets paged when this breaks. Review asks whether the code is right; this asks whether production survives it: load, a failing dependency, a bad deploy, lost data, nobody watching. The areas follow Google SRE's launch coordination checklist and AWS's operational readiness review, cut to what a team can act on.

- Mark every item from evidence: `in place` (cite `file:line` or the config), `gap` (with the fix), `not applicable` (a few words why), or `ask` (it lives outside the repo, such as a dashboard, an on call rota, a tested restore). Never mark `in place` without evidence.
- Depth follows the product: a first launch to a few users needs the basics of each area; a service with many users or teams needs every item with evidence. Never invent a target; take it from the spec's `Quality targets`, else list it under `ask`.
- Suggests, never gates. Each gap is a recommendation; the engineer decides to fix, accept, or skip it.

Owns `docs/reviews/<YYYY-MM-DD>-<feature>-ready.md` (same artifact base rule as `modes/review.md`: `.workflow/reviews/` when `docs/` is a published docs site). Read only on code: writes no code, tests, specs, or context files.

## Asks vs acts

Acts. Scopes, reads, assesses, writes the file. Never stops to ask mid run: collect every `ask` item and list it in the report for the engineer to confirm. Pauses only when there is no target (no feature named, no spec, and no diff): ask which feature or service to review.

## Portability (any OS, any agent)

Same as the other modes: `git` is the only required CLI; use your agent's file tools for everything else. No subagent support: read inline.

## Execution

### 1. Resolve the target

A feature name → its scope row and governing spec (`docs/specs/`), and the code its pointer line names (no pointer → find the code from the spec's surfaces: routes, tables, jobs). No name → the branch diff against `main` (else `master`), plus its governing spec if one matches. A whole service (`/check ready api`) → that workspace or folder.

### 2. Gather (paths and cheap signals first)

- The spec's build sections: `## Requirements` (with `Quality targets`), `## Feature design` (with `Rollout & operations` and `Security model`), `## Consequences`.
- Root and nearest `AGENTS.md`.
- Delivery and runtime config: CI workflows, `Dockerfile`, infrastructure as code (`*.tf`, Kubernetes manifests, platform or serverless config), migrations in scope, feature flag setup, logger, error tracking, tracing, and alert rules kept as code.
- Prior findings for this feature under `docs/reviews/` (do not repeat them; reference them).

Large target: offload the reading to a read only `scout` subagent (cheapest model, never the session model) that returns a compact map per area below. The main thread judges and writes.

### 3. Assess each area

First hold the spec to its word: every line of `Quality targets` and `Rollout & operations` (a flag, a staged rollout, a rollback path, a degraded mode, an alert) needs evidence in the code or config; a promise with none is a `gap`, and a rollback the data change makes impossible (a rename or drop in the same release) is a `gap` under Release & rollback. Then each area:

| Area | Ready means |
|---|---|
| Load & capacity | Expected load known now and at 10x; the first bottleneck named; limits in place (pagination, rate limits, connection pools, queue backpressure); a load test or written capacity reasoning for anything with a launch spike |
| Dependencies | Every network and database call has a timeout; retries are bounded, backed off with jitter, and only on idempotent work; a slow or down dependency degrades this feature, not the product; third party quotas known |
| Data safety | Backups run and a restore was tested; recovery point and time objectives known; migrations run expand then contract so the previous release keeps working; destructive steps reversible or gated |
| Observability | The user journey has a service level indicator (success rate, latency); alerts fire on symptoms users feel, reach an owner, and link a runbook; logs are structured, carry a request id, and hold no secrets or personal data; traces span service hops |
| Release & rollback | Builds are repeatable from CI; a change with real blast radius ships behind a flag or a staged rollout; rollback is one known step, tried, covering config and data |
| Security | Threats at each trust boundary handled (the spec's security model); secrets in a manager and rotatable; new dependencies pinned and scanned; authorization on every new surface; audit logs for money, access, and compliance scope mutations |
| Operations & cost | A named owner and on call path; launch not timed into a weekend or a freeze; support knows what changed; rough cost at expected load and a budget alert |

Verdict: `Not ready` when a gap risks data loss, an outage with no rollback, or a security hole; `Ready with gaps` for any other gap; `Ready` when none.

### 4. Write the file

`docs/reviews/<YYYY-MM-DD>-<feature>-ready.md`: the verdict line, then one table per area (`Item · Status · Evidence or fix`), then the `ask` list. Terse cues, house voice at write time.

### 5. Relay

```
## /check ready <feature> · <Ready | Ready with gaps | Not ready>

Close before launch (<count>):
- <area · one line · the fix>
Confirm (<count>): <the ask items, one line each>
<count> in place · <count> not applicable. Full review in docs/reviews/<date>-<feature>-ready.md.
```

Show every gap that drives the verdict; collapse the rest to counts and the file pointer.

**Tick the scope box.** If the feature's scope row has a `Launch check` box, tick it (the review ran; the box marks that, not that it passed) and say so. No matching row → say so.

Next (the feature's next unticked box): `/document <feature>` if a `Document it` box remains, else `/sync`.
