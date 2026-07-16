# Engineering Workflow Skills

## What this is

A set of skills that take a change from a rough idea to shipped, tested, and documented code, one skill per stage of the work. The important state lives in files in your repository, not in a chat, so the work survives across sessions and is shared with your whole team.

---

## The workflows

There are nine. You run only the ones a change needs, in whatever order fits.

| Workflow | What it does |
|---|---|
| `scope` | Turns an idea into a coarse plan of what to build and in what order. |
| `audit` | Writes the context files that tell every other skill how your project works. |
| `architect` | Makes a real decision (a stack, a data model, a page design) and writes it as a spec. |
| `develop` | Builds a feature, user interface or backend, from its spec. |
| `check` | Confirms a change before merge, by running the real app and by a second review. |
| `test` | Writes a test suite for the code you just changed. |
| `document` | Writes the human facing text, a pull request body, a changelog, a release note. |
| `sync` | Brings the context files, the scope, and the specs back in line with the code. |
| `debug` | Finds and fixes the root cause of a bug, then hands a test to `test`. |

---

## How it works

### The files that carry the work, and how they live

Everything the workflow knows is written into files in your repo. This is the whole idea. A chat can end, a session can be cleared, a teammate can pull the branch, and the knowledge is still there because it was never trapped in a conversation. There are four kinds of file, and each one has a clear life.

**The context files, named `AGENTS.md`.** These describe how your project actually works, its stack, its commands, its conventions. They are written in plain text that any coding agent can read. On a project that uses Claude Code there is also a tiny `CLAUDE.md` that does nothing but point at `AGENTS.md`, so there is only ever one real source and no copy to drift.

The key idea is that these files nest. There is one at the root of the project for rules that apply everywhere. There can be more inside folders for rules that apply only to that area. For example a project might have a root `AGENTS.md` and also a `src/payments/AGENTS.md` that records rules only the payments code follows. When a skill works on the payments code, it reads the nearest one, so it sees both the project wide rules and the local ones. `audit` creates these files. Every other skill reads them. `sync` keeps them current as the code changes. No skill guesses your conventions when a context file already states them.

**The scope, in `docs/scope/`.** This is the coarse plan of what to build and in what order. `scope` creates it. `develop` advances it as features get built, marking a feature as in progress and ticking milestones, but never marking a feature fully done on its own, because built is not the same as verified. A plain run of `scope` with no argument, and `sync` at merge time, reconcile it back against what the code now shows.

**The specs, in `docs/specs/`.** A spec is the written record of one real decision, and it is the contract the build follows. This is the file type people ask about most, so here is its full life.

- It is **created** by `architect` the moment a real decision is made, for example which login method to use or what the data looks like. It is born with the status `Proposed`, meaning decided but not yet built. A spec written to document something already shipped is born `Accepted` instead.
- It is **loaded** by `develop` when the build starts. `develop` reads only the parts it needs to build, the requirements and their acceptance criteria, the decision, the design, and the ordered build plan. It does not reread the long reasoning behind the decision, because that is history, not build input.
- It is **changed** in a very narrow way. As the build runs, `develop` moves the status line from `Proposed` to `In Progress`, and later from `In Progress` to `Accepted` once the feature is built and verified. `develop` touches only that one status line. It never edits the decision itself.
- It is **replaced** by `architect` when a decision is genuinely overturned. `architect` writes a new spec and marks the old one `Superseded`, with a pointer to the one that replaced it, so the history stays readable.
- It is **flagged** by `sync` if a later change quietly made a spec out of date, so a human can bring it in line.

There is one more status, `Assumed`, for the case where you chose to build before a real decision was made. When `develop` hits a load bearing choice that has no spec and you tell it to build anyway, it does not just guess in silence. It writes a small spec marked `Assumed` that records the assumption it is building on, who authorized it, and the code it touches. This is the only spec `develop` is allowed to create, and it can only ever create it in this one state. An `Assumed` spec means "recorded but not thought through," so the feature it governs cannot be marked done. To clear it you run `architect` again, which deliberates the decision properly against the code that was built, then either fills in the real reasoning and lifts the `Assumed` mark, or, if the assumption was wrong, writes a corrected spec and marks the old one `Superseded` so `develop` rebuilds. That step is called ratification, and it is what lets an override keep moving without the decision ever escaping into the chat.

Two rules keep this clean. Only `architect` writes the content of a spec and only `architect` clears an `Assumed` mark. Only `develop` moves the status along the built lifecycle, and the one new spec it may create is the `Assumed` stub. That single ownership is why the files do not turn into mush over time.

