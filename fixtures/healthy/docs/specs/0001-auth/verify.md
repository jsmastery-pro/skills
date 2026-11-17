# Verify: Auth · spec 0001 · updated 2026-11-17

## UI / manual

- [x] Open /login, sign in with a valid account, expect the dashboard → AC-1
- [x] Open /login, submit a wrong password, expect one error and no navigation → AC-2

## Acceptance-criteria coverage

- AC-1 covered by step 1 · AC-2 covered by step 2

## Evidence

- AC-1 · /login → /dashboard · `docs/reviews/0001-auth/verify/ac1-390.png` · web 390 px · 2026-11-17
- AC-2 · /login wrong password → one error · `docs/reviews/0001-auth/verify/ac2-390.png` · web 390 px · 2026-11-17
