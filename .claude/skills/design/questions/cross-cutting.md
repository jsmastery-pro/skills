# Round 2 Questions — Cross-cutting Standard

Present these via AskUserQuestion exactly as structured below.

---

question: "What does this standard govern?"
header: "Standard type"
multiSelect: false
options:
  - label: "Error handling"
    description: "How errors are caught, structured, logged, and returned — consistently across the codebase."
  - label: "Logging and observability"
    description: "What is logged, at what level, in what format, and how it reaches your monitoring stack."
  - label: "Authentication and authorisation"
    description: "How identity is verified and permissions are enforced — middleware, guards, decorators."
  - label: "Code structure and naming"
    description: "File layout, module boundaries, naming conventions, or dependency rules (e.g. no circular imports)."

---

question: "Why is a standard needed now?"
header: "Driver"
multiSelect: false
options:
  - label: "Inconsistency is causing bugs"
    description: "Different patterns in different areas produce different — and sometimes wrong — behaviour."
  - label: "Onboarding friction"
    description: "New developers encounter conflicting approaches and make wrong assumptions about how things work."
  - label: "Compliance or audit requirement"
    description: "An external standard (SOC2, GDPR, HIPAA) requires this to be consistent and documented."
  - label: "Pre-emptive consistency"
    description: "The codebase is small enough to fix now. Establish the pattern before inconsistency sets in."

---

question: "What is the current state of this area?"
header: "Current state"
multiSelect: false
options:
  - label: "No standard — anything goes"
    description: "Each developer has done their own thing. Wide variation across files with no dominant pattern."
  - label: "Informal convention — mostly followed"
    description: "There is an unwritten rule that drifts. No tooling enforces it and it breaks under pressure."
  - label: "Competing approaches — both coexist"
    description: "Two or more patterns are in active use. Each has advocates. Neither is authoritative."
  - label: "Partial adoption — some areas compliant"
    description: "Some areas already follow the desired pattern. The rest have not been migrated yet."

---

question: "How should this standard be adopted across the codebase?"
header: "Rollout"
multiSelect: false
options:
  - label: "Lint rule or static analysis — enforce automatically"
    description: "Any violation fails CI. New code is always compliant from day one. Existing violations tracked as debt."
  - label: "Gradual migration — enforce for new code, fix old incrementally"
    description: "New files must follow the standard immediately. Existing violations fixed over time in batches."
  - label: "Single migration PR — fix all files at once"
    description: "One coordinated change updates every non-compliant file. Faster to close but higher blast radius."
  - label: "Team agreement only — enforce in code review"
    description: "Document the standard and rely on reviews. No automated tooling change. Lowest friction to start."
