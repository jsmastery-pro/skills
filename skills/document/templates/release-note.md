# Release Notes Template

Write release notes for VERSION_RANGE, written for users to `docs/releases/<version>.md`. Audience is **end users**, not developers, so translate technical changes into what users can now do, and lead with what they'll care about most.

## Structure

```markdown
# <Product> <version>

_Released <DATE>_

<1 to 2 sentence summary of the release's theme, the headline a user should remember.>

## Highlights

- **<Feature name>**: <what it does for the user, in one sentence.>
- **<Feature name>**: <user benefit.>

## Improvements

- <smaller enhancement, phrased for users>

## Fixes

- <fixed issue, described as the user experienced it, "Fixed a problem where…">

## Breaking changes

<Only if any. State plainly what breaks, who is affected, and the migration step. Omit the section if there are none.>

## Upgrade notes

<How to upgrade, if there's anything to do. Omit if upgrading is automatic/trivial.>
```

Rules:
- Lead with user value, not implementation. "You can now export reports as CSV" beats "Added CSV serialization to the export module".
- Group by importance: Highlights first, then Improvements, then Fixes.
- Be honest about breaking changes. Never bury them. They get their own clearly labelled section.
- No internal jargon, ticket numbers, or file names. This is the most polished, least technical of the four document types.
- Derive everything from the actual commits/diff in the range. Don't promise features that aren't there.
