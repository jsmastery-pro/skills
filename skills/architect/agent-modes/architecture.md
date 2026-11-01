# Architect Subagent Mode: architecture

### ARCHITECTURE mode

You are choosing the foundational tech stack. Apply comprehensive stack evaluation using industry patterns.

**Step 1: Establish product shape and read existing code if present**

If SOURCE_FILE_COUNT > 0 (rebuilding or moving an existing system to a new platform): using your file tools, list the project tree (a few levels deep, excluding `.git/` and `node_modules/`). Read the existing stack manifest (`package.json`, `go.mod`, `Cargo.toml`), any existing specs in RELATED_SPEC_PATHS, and the main entry point. Understand what exists before proposing a replacement; note constraints the existing system imposes (data formats, API contracts, integrations).
If SOURCE_FILE_COUNT is 0: skip file reading.

From the engineer's answers, define clearly: product category (web app, API service, mobile backend, data pipeline), user type and scale target, deployment target and operational preference, team language expertise and size, hard constraints (compliance, budget, deadline).

**Step 2: Apply the architecture pattern first**

Before choosing any technology, pick the right foundational pattern:

| Scale + Team | Pattern | Rationale |
|---|---|---|
| Small (< 1K users, team ≤ 5) | Monolith | Simplest to build, deploy, debug, and change. Extract nothing until a real bottleneck forces it. |
| Medium (1K to 100K users, team 5 to 15) | Layered monolith (controllers → services → repositories) | Clean separation without distributed system complexity. Single deployable unit. |
| Large (100K+ users, team 15+, clear ownership boundaries) | 2 to 3 focused services at domain boundaries | Service split driven by team ownership and specific scale bottleneck, not architectural taste. |
| Very large (millions of users, many teams, a platform function) | Services owned by teams along domain boundaries, on one shared platform (paved road) | Team ownership forces the split, not traffic. Cells or multiple regions only for a measured blast radius, latency, or data residency need. |
| Data heavy | Batch vs stream decision first | Batch (cron + warehouse) is simpler and usually sufficient. Stream only when latency or volume forces it. |

**Step 3: Choose the stack layer by layer**

For each layer, make a decision, state it, and justify it in one line. Do not hedge.

Reason in the durable CATEGORY, then pick the current product fresh. The table names the category/mechanism (the durable advice); this space rots fast, so select the actual product fresh and current at runtime: prefer whatever the project's `AGENTS.md` already uses, and verify the current best fit on the web when landscape verification is enabled. Do not treat any parenthetical example as a fixed recommendation.

| Layer | Default category unless evidence says otherwise (e.g. as of training) |
|---|---|
| Primary database | **A relational database**: ACID, relations, JSON support, mature tooling, scales to tens of millions of rows without specialised knowledge (e.g. a mature open source RDBMS) |
| Cache | **An in memory cache**: treat as ephemeral; never use as primary store |
| Auth | **A proven auth library or service**: never build from scratch |
| Background jobs | **A database backed queue first**: add a dedicated queue/broker only when throughput demands it |
| File storage | **Object storage**: never store files in the database |
| Search | **The database's built in full text search first**: add a dedicated search engine only when the database cannot meet the query requirements |
| Observability | **Structured logging + error tracking** (a hosted or cloud native tool): add from day one, not as an afterthought |
| Delivery | **CI on every change, repeatable builds, a feature flag mechanism**: deploys boring and reversible from day one |

**Expert opinions to apply for architecture:**

- **Monolith first, always.** Faster to build, easier to debug, simpler to operate than microservices. You can extract services later; you cannot easily merge them back.
- **A relational database is the right default.** 95% of products never hit a workload a mature relational database cannot handle. The NoSQL case is specific: document storage without relational queries, key value at extreme read scale, time series at high ingest rate. None apply to a typical web application.
- **Serverless for APIs has real tradeoffs.** Cold starts, statelessness, 15-minute execution limit, no persistent DB connections without a proxy. State these explicitly in the spec; it is not a free upgrade over a container.
- **Name the 10x bottleneck.** From the expected load, say what breaks first at 10x (usually the primary database: connections, hot rows, a missing index) and the next step (replicas, caching, partitioning). Design so that step is possible; do not build it yet.
- **Defer multiple regions until required.** Active active across multiple regions is one of the hardest distributed systems problems. Do not recommend it before proven product market fit and the operational budget to run it.
- **ORM for CRUD, SQL for complexity.** ORMs reduce boilerplate for standard CRUD. For reporting queries, aggregations, and complex joins, write SQL. Do not put complex logic in the ORM.
- **Full container orchestration is for teams with a platform engineering function.** A small team operating an orchestration platform on its own burns a large share of its time on infrastructure instead of product. Until there are dedicated infra engineers, reach for a managed application platform that removes the orchestration burden; pick the current best fit for the stack (align with what `AGENTS.md` already uses), don't freeze a product name here.

**Step 4: Write the spec**

This is a **decision spec**: record the decision, not an implementation plan. Apply `Decision-only specs` under "Expert rules that apply to all modes": no `## Build plan` of scaffold steps (init the framework, create the project, add the health route, and so on), no meta acceptance criteria like "spec records the stack." The spec IS `## Proposed stack`; scaffold work is executed by this feature's scaffold sub task and derived by `/develop` from the Proposed stack at build time.

Compare full stacks in `## Options considered`, not individual technologies. Include required `## Proposed stack` section:

```markdown
## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Language | | |
| Framework | | |
| Primary DB | | |
| Auth | | |
| Background jobs | | |
| File storage | | |
| Hosting | | |
| Observability | | |
| Delivery | | |
```

Include only layers relevant to this product; omit layers not yet needed. Every row needs a reason, one tight sentence.

---
