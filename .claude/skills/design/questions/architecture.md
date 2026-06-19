# Round 2 Questions — Architecture Selection

Present these via AskUserQuestion exactly as structured below.

---

question: "What type of product are you building?"
header: "Product type"
multiSelect: false
options:
  - label: "Web application"
    description: "Browser-based UI backed by an API and database. Full-stack product."
  - label: "API or backend service"
    description: "Consumed by other clients (mobile, frontend, third parties). No UI owned by this project."
  - label: "Mobile application"
    description: "iOS and/or Android app with a backend. UX and offline behaviour matter."
  - label: "Data pipeline or analytics"
    description: "Ingestion, transformation, storage, or querying of large data sets. Throughput matters most."

---

question: "What is the deployment and infrastructure target?"
header: "Infra target"
multiSelect: false
options:
  - label: "Cloud — managed services"
    description: "AWS, GCP, or Azure with managed databases, queues, and hosting. Prefer less ops overhead."
  - label: "Serverless or edge"
    description: "Vercel, Cloudflare Workers, AWS Lambda. Pay-per-use, fast cold start tolerance required."
  - label: "Containers — self-managed"
    description: "Docker + Kubernetes or similar. Team owns the ops. More control, more overhead."
  - label: "Not decided yet"
    description: "Open to any target — factor infra into the recommendation."

---

question: "What is the expected scale at launch and in 12 months?"
header: "Scale"
multiSelect: false
options:
  - label: "Small — under 1K users, single-digit RPS"
    description: "A side project, internal tool, or early MVP. Simplicity beats premature optimisation."
  - label: "Medium — 1K to 100K users, 10–100 RPS"
    description: "A real product with growing traction. Needs to scale but not over-engineer."
  - label: "Large — 100K+ users, 100+ RPS at launch"
    description: "Significant load from day one. Architecture must handle this without a rewrite."
  - label: "Unknown — building for unknown scale"
    description: "Could be any of the above. Design for horizontal scalability from the start."

---

question: "What is the team's language and framework preference?"
header: "Team stack"
multiSelect: false
options:
  - label: "TypeScript / JavaScript"
    description: "Node.js backend, React/Next.js frontend, or both. Team is JS-first."
  - label: "Python"
    description: "FastAPI, Django, or Flask. Strong for data-heavy or ML-adjacent products."
  - label: "Go"
    description: "High-performance services, low memory overhead, strong concurrency primitives."
  - label: "No preference / open to recommendation"
    description: "The team can learn. Recommend the best fit for the product type and scale."
