# Test Writing Guide (read by the main thread at write time)

Strategy, rules, tool specifics, iteration loop, and report format. Read at write time only (Step 8), to keep this detail out of the earlier pre-flight and question steps.

---

## Rules of engagement

**You must not modify application source files.** /test writes tests; it never changes the code under test to make a test pass.

### Existing tests: extend, never duplicate or clobber

Before writing a new test file, look for one that already covers the source file (same base name with the test pattern, co-located or under TEST_DIR). If it exists:
- **Extend it** with `Edit`, add the missing cases, keep the engineer's existing tests intact.
- Never create a second parallel test file for the same source, and never overwrite hand-written tests.
- If existing tests look wrong or contradict the current code, do not silently rewrite them, note them under `NOT_COVERED` as "existing tests may be stale" so the engineer decides.

### Config files: minimal and additive only

You generally write only test files. The one exception: if the chosen runner **cannot execute without a config that does not yet exist**, create the minimal one needed:
- Vitest + Testing Library with no `vitest.config.*`: create one with `environment: 'jsdom'` and a setup file importing `@testing-library/jest-dom`.
- Playwright with no `playwright.config.*`: create a minimal config (test dir, base webServer if obvious).
- **Never edit an existing config**, if one is present, respect it and adapt the tests to it. List any conflict under `NOT_COVERED`.

### Security-sensitive code: add security cases by default

If any file in scope handles authentication, authorization, sessions, payments, or PII (signals: `auth`, `login`, `session`, `token`, `password`, `permission`, `role`, `payment`, `charge`, `webhook`, `checkout`), add cases for: unauthorized/forbidden access, missing/expired/tampered credentials, and that secrets or sensitive fields are not leaked in responses or logs. Note any security risk you cannot cover with a test in `NOT_COVERED`.

If `INSTALL_STATE = deferred`, still write complete, correct tests, they simply won't run until the engineer installs.

### Reading context efficiently

- Read each scoped source file, that is your primary input.
- Read a spec path you were given **only if** it plainly governs a file you're testing; skip the rest. Don't read all three reflexively.
- Read the `design.md` path **only** when writing component/page accessibility cases.

---

## Strategy per file class

| Class | What to write |
|---|---|
| **logic** | Pure unit tests. Call the function with real inputs, assert outputs. Cover edge and error cases exhaustively. Mock only true boundaries (network, fs, clock, randomness). |
| **component** | Render the component, interact via user events, assert what the user sees (rendered text, roles, disabled/expanded state) and accessibility. Never assert internal state or class names. |
| **page/flow** | If E2E_TOOL is set, write a real browser flow test for the primary path through the page (load → act → assert outcome) plus one failure path. Also component test any pieces that are not trivial. If E2E_TOOL is `none`, cover the page at the component level. |
| **api/server** | Integration test: invoke the handler/route/action with representative requests. Assert status, response shape, and error responses (bad input, unauthorized, not found). Mock the DB/external services at the boundary only. |
| **cli** | Invoke the command with arguments, assert stdout/exit code/side effects. Cover an invalid args path. |

---

## Coverage priorities (in order)

1. **Happy path**: the normal, expected use
2. **Edge cases**: empty, null/undefined, zero, boundary, max length, unicode
3. **Error states**: invalid input, dependency failure, network error, unauthorized, not found
4. **State transitions**: initial → action → expected new state (components, reducers, state machines)
5. **Accessibility** (component/page scope): keyboard reachable, ARIA present, accessible names correct

A good suite for a changed feature has more than the happy path.

---

## Expert rules (all tools)

- **Test names are sentences**: `"returns null when the cart is empty"`, not `"test3"`.
- **One concept per test.** Multiple `expect`s are fine only if they verify the same behavior.
- **Arrange → Act → Assert** in every test body.
- **Test the public interface, not internals.** Assert observable output, not that a private method ran.
- **Do not mock what you own.** Mock only at the system boundary: HTTP, DB, filesystem, clock, randomness.
- **Deterministic.** No reliance on real time, real network, or test ordering. Freeze the clock when time matters.
- **Keep setup DRY but readable.** Shared setup in `beforeEach`/fixtures; the test body still reads on its own.
- **Every async call is awaited.** No floating promises.

---

## Tool specific rules

### Vitest / Jest
- `describe` groups by file or function under test
- `vi.fn()` / `jest.fn()` for simple mocks; `vi.mock()` / `jest.mock()` at top of file for modules
- Timers: `vi.useFakeTimers()` in `beforeEach`, `vi.advanceTimersByTime()`, `vi.useRealTimers()` in `afterEach`
- Async errors: `await expect(fn()).rejects.toThrow('message')`
- `vi.spyOn()` when the call itself is the observable effect (e.g. an analytics event)

### Testing Library (when ADDITIONAL_TOOLS includes it)
- Query priority: `getByRole` → `getByLabelText` → `getByText` → `getByTestId` (last resort)
- `userEvent.setup()` before interactions, never `fireEvent`
- Async render: `await findByRole(...)`, not `waitFor(() => getByRole(...))`
- Assert what the user perceives: text, role, disabled/expanded, not `className` or React state

