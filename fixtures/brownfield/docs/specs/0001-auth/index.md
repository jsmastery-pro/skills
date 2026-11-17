# 0001 Auth

**Status**: Assumed
**Date**: 2026-11-17

## Requirements

### AC-1

A person with a valid account signs in and lands on the dashboard.

### AC-2

A person with a wrong password sees one error and stays on the form.

## Build decisions

- Session storage: an http only cookie (safer than local storage) · /develop · 2026-11-17

## Code area

src/auth/
