# GearPack Refactor — Design Spec
**Date:** 2026-06-27
**Approach:** B — Phased Incremental
**Phases:** 3 (Security + Cleanup → Code Quality → Performance)
**Execution protocol:** Self-checking loop + parallel agents per phase

---

## Self-Checking Loop Protocol (embedded in every phase)

Each phase is executed by agents running this loop until FINAL:

```
TASK: [phase-specific task]

SUCCESS CRITERIA: [phase-specific, binary — pass/fail]

LOOP PROTOCOL (repeat every turn):
1. PLAN   — state the single next step
2. DO     — make the change
3. VERIFY — score 1–10 on each criterion. Be brutal. List exactly what is weak.
4. DECIDE — if every criterion >= 8, print FINAL and stop.
             Otherwise print ITERATING, fix the weakest score first.

RULES:
- Never call it done until every criterion is 8 or higher.
- Each pass must fix the weakest score from the last VERIFY.
- Do not ask questions. Make a sensible assumption, note it, and keep going.
```

---

## Phase 1 — Security + Root Cleanup

### What Changes

| # | Task | Files Affected | Can Parallel? |
|---|------|---------------|---------------|
| 1A | Untrack `.env`, verify `.gitignore` covers it, create `.env.example` with all keys but no real values | `.gitignore`, `.env.example` (new) | Yes |
| 1B | Remove ghost `.gitignore` entries (`BEGINNER_GUIDE.md`, `CODE_EXPLANATION.md`, `CODE_PATTERNS.md`, `PROJECT_GUIDE.md`) | `.gitignore` | Yes (after 1A) |
| 1C | Collapse `vitest.client.config.ts` + `vitest.server.config.ts` into `vitest.config.ts` as inline workspace projects. Delete the two sub-files. | `vitest.config.ts`, delete `vitest.client.config.ts`, delete `vitest.server.config.ts` | Yes |
| 1D | Move `prisma.config.ts` → `prisma/prisma.config.ts`. Update any imports that reference the root path. | `prisma/prisma.config.ts` (new), root `prisma.config.ts` (delete), any importer | Yes |

### What Does NOT Change
- `middleware.ts` stays at root (Next.js requires it there or at `src/`)
- `Dockerfile`, `docker-compose.yml`, `.dockerignore` — untouched
- `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `tsconfig.json` — untouched
- All `src/` code — untouched in Phase 1

### Done Criteria (binary — all must pass before Phase 2)

```
TASK: Execute Phase 1 of GearPack refactor (Security + Root Cleanup)

SUCCESS CRITERIA:
1. `git ls-files | grep "^\.env$"` returns empty (credentials no longer tracked)
2. `.env.example` exists at root with every key from `.env` but placeholder values only
3. Root directory has exactly 1 vitest config file (`vitest.config.ts`); client and server projects defined inline
4. `prisma/prisma.config.ts` exists; root `prisma.config.ts` is deleted; `npx prisma migrate dev --dry-run` succeeds
5. `.gitignore` contains no references to BEGINNER_GUIDE.md / CODE_EXPLANATION.md / CODE_PATTERNS.md / PROJECT_GUIDE.md
6. `npm run test` exits 0 (all suites pass)
```

---

## Phase 2 — Code Quality

### What Changes

#### 2A: Split `src/app/actions/ai-chat.ts` (380 lines → directory of focused modules)

**New structure:**
```
src/app/actions/ai-chat/
  index.ts        — re-exports: sendAIMessage, getChatHistory
  send.ts         — sendAIMessage() orchestrator only (~80 lines)
  history.ts      — getChatHistory(), parseUICards(), filterToolOutputs() (~100 lines)
  polling.ts      — pollRun(), executeToolCall() (~100 lines)
  context.ts      — buildSystemPrompt(), injectPreferences(), pickPreferenceQuestion() (~80 lines)
```

Old file `src/app/actions/ai-chat.ts` is **deleted**. All existing imports (components referencing `@/app/actions/ai-chat`) must be updated to `@/app/actions/ai-chat` (same path, resolves to index.ts).

**Dependency:** Must complete before 2B and 2C (they touch ai-chat code too).

#### 2B: Eliminate `any` types (can parallel with 2C, 2D after 2A is done)

| Location | Current | Fix |
|----------|---------|-----|
| `src/components/gear/GearForm.tsx` — `initialData` prop | `any` | Create `GearFormData` type in `src/types/gear.ts` |
| `src/app/actions/social.ts` — Prisma result spread | `as any` | Use proper Prisma `$inferSelect` type |
| `src/app/auth/callback/route.ts` — `preferences as any` | `as any` | Use `Prisma.JsonValue` or typed cast |
| `src/lib/ai/tools.ts` — `typeof item === 'string'` branch | implicit `any` | Type the union explicitly |
| `src/lib/ai/preferences.ts` — `store as any` in update | `as any` | Use `Prisma.InputJsonValue` |

New file: `src/types/gear.ts`, `src/types/trip.ts`, `src/types/social.ts` for shared domain types.

#### 2C: Fix `filterdUsers` typo in `src/app/actions/social.ts` line 51
Single character fix. Variable rename: `filterdUsers` → `filteredUsers`.

#### 2D: Expand test coverage (parallel with 2B, 2C)

New test files:
```
src/app/actions/__tests__/ai-chat.test.ts
  - getChatHistory: filters tool output messages correctly
  - getChatHistory: extracts UI cards from markdown blocks
  - sendAIMessage: returns error on Backboard failure

