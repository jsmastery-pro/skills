# Round 2 Questions — System Enhancement

Present these via AskUserQuestion exactly as structured below.

---

question: "What specifically is wrong or missing with the current approach?"
header: "Root cause"
multiSelect: false
options:
  - label: "Doesn't scale to current load"
    description: "The existing solution worked at smaller scale but is now a bottleneck."
  - label: "Too slow or resource-intensive"
    description: "Latency, CPU, or memory usage is unacceptable. Needs replacement or optimisation."
  - label: "Hard to maintain or extend"
    description: "Adding features or fixing bugs is painful. The design is fighting the team."
  - label: "Missing capability now needed"
    description: "The current solution never supported this use case. This is a gap, not a flaw."

---

question: "How constrained is the solution by the existing system?"
header: "Solution space"
multiSelect: false
options:
  - label: "Must stay in current language and framework"
    description: "No new runtimes or languages. The team and codebase are locked in."
  - label: "Can introduce new tools alongside existing ones"
    description: "Can add a service, library, or sidecar — but the core system stays."
  - label: "Gradual replacement is acceptable"
    description: "Can run old and new in parallel (strangler pattern) and migrate over time."
  - label: "Full replacement is on the table"
    description: "If the new approach is clearly superior, a full rewrite is worth it."

---

question: "What is the preferred migration strategy?"
header: "Migration"
multiSelect: false
options:
  - label: "Big bang — replace all at once"
    description: "Cut over completely at a planned time. Simpler to reason about, riskier to execute."
  - label: "Gradual — run old and new in parallel"
    description: "Migrate traffic or data incrementally. Lower risk, higher operational complexity."
  - label: "Feature-flagged — switch over per-cohort"
    description: "New system behind a flag; enable for specific users, regions, or percentages."
  - label: "No migration needed"
    description: "This is a net-new addition — existing behaviour is untouched."

---

question: "Does this change need to be invisible to users?"
header: "User impact"
multiSelect: false
options:
  - label: "Yes — pure internal change, zero user impact"
    description: "Behaviour must be identical after the change. No downtime, no visible difference."
  - label: "Mostly — minor UX differences are acceptable"
    description: "Speed improvements or minor UI changes are fine. No breaking changes."
  - label: "No — users will see the difference"
    description: "This is a visible improvement. User-facing change is expected and communicated."
  - label: "Not sure — depends on the chosen approach"
    description: "Leave this open for the design to inform the answer."
