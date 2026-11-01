# Test Mode: setup (first run only, when `NO_PREFS`)

Read this only when `test-preferences.json` is absent. It holds the two first run only steps. Ordering in the main flow: do Step 4 here, return to SKILL.md Step 5 (installation check), then do Step 6 here, then continue at SKILL.md Step 7.

## Step 4: Stack detection and first run questions

With file tools (not shell utilities), determine:
- Package manager by lockfile: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lock` (or legacy `bun.lockb`) → bun, `package-lock.json` → npm.
- Language and framework: `package.json` for `next`/`vite`/`nuxt`/`svelte`/`react`; `pyproject.toml` (pytest/unittest) → Python; `go.mod` → Go; `Cargo.toml` → Rust.
- Installed test tools: `vitest`/`jest`/`@playwright/test`/`cypress`/`@testing-library/*` in `package.json`. A different runner already in use (`bun test`, `node:test`, `ava`, `deno test`, etc.): detect and use it instead of installing a new one.

**Q0: No test setup at all? Don't assume they want one.** No test tool installed (whole repo, or this package in a monorepo): first check for a deliberate no test runner convention.
- Stated in the nearest `AGENTS.md` or governing spec (e.g. "no test runner, typecheck + `/check verify` is the gate"): respect it, don't push a framework. Save the **gate shape** of `test-preferences.json` (Step 6), run the project's typecheck/lint as the gate, point to `/check verify` for behavior. Report: "This project gates on typecheck + `/check verify`, not a test suite. Ran the typecheck gate; use `/check verify` to confirm behavior."
- Not stated: ask (don't default to installing): "This has no test setup. How do you want to gate changes here?" → `Set up a test framework` (→ Q1, install with confirmation) · `No test runner, typecheck + /check verify` (→ save the gate shape, run typecheck, defer behavior to `/check verify`; never install) · `Just typecheck for now` (→ also the gate shape).
- Per package in a monorepo: a package with no tests by design gates on typecheck/`/check verify` even if a sibling has a full suite; apply per resolved package root.

Skip Q1 unless the engineer chose "set up a framework".

**Q1: Framework for unit/integration** (first run, engineer opted to set up tests)

Filter by detected language. List an already installed tool first with `(already installed)` appended and treat it as recommended. The `(recommended)` tags below mark today's common default per language, not a mandate: prefer whatever the project or team already uses, and the picker's Other slot takes any choice.

| Language | Options (max 4) |
|---|---|
| JS / TS | Vitest (recommended), Jest, [+ already installed first] |
| Python | pytest (recommended), unittest |
| Go | `testing` + testify (recommended), `testing` stdlib only |
| Rust | `cargo test` (built in), no question needed, skip |

Unlisted language: ask with whatever tools you detect; the picker's automatic Other covers free text, so add no own Other option.

```
Ask: "Which framework for unit & integration tests?"  (header: "Framework")
- options: [filtered list]
```

**Q2: E2E tool** (ask only if `E2E_RELEVANT = yes`)

```
Ask: "Pages/flows changed. Add end-to-end tests too?"  (header: "E2E")
- "Playwright (recommended)": "Real-browser flow tests for the changed pages"
- "Cypress": "Real-browser flow tests with the Cypress runner"
- "No E2E (unit/component only)": "Skip browser tests; cover pages at the component level"
```

**Q3: Component testing addon** (JS/TS only, when any **component** or **page/flow** file is in scope and React/Vue/Svelte is detected)

```
Ask: "Add component testing support?"  (header: "Components")
- "Yes, Testing Library (recommended)": "Installs @testing-library/<framework> + user-event for render+interact tests"
- "No, logic tests only": "Plain module/function tests, no DOM rendering"
```

Skip Q3 entirely if scope is logic/api/cli only.

## Step 6: Save preferences

Write `test-preferences.json` at the project root. It has two shapes, and which one you write depends on what the engineer chose at Q0.

**Framework shape** (a runner is set up):

```json
{
  "tool": "<unit framework>",
  "gate": null,
  "additionalTools": ["@testing-library/react"],
  "e2eTool": "<playwright|cypress|none>",
  "testDir": "<conventional dir for the tool>",
  "filePattern": "<*.test.ts>",
  "packageManager": "<npm|pnpm|yarn|bun>"
}
```

**Gate shape** (the project gates without a runner, by convention or by the engineer's Q0 answer). `tool` is `null` and `gate` names the gate. Write both keys, never just one: `/test` reads `tool` to decide whether to write a suite, and `/check review` reads `gate` to tell a deliberate no runner project apart from one that simply never set tests up. A file with neither key is malformed.

```json
{
  "tool": null,
  "gate": "typecheck+verify",
  "packageManager": "<npm|pnpm|yarn|bun>"
}
```

Conventional directories and patterns:

| Tool | `testDir` | `filePattern` |
|---|---|---|
| Vitest | beside the source | `*.test.ts` / `*.test.tsx` |
| Jest | beside the source, or `__tests__/` | `*.test.ts` |
| Playwright | `e2e/` | `*.spec.ts` |
| Cypress | `cypress/e2e/` | `*.cy.ts` |
| pytest | `tests/` mirroring source | `test_*.py` |
| Go testing | same package as source | `*_test.go` |
| Rust | `#[cfg(test)]` in file / `tests/` | n/a |

Then tell the engineer:
> "Preferences saved to `test-preferences.json`. Future `/test` runs load these and skip straight to writing."
