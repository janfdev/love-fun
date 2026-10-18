# 04: Backend & Synchronous State for "Who's Most Likely To"

**What to build:**
Multi-device game session engine and question state handling for the "Who's Most Likely To" couple game, running on PostgreSQL/Prisma with 5-hour TTL room codes.

**Status:** closed

- [x] Support `game_type: "WHOS_MOST_LIKELY"` in room creation.
- [x] Implement `POST /api/rooms/likely/create` returning 6-digit room code.
- [x] Implement `POST /api/rooms/likely/answer` to accept `[ME]` or `[PARTNER]` choices per round and evaluate matches.
- [x] Implement room join endpoint `POST /api/rooms/likely/join`.
