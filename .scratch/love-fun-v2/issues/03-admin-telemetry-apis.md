# 03: Telemetry & Frame Catalog Admin APIs

**What to build:**
Create secure REST endpoints to supply live metrics and manage custom frames in PostgreSQL/Prisma, accessible exclusively to users with `role: "SUPER_ADMIN"`.

**Status:** closed

- [x] Implement `GET /api/admin/metrics` returning photo session counts, active room counts, chemistry stats, and user counts.
- [x] Implement `GET /api/admin/frames` and `POST /api/admin/frames` for creating/toggling frames in `FrameCatalog`.
- [x] Enforce strict 403 Forbidden checks for non-super-admins.