**The design system, in `design.md`.** This holds the art direction for your user interface, the character and the rules for how pages are put together. The real values, the exact colors and sizes, live in your project's CSS, and `design.md` only points at them, so a value is never written in two places. `develop` creates this the first time you build a user interface, or extracts it from your existing screens.

### Who owns which file

The files stay trustworthy because ownership is fixed. Here is who creates each file, who reads it, and who is allowed to change it.

| File | Created by | Read by | Changed by |
|---|---|---|---|
| `AGENTS.md` and its `CLAUDE.md` pointer | audit | every skill | sync |
| Scope in `docs/scope/` | scope | architect, develop | develop advances it, scope and sync reconcile it |
| Specs in `docs/specs/` | architect (plus the `Assumed` stub, which develop may create) | develop | develop moves the status line along the built lifecycle and may create a spec only in the `Assumed` state; architect owns all content, clears the `Assumed` mark by ratifying, and marks a replacement; sync flags a stale one and surfaces an unratified `Assumed` one |
| `design.md` and the CSS values it points at | develop | develop, check | develop |

### The one thread that ties the stages together

Under all the stages runs a single thread that keeps the work honest, the acceptance criteria. When `architect` writes a spec, it turns each requirement into a short, numbered statement of what done means, for example a rule that a signed in person sees only their own tasks. Every task in the build plan names which numbered rule it serves. When `develop` finishes, the check steps it writes trace back to those same numbered rules. `check` in verify mode runs those steps, and `test` locks the lasting ones into a test suite. So a single requirement can be followed in a straight line, from the decision, to the code that satisfies it, to the proof that it works, to the test that keeps it working. Nothing important is left unmeasured, and nothing is marked done that was not actually proven.

### A worked example, from idea to shipped

To make the flow concrete, follow one idea all the way through. The idea is a small app where people sign in and keep their own to do list. It is a brand new project, so it touches almost every stage. At each stage the workflow asks a small number of questions, and each answer changes what happens next. The questions come up in a fixed order, shown here in that order.

#### Stage 1, scope the idea

You run `scope`. It turns the idea into a coarse plan and writes it to `docs/scope/`. Because there is no code yet, it treats this as a brand new project and plans the first slices, starting with the foundation and the first real feature.

The one real question here is how you want to deliver the work. The workflow offers four delivery styles, and your pick shapes the order everything is built in later.

- **Thin thread first.** Build one narrow path that goes all the way through every layer, from the screen to the database, and works end to end, then thicken it. Good when you want something real and connected as early as possible.
- **Smallest usable thing first.** Build the smallest version that a person could actually use, then grow it. Good when you want to ship and learn fast.
- **Look first, wire later.** Build the screens on fake data first so you can see and feel the product, then connect the real backend afterward. Good for a prototype or when the look needs sign off before you invest in the plumbing.
- **One whole journey at a time.** Finish one complete user path fully, every state of it, before starting the next. Good when each path must feel finished.

Whatever you pick is recorded as the project default. Any single feature can override it later if that one feature is better built a different way.

Before it finishes, `scope` makes one more recommendation, how much workflow this project wants by default. Not every project needs the full loop, and a small app should not be pushed through review and a separate test suite for a styling tweak. So it proposes one of four depths, with a clear recommendation you can override, and explains what each one runs. The depth sets the stages that run after `develop`, the checking tail, and it also sets what "done" means, the last required stage is what marks a feature done. It does not turn off the gate, so at every depth a feature that needs a real decision still goes through `architect` first (or records an assumed spec).

- **Vibe.** Just `develop`, nothing after it. You rely on `develop`'s own build time self check, it typechecks the code and renders the screen to look at it when it can, plus your own eye. No `check` verify, no test suite, no review. Because you have chosen to skip separate verification, `develop` marks the feature done itself once it is built and self checked. Good for throwaway prototypes, experiments, and personal projects.
- **Lean.** After `develop`, `check` in verify mode on the real running app, which marks the feature done when it passes. No separate test suite or second opinion unless a feature asks for it. Good for low risk features and internal tools you still want proven.
- **Medium.** After `develop`, `check` in verify mode, then `test`, which closes the feature. No fresh model review by default. Good for most real products.
- **Full.** After `develop`, `check` in verify mode, `test`, a `check` review on a different model, then a `document` step, and most features are treated as needing a spec. Good for high risk work, payments, sign in, compliance, or a team codebase.

So lean does not mean skipping `architect`. It means lean features rarely need a decision in the first place, so you seldom reach it, and when one does need a decision the gate still routes you there. And the vibe tier is the one place the workflow lets `develop` call something done on its own, because you told it up front that this is throwaway work and you are opting out of separate proof. The one rule that still holds at every tier: a feature built on an assumed decision cannot be marked done until `architect` ratifies it, no matter how light the tier.

