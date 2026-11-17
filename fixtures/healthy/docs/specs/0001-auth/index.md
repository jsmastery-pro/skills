# 0001 Auth

**Status**: Decided
**Date**: 2026-11-17

## Requirements

- **AC-1**: A person with a valid account signs in and lands on the dashboard.
- **AC-2**: A person with a wrong password sees one error and stays on the form.

## Feature design

**Target devices** (mobile or responsive features only):
Web at 390 and 1280 px.

## Testing

- Happy path: sign in with a valid account, verifies **AC-1**
- Failure case: wrong password, verifies **AC-2**

## Build plan

1. Build the sign in form, satisfies **AC-1**, **AC-2**
2. Set the session cookie, satisfies **AC-1**
