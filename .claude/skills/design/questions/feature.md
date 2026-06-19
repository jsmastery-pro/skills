# Round 2 Questions — Feature Design

Present these via AskUserQuestion exactly as structured below.

---

question: "What core problem does this feature solve for the user?"
header: "User problem"
multiSelect: false
options:
  - label: "Reduces effort or friction"
    description: "Something users can already do, but it's slow, manual, or painful. This feature makes it easier."
  - label: "Unlocks new capability"
    description: "Users can't do this at all today. This is net-new functionality."
  - label: "Replaces a workaround"
    description: "Users have hacked together a solution (spreadsheets, external tools). This replaces it properly."
  - label: "Improves reliability or trust"
    description: "The feature exists but breaks, loses data, or users don't trust it. This fixes that."

---

question: "How complex is the data model for this feature?"
header: "Data complexity"
multiSelect: false
options:
  - label: "Simple — 1 to 3 entities"
    description: "Flat relationships, low coupling. E.g. a comment on a post, a user preference toggle."
  - label: "Moderate — 3 to 6 entities"
    description: "Some relationships and state transitions. E.g. an order with line items, status, and a customer."
  - label: "Complex — 6+ entities or aggregates"
    description: "Rich domain model with many relationships, invariants, or event-driven state. E.g. a workflow engine."
  - label: "Unclear — haven't thought about it yet"
    description: "The data model needs to be discovered as part of the design."

---

question: "What external integrations does this feature require?"
header: "Integrations"
multiSelect: true
options:
  - label: "No external integrations"
    description: "This feature operates entirely within the existing codebase and data store. No third-party calls or credentials needed."
  - label: "Authentication / SSO"
    description: "OAuth, SAML, or session-based auth flows."
  - label: "Payments"
    description: "Stripe, PayPal, or similar — billing, subscriptions, or one-time charges."
  - label: "Third-party APIs or webhooks"
    description: "Calling or receiving calls from external services."
  - label: "File storage or media"
    description: "Uploads, downloads, images, video, or document handling."

---

question: "What non-functional property is most critical for this feature?"
header: "NFR priority"
multiSelect: false
options:
  - label: "Speed and low latency"
    description: "Response times and perceived performance are the primary concern."
  - label: "Data correctness and consistency"
    description: "Must never lose or corrupt data. Eventual consistency is not acceptable."
  - label: "Security and privacy"
    description: "Handles PII, financial data, or other sensitive information. Compliance may apply."
  - label: "Developer velocity"
    description: "Ship fast, iterate. Correctness and polish can improve over time."
