# Changelog Template

Append an entry to `CHANGELOG.md` at the repo root. Use the **Edit** tool to insert under the current unreleased/top section. Do not rewrite existing entries.

**Match the existing file first.** If `CHANGELOG.md` already exists, follow *its* structure and wording style (heading levels, section names, date format, bullet phrasing) per CHANGELOG_FORMAT_NOTE (do not impose the format below over a different established one). The format below is the default **only when creating the file fresh**.

**Idempotency.** Read the existing entries before adding. If an equivalent line for this change is already under the unreleased section, do not add a duplicate.

## If CHANGELOG.md does not exist

Create it with this header, then add the entry:

```markdown
# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
```

## Entry format

Add lines under the correct subheading inside `## [Unreleased]` (create the subheading if absent). Categories, in this order:

```markdown
## [Unreleased]

### Added
- <new capability, user-facing phrasing>

### Changed
- <change in existing behaviour>

### Deprecated
- <soon-to-be-removed feature>

### Removed
- <removed feature>

### Fixed
- <bug fix, describe the bug, not the code>

### Security
- <vulnerability addressed>
```

Rules:
- One bullet per notable change. Skip refactors that are internal only and do not affect users or integrators.
- Write from the reader's perspective: "Added pagination to the orders endpoint", not "Added `limit` param to `getOrders`".
- Map the change to the right category. A fix is `Fixed`; a new flag is `Added`; a behaviour change is `Changed`.
- Only include categories that have entries. Don't leave empty headings.
- Reference a spec or issue number in parentheses when it adds traceability, e.g. "(see spec 0007)".