src/lib/ai/__tests__/preferences.test.ts
  - normalizePreferenceStore: fills missing keys with defaults
  - applyPreferenceUpdates: confirmed preference is not overwritten
  - applyPreferenceUpdates: conflict is logged when value differs from confirmed
  - pickHighImpactMissingPreference: returns null when all prefs are confirmed
```

Existing component test files (already exist, verify they pass):
- `src/components/gear/__tests__/GearCard.test.tsx`
- `src/components/gear/__tests__/GearForm.test.tsx`
- `src/components/gear/__tests__/GearGrid.test.tsx`

#### 2E: Standardize error messages (parallel with 2B, 2C, 2D)

All server actions return user-facing error strings. Current inconsistency: some expose internals (`"Prisma error: ..."`), some are friendly, some are missing context.

Rule: Every `return { success: false, error: '...' }` must be a user-readable sentence. No stack traces, no Prisma model names. Audit all 12 action files.

### What Does NOT Change in Phase 2
- No Prisma schema changes
- No query logic changes (that's Phase 3)
- No route structure changes
- Docker / config files — untouched

### Done Criteria

```
TASK: Execute Phase 2 of GearPack refactor (Code Quality)

SUCCESS CRITERIA:
1. `src/app/actions/ai-chat.ts` does not exist; `src/app/actions/ai-chat/index.ts` does; no file in the directory exceeds 150 lines
2. `npx tsc --noEmit` exits 0 with 0 errors (no `any` types, no implicit anys)
3. `grep -rn "filterdUsers" src/` returns empty
4. `npm run test:server` runs ai-chat.test.ts and preferences.test.ts and exits 0
5. `npm run test` exits 0 (all suites pass, nothing regressed)
6. Every `return { success: false, error: ... }` value in src/app/actions/ is a user-readable sentence with no Prisma/DB implementation details
```

---

## Phase 3 — Performance

### What Changes

#### 3A: Fix friendship filtering in `src/app/actions/social.ts` — `searchUsers()`

**Current (broken):** Fetches all user's friendships into memory, then `Array.filter()` to exclude existing connections.

**Fix:** Single Prisma query using `NOT` + subquery to exclude users who already have a friendship relation with the current user.

```typescript
// Replace in-memory filter with:
where: {
  AND: [
    { username: { contains: query, mode: 'insensitive' } },
    { id: { not: userId } },
    {
      NOT: {
        OR: [
          { sentRequests: { some: { friendId: userId } } },
          { receivedRequests: { some: { userId: userId } } },
        ]
      }
    }
  ]
}
```

#### 3B: Add cursor-based pagination to `src/app/actions/messages.ts`

`getMessages(conversationId, cursor?, limit=30)` — returns `{ messages, nextCursor }`.
`getConversations(userId, cursor?, limit=20)` — returns `{ conversations, nextCursor }`.

Components that call these functions must be updated to handle paginated responses and implement infinite scroll or "load more".

#### 3C: Fix N+1 in `getConversations` — `src/app/actions/messages.ts`

**Current:** `include: { participants: { include: { user: true } }, messages: true }` — loads all messages for all conversations.

**Fix:** Use `_count` for unread count, select only the latest message per conversation via `take: 1, orderBy: { createdAt: 'desc' }` on the messages relation.

#### 3D: Rate limiting — DB-backed

Add a `RateLimit` model to `prisma/schema.prisma`:
```prisma
model RateLimit {
  id        String   @id @default(uuid())
  key       String   // e.g. "trip:userId" or "friend:userId"
  count     Int      @default(0)
  windowEnd DateTime
  @@unique([key])
}
```

Apply limits in:
- `createTrip` — 10 trips per user per hour
- `sendFriendRequest` — 20 requests per user per hour
- `sendMessage` — 60 messages per user per hour

Helper: `src/lib/rate-limit.ts` — `checkRateLimit(key, maxCount, windowMs): Promise<{ allowed: boolean }>`.

**Note:** If adding a Prisma model feels too heavy for now, a simple in-memory Map with TTL is acceptable as a first pass — note the assumption and flag it for Redis migration later.

### What Does NOT Change in Phase 3
- AI chat logic — untouched (Phase 2)
- Auth flow — untouched
- UI components — only pagination consumers updated

### Done Criteria

```
TASK: Execute Phase 3 of GearPack refactor (Performance)

SUCCESS CRITERIA:
1. `searchUsers()` in social.ts contains no `Array.filter()` or `.filter(` call for friendship exclusion — filtering is done in the Prisma WHERE clause
2. `getMessages()` accepts a `cursor` param and returns `{ messages, nextCursor }`
3. `getConversations()` does not load all messages per conversation — uses `take: 1` on messages relation
4. `checkRateLimit()` exists in `src/lib/rate-limit.ts` and is called in createTrip, sendFriendRequest, sendMessage
5. Rapid calls (>10/min) to createTrip return `{ success: false, error: 'Rate limit exceeded...' }`
6. `npm run test` exits 0
```

---

## Execution Order Summary

```
Phase 1 (parallel tasks 1A+1B+1C+1D) → human review →
Phase 2 (2A first, then 2B+2C+2D+2E in parallel) → human review →
Phase 3 (3A+3B+3C in parallel, 3D sequential after schema migrate) → human review → done
```

## Invariants (never break these)

- `npm run build` must pass at the end of every phase
- `npm run test` must pass at the end of every phase
- No credentials in any committed file, ever
- No file in `src/app/actions/` exceeds 200 lines after Phase 2