### Playwright (E2E)
- Each test stands on its own: setup in `test.beforeEach`, teardown in `test.afterEach`
- `page.getByRole()` / `page.getByLabel()` over CSS selectors
- Wait on assertions, never arbitrary timeouts: `await expect(locator).toBeVisible()`
- Test mobile (375px) and desktop (1280px) when the page is responsive
- Forms: fill → submit → assert success or error state

### Cypress (E2E)
- `cy.findByRole()` (with @testing library/cypress) or `cy.get()` with data attributes
- Assert with `.should(...)`; let Cypress retry, no fixed `cy.wait(ms)`
- Stub network with `cy.intercept()` at the boundary

### pytest
- `@pytest.fixture` for shared setup; `@pytest.mark.parametrize` for input variations
- `with pytest.raises(ValueError):` for error assertions
- Mock with the `mocker` fixture (pytest mock)
- Async: `@pytest.mark.asyncio`

### Go testing + testify
- Name `Test<Func>_<scenario>`; `assert.Equal(t, want, got)`; `require.NoError(t, err)` for early exit
- Table driven tests with `t.Run(tt.name, ...)`; `t.Parallel()` when no shared mutable state

### Rust (cargo test)
- Unit tests in `#[cfg(test)] mod tests`; integration tests in `tests/`
- `assert_eq!` / `assert!`; `#[should_panic(expected = "...")]`; `-> Result<(), E>` with `?` for fallible tests

---

## Accessibility cases (component / page scope, or when a design.md path was given)

- Every interactive element is reachable by Tab in logical order
- Every `button` has an accessible name (visible text or `aria-label`)
- Every `input` has an associated label (visible, `aria-label`, or `aria-labelledby`)
- Error messages link to their input via `aria-describedby`
- Modal/dialog traps focus while open and returns focus to the trigger on close
- `aria-expanded` toggles correctly on disclosure triggers
- Icon only buttons expose screen reader text
- Do not test colour contrast here (visual, defer to design review)

---

## File placement

Follow TEST_DIR and FILE_PATTERN exactly, and match any existing test convention in the repo.

- **Beside the source**: `<source>.test.ts` beside `<source>.ts`
- **Dedicated dir**: mirror the source path under TEST_DIR (e.g. `src/auth/login.ts` → `tests/auth/login.test.ts`)
- **E2E**: under the E2E tool's directory (`e2e/`, `cypress/e2e/`), named by the flow not the source file

---

## Running and iterating (only when RUN_AFTER = yes)

Run from `PACKAGE_ROOT`. Keep your own context small, test output is verbose, so:

- **First run**: use the terse reporter for your tool (`--reporter=dot` for Vitest, `--reporters=summary` for Jest, `--reporter=line` for Playwright, `-q` for pytest, `-q` for `go test`). You want pass/fail counts and the failing names, not full passing output.
- **On each retry, run only the file(s) that failed**, never the whole suite. E.g. `<RUN_COMMAND> path/to/failing.test.ts`. This keeps each iteration's output small and fast.

Then iterate:

1. **A test fails because the test is wrong** (bad import, wrong selector, incorrect expectation, missing setup): fix the test and run just that file again. Repeat until these are gone.
2. **A test fails because the application code is genuinely wrong** (the code violates its own contract or the spec): this is the test doing its job. **Do not change the source to make it pass, and do not weaken the assertion.** Leave the test failing, capture it under `BUGS_FOUND`, and move on.
3. Stop when the only remaining failures are real bugs in `BUGS_FOUND`, or everything is green.

Distinguish the two honestly. Do not paste raw test output into your report, summarise to counts plus the specific failing cases.

If `RUN_AFTER = no`: do not run anything. Write the tests, then produce `MANUAL_INSTRUCTIONS` so the engineer can run and verify themselves.

---

## Report

After finishing, output the block matching `RUN_AFTER` verbatim, no extra prose around it.

**When RUN_AFTER = yes:**

```
TESTS_WRITTEN:
- <file path> (<class>): <N tests>, <one-line coverage summary> [extended existing | new]
- <file path> (<class>): <N tests>, <summary>

RUN_RESULT: <X passed, Y failed> via <RUN_COMMAND>

BUGS_FOUND:
- <file:line, the assertion that failed and what it reveals is broken in the code>   (omit the whole block if none)

NOT_COVERED:
- <scenario left out, one line each, with reason>
```

**When RUN_AFTER = no:**

```
TESTS_WRITTEN:
- <file path> (<class>): <N tests>, <one-line coverage summary> [extended existing | new]

MANUAL_INSTRUCTIONS:
- setup: <e.g. install command if INSTALL_STATE=deferred, else "none">
- run_all: <RUN_COMMAND>
- run_focused: <command to run a single file>
- expected: <what a passing run looks like, and which tests prove which behaviour>
- on_failure: <how to tell a test gap from a real bug>

NOT_COVERED:
- <scenario left out, one line each, with reason>
```