`scope` recommends the depth that fits what you described, a throwaway experiment lands on vibe, a small to do app on lean or medium, and records your pick as the project default. This is only a baseline. A single high risk feature still runs its heavier path, and later stages read this default so they never nag a vibe or lean project to run the full chain. For the to do app we take medium.

#### Stage 2, decide the stack

You run `architect`. Because this is a new project with no stack yet, it works in its stack mode, a wide comparison of options with a clear recommendation. Before it asks anything, it reads whatever context files exist, so it never asks what it can already see.

It sorts everything it needs into three kinds and treats each differently.

- Things it can **work out for itself** from your idea or your code, it never asks. It just uses them.
- Things **only you know**, like a rule your business must follow or a preference you hold, it asks, and only these.
- Things **expertise settles**, like which database or which login library fits, it recommends, with a short reason and a runner up, so you can override. It never dumps a plain list of options on you and never picks a tool silently behind your back.

One more question comes up here. If a decision could be helped by an outside connector or a ready made skill, the workflow asks first whether you want it to look, and only searches if you say yes. Nothing is fetched from the internet without your go ahead. Anything it does find and rely on gets written into the spec so a human can follow it later.

When the conversation is done, `architect` writes the decision as a spec in `docs/specs/`, with the status `Proposed`. This spec now exists as a file. It is the contract the build will follow.

#### Stage 3, scaffold and read the real project

You create the empty project skeleton with the stack's own setup tool, so there is a real project to read. Then you run `audit`. It reads the real, scaffolded project and writes the context files, a root `AGENTS.md` with a tiny `CLAUDE.md` pointer beside it, recording the stack, the commands to run things, and the conventions it can see. If it notices the project follows a known way of organizing code, it records that too, so later builds match it. On a project with distinct areas it can write a nested `AGENTS.md` inside a folder for that area's own rules.

The order here matters. The stack is chosen and the project exists before `audit` runs, so `audit` reads a real project instead of guessing about an empty folder.

#### Stage 4, design the sign in feature

You run `architect` again, this time for the sign in feature. Now it works in its feature mode, a focused design of one thing rather than a whole stack comparison. It uses the same three kinds of questions as before, working out what it can, asking only what you alone know, and recommending the rest.

Before writing, it checks whether a spec for this already exists. If a very close one is found, it asks whether to treat this as a brand new decision, an update to that existing spec, or a replacement of it. For a fresh feature it is a new spec. It also decides the shape of the spec, a single file for a simple decision, or a small folder when the decision is large or has parts inside it.

It writes the feature spec as `Proposed` and links it to the matching row in the scope, so the plan and the decision point at each other.

#### Stage 5, build it

You run `develop`. This is where the most branching happens, and it happens in a set order.

**First, the gate.** Before building anything, `develop` asks itself one question. To build this, would it have to invent something you have not decided. For the sign in feature the decision already exists as a spec, so it passes the gate and builds. If a decision were missing, it would stop and offer three ways forward.

- **Decide it first.** Go make the decision in `architect` now, then come back. This is the recommended path, and it is what keeps the agent from guessing.
- **No real decision here, build directly.** You have judged there is nothing to decide, so it builds.
- **Build now, record it as an assumed spec.** You want to keep moving, but the decision is real. So `develop` writes the assumption down first, as a small spec marked `Assumed`, then builds against it. This is the important part: the decision lives in the repository, not in the chat. The feature cannot be marked done until `architect` ratifies that assumption later, which is what keeps the override honest.

The old behavior let you skip and "backfill later," which left the real decision only in the conversation. That was the one hole in the promise that every decision lives in a file, and the `Assumed` spec closes it.

**Next, what kind of work is this.** `develop` sorts the task into user interface work, backend work, or both. Sign in is both, the sign in and sign up screens plus the session logic behind them, so it runs each part.

**The backend part** is built in a fixed order of phases, each with a senior rule baked in.

- It builds the data layer to match the spec, then actually runs the database change and confirms the tables really exist, rather than trusting that writing the change was enough.
- It builds the core logic, making repeated requests safe so a double tap cannot create two accounts, and checking every input at the edge.
- It builds the endpoints exactly as the spec says, and checks not just that a caller is logged in but that they are allowed to touch this particular thing. It also limits how often public endpoints can be hit.
- It wires any outside service the spec chose, reads secret keys from the environment rather than writing them into the code, and adds logging at the edges.
- If the build replaced older code, it deletes the old code so the two do not sit side by side.
- It finishes with a safety pass over the whole thing.

