# 01: Super Admin RBAC & Automated Session Gate

**What to build:**
Super Admin (`fauzanrizqinoor@gmail.com`) automatically accesses `/dashboard` based on their verified session cookie without entering manual passphrase keys. Non-super-admin users and unauthenticated guests are rejected.

**Status:** closed

- [x] `/dashboard` verifies current session via `/api/auth/me`.
- [x] If authenticated user email matches `SUPER_ADMIN_EMAILS` (`fauzanrizqinoor@gmail.com`), automatically display dashboard controls without passphrase prompt.
- [x] If user is not Super Admin, redirect to `/login` or `/profile`.
- [x] Remove hardcoded passphrase gate (`lovefun2026`).