If the spec turns out to be wrong partway through, for example the data shape cannot hold, it stops and sends you back to `architect` to fix the spec first, rather than quietly building something different from what was decided.

**The user interface part** starts with one question, where the design comes from. Your answer picks one of four routes.

- **From a connected design tool.** If a design tool like Figma is connected and the spec says to use it, it pulls the real frames and builds to them.
- **From an image you paste in.** It copies that image faithfully and does not add flourishes beyond it.
- **From your existing design system.** If your project already has a `design.md` and design values in CSS, it designs the new screens inside that system so they match what already shipped.
- **From nothing, so it creates one.** If you have no design system yet, it builds one first.

If it has to create the design system, two more questions follow, in order. First it asks for any direction, a website or brand to draw from, a design file to adopt, a style described in words, or nothing at all in which case it suggests one. Then, if you gave nothing, it asks for a mood, for example calm and light, dark and focused, or bold. From that it works out a single accent color, a ladder of greys, the type sizes, the spacing, and the corners and motion, and here is the important part, it checks that the text will be readable against its background to the accessibility standard before it writes any CSS, in both light and dark mode, and fixes anything that fails rather than shipping it broken. It writes the real values into your CSS and the character and rules into `design.md`.

Two smaller questions can come up while building the interface. For a screen versus a small reusable piece, it treats them differently, a screen owns its layout and page states while a piece just takes inputs. And if the screen needs images it does not have, it asks whether you will add the real files, whether it should wire a stand in image service at the right sizes, or whether it should use plain colored placeholders, and it never invents a path to a file that does not exist.

Throughout, one standard governs the interface, that every screen must leave as a complete, professional product, not a bare form floating on an empty page. It composes the whole screen, brand, real wording, layout, and all the states like empty, loading, and error, and before it reports done it looks at its own work, rendering the screen if it can, and fixes visual defects.

The delivery style you chose back in stage 1 decides how these parts come together. Thin thread first means the screen binds to the real backend in the same pass. Look first means the screen stands up on fake data now and gets wired later.

**When the build lands,** `develop` moves the feature's spec from `Proposed` to `In Progress`, ticks the parts of the plan that truly landed, and updates the scope. It does not mark the feature fully done, because that waits for verification and tests. Finally it writes concrete steps to check the feature by hand, derived from the acceptance criteria, and asks whether to save them to a small `verify.md` beside the spec or just show them to you.

#### Stage 6, prove it runs

You run `check` in its verify mode. It drives the real running app and proves the feature actually works against its spec, every promised behavior and every promised screen, not just that a test file passed. For the to do app that means it can really sign up, sign in, and see its own list.

#### Stage 7, write the tests

You run `test`. It writes a real test suite for the code you just changed, working out your test framework, and asking and remembering it the first time. It covers the normal path, the edge cases, the error states, and the accessibility of any interface. When verification has passed and the tests are in, the feature can finally be marked done, and its spec moves from `In Progress` to `Accepted`.

#### Stage 8, get a second opinion

You run `check` in its review mode. It runs a senior code review, and it runs on a different model than the one that wrote the code, because a model reviewing its own work tends to agree with itself. It writes its findings to `docs/reviews/`, sorted from the most serious down to small preferences, and it also says what the change did well. It reads the code, it does not change it.

#### Stage 9, write it up

You run `document`. It reads the real commits and the real difference in the code and writes the human facing text, a pull request body, a changelog entry, a release note, whatever the moment needs, and puts each in the right place. It writes no code and no specs.

#### Stage 10, bring the knowledge back in line

You run `sync` as the last step around merge. It looks at what the code now shows and reconciles the durable files back to it. It updates the context files if the build introduced a new convention, reconciles the scope, and flags any spec the change made out of date. It makes small, surgical edits, adding lines and fixing the lines it owns, and never rewrites your prose.

At this point the loop is closed. The feature is shipped, proven, tested, reviewed, written up, and the files that carry the project's knowledge are current again. You clear the session and start the next feature fresh, and because everything lives in files, the fresh session knows exactly where things stand.

---

## When something breaks, the debug loop

You run `debug`. It does one thing only, find and fix the real cause, and it adds no features and tidies no unrelated code along the way. It reproduces the problem first, so it is fixing something real and not a guess. It narrows down where the fault lives. It forms one clear guess about the cause, then tests that guess. If the guess is wrong it forms another, rather than piling on random changes. Once it finds the cause it makes the smallest fix that works, confirms the problem is gone, and hands a regression test to `test` so the same bug cannot come back quietly. You reach for it anytime something is failing, throwing, or behaving wrong, and you need no scope and no spec to run it.

---

## The same flow on an existing codebase and in a monorepo

The worked example was a brand new project. Two common situations differ slightly.

On an existing codebase, run `audit` first. It reads your real code and writes the context files, so every later skill understands your stack and conventions before it touches anything. Then `scope` enrolls what already exists and plans the new slice on top. From there the loop is the same.

In a monorepo, which is one repository holding several projects, everything scopes to the one workspace you are working in. Each workspace gets its own scope, its own specs, and its own nested context files, and every skill stays inside the target workspace and uses that workspace's own commands. A change to one app does not reach into another.

---

## Safe to resume, and safe on a team

Because the state lives in files, you can stop at any handoff, clear the session, and pick up later with nothing lost. When `develop` resumes a half built feature, it reads which tasks are already done and starts at the first unfinished one, so it never rebuilds what already shipped.

On a team, before it changes anything, `develop` checks a few things and warns you rather than charging ahead. It checks whether your branch is behind the shared branch, in case a teammate already changed or shipped this. It checks whether you have uncommitted work in the area it is about to touch. And it checks whether a teammate looks to be partway through the same feature. These are warnings, not walls, but they surface before any code is written.

---

## What the workflow will not do

The limits matter as much as the features.

- It will not quietly decide a feature is done. What done requires depends on the workflow tier you chose in `scope`. At lean and above, built is not done: done waits for `check` in verify mode to pass, and for tests to be in at medium and up. The one exception is the vibe tier, where you opted out of separate verification for throwaway work, so built and self checked is done and `develop` may mark it. Either way the choice is yours and explicit, set once as the project tier, never slipped in silently. And at every tier a feature built on an assumed decision stays open until `architect` ratifies it.
- It works hard not to invent a decision you have not made and hide it, though this is a strong gate, not an absolute guarantee (no prompt can be). If building would mean guessing a provider, a data shape, or a design, `develop` stops and sends you to `architect`. You can override and build anyway, but then it writes the assumption down as an `Assumed` spec and blocks the feature from done until `architect` ratifies it. The gate is layered so a decision does not slip through silently: `architect` names the source of every value a feature must produce, `develop` checks that coverage again before it builds, and on higher tiers an independent model reads the spec for decisions it never settled. What that catches is the vast majority; what it misses is caught later as wrong behavior by `check` in verify mode and by `test`.
- It will not reach the internet without your go ahead. It asks before searching for an outside connector or looking anything up, and it records what it used.
- The review does not edit your code. It reads and reports, and you decide what to change.
- No skill rewrites your prose or reaches into another skill's files. Ownership is fixed, which is what keeps the files trustworthy over time.

---

## Common questions

**Do I have to run all nine?** No. You run only the ones a change needs. A tiny change can be just `develop` and then `check` in verify mode. A bug is just `debug`.

**What if there is no spec yet?** If a real decision is missing, `develop` stops and offers to send you to `architect` to make it, or to build directly if you judge there is nothing to decide, or to build now and record the assumption as an `Assumed` spec. That last option keeps you moving while still writing the decision into the repository, and it parks the feature short of done until you run `architect` to ratify the assumption.

**Is it fine to never ratify an `Assumed` spec?** It is allowed, but it is not free. The feature can never be marked done, and both a bare `scope` and `sync` keep surfacing the `Assumed` spec as an open decision that is owed. For a throwaway spike that is fine, leave it. For real work the unclosable status is the nudge to go ratify it. The workflow does not block a merge, but the assumption and the fact that it is owed stay durable in the repository, which is the guarantee it actually makes.

**Why clear the session between stages?** A long chat costs more and drifts. Because the work is saved in files, a fresh session reads the current state from disk and continues cleanly, so clearing loses nothing.

**Where do the files go if my `docs/` folder is a published site?** If `docs/` is a live documentation site, the workflow writes its files to a `.workflow/` folder instead, so they do not ship with your site.

**Can I change the delivery style for one feature?** Yes. The style you pick in `scope` is the project default, and any single feature can override it when that feature is better built a different way.

---

## Getting started

Install with `npx skills`. Pick the line for your agent.

```bash
# Claude Code, installs into .claude/skills, then restart Claude Code
npx skills@latest add JavaScript-Mastery-Pro/skills -a claude-code

# Generic .agents/skills, read by Codex and other agents
npx skills@latest add JavaScript-Mastery-Pro/skills
```

Commit the installed skills folder so your whole team shares the same workflow. For a brand new product start at stage 1 above. For an existing codebase run `audit` first so every skill understands your project, then plan the next slice with `scope` and follow the same loop. For a bug, go straight to `debug`. For a tiny change, run just `develop` and then `check` in verify mode.
