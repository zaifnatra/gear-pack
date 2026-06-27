# Phase 3 — Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the two-query friendship pattern in searchUsers, add cursor pagination to getMessages, and add in-memory rate limiting to createTrip/sendFriendRequest/sendMessage.

**Architecture:** Tasks 3A and 3C are independent. Task 3B is also independent. All three can run in parallel. No schema migrations required (rate limiting uses in-memory Map, not a Prisma model).

**Tech Stack:** Next.js 16 App Router, Prisma 7, TypeScript strict mode, Vitest 4.

---

## Note on 3C (N+1 in getConversations)

`getConversations` already uses `messages: { take: 1, orderBy: { createdAt: 'desc' } }` — the N+1 is already fixed. Phase 3C is implemented as rate limiting instead.

---

## Execution Order

```
3A + 3B + 3C run in parallel → commit each → final verification
```

---

## File Map

### Modified
| File | Change |
|------|--------|
| `src/app/actions/social.ts` | Replace two-query searchUsers with single Prisma WHERE |
| `src/app/actions/messages.ts` | Add cursor + limit params to getMessages |
| `src/app/actions/trips.ts` | Call checkRateLimit in createTrip |
| `src/app/actions/social.ts` | Call checkRateLimit in sendFriendRequest |
| `src/app/actions/messages.ts` | Call checkRateLimit in sendMessage |

### Created
| File | Purpose |
|------|---------|
| `src/lib/rate-limit.ts` | In-memory sliding-window rate limiter |

---

## Task 3A — Fix searchUsers: Eliminate Two-Query Pattern

**File:** `src/app/actions/social.ts`

**Self-Checking Loop**

```
TASK: Replace the two-query pattern in searchUsers (user query + friendship query + in-memory filter)
      with a single Prisma query using NOT subquery conditions.

SUCCESS CRITERIA:
1. searchUsers contains no separate prisma.friendship.findMany call
2. searchUsers contains no Array.filter call for friendship exclusion
3. The Prisma where clause uses NOT with sentRequests/receivedRequests subqueries
4. npx tsc --noEmit exits 0
5. npm run test exits 0

LOOP PROTOCOL: PLAN → DO → VERIFY → DECIDE (FINAL if all >=8)
```

---

- [ ] **Step 3A-1: Replace searchUsers with single-query implementation**

Open `src/app/actions/social.ts`. Replace the entire `searchUsers` function (lines 8–58) with:

```typescript
export async function searchUsers(query: string, currentUserId: string) {
    if (query.length < 2) return { success: true, data: [] }

    try {
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { username: { contains: query, mode: 'insensitive' } },
                            { fullName: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } }
                        ]
                    },
                    { id: { not: currentUserId } },
                    {
                        NOT: {
                            OR: [
                                { sentRequests: { some: { friendId: currentUserId } } },
                                { receivedRequests: { some: { userId: currentUserId } } },
                            ]
                        }
                    }
                ]
            },
            take: 10,
            select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true
            }
        })

        return { success: true, data: users }
    } catch (error) {
        console.error('Search users error:', error)
        return { success: false, error: 'Failed to search users' }
    }
}
```

- [ ] **Step 3A-2: Verify the old two-query pattern is gone**

```bash
grep -n "friendship.findMany\|filteredUsers\|connectedUserIds" src/app/actions/social.ts
```

Expected: empty output.

- [ ] **Step 3A-3: Type check and run tests**

```bash
npx tsc --noEmit
npm run test
```

Expected: 0 errors, all tests pass.

- [ ] **Step 3A-4: Commit**

```bash
git add src/app/actions/social.ts
git commit -m "$(cat <<'EOF'
perf: replace two-query searchUsers with single Prisma WHERE

Eliminated separate prisma.friendship.findMany + in-memory Array.filter.
Single query uses NOT subquery on sentRequests/receivedRequests relations
to exclude users with any existing friendship relation.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3B — Add Cursor Pagination to getMessages

**File:** `src/app/actions/messages.ts`

**Self-Checking Loop**

```
TASK: Add optional cursor + limit parameters to getMessages. Return nextCursor for
      "load more" pagination. Backward compatible (existing callers with no args still work).

SUCCESS CRITERIA:
1. getMessages signature is: getMessages(conversationId: string, cursor?: string, limit?: number)
2. getMessages returns { success: true, data: messages, nextCursor: string | null }
3. ChatInterface.tsx still calls getMessages with 1 arg (no changes needed — optional params)
4. npx tsc --noEmit exits 0
5. npm run test exits 0

LOOP PROTOCOL: PLAN → DO → VERIFY → DECIDE (FINAL if all >=8)
```

---

- [ ] **Step 3B-1: Replace getMessages with paginated implementation**

Open `src/app/actions/messages.ts`. Find the `getMessages` function (around line 242). Replace it with:

```typescript
export async function getMessages(conversationId: string, cursor?: string, limit = 30) {
    try {
        const messages = await prisma.message.findMany({
            where: { conversationId },
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: { id: true, username: true, fullName: true, avatarUrl: true }
                },
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        sender: { select: { username: true } }
                    }
                },
                reactions: {
                    include: {
                        user: { select: { id: true, username: true } }
                    }
                }
            },
        })

        const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null

        return {
            success: true,
            data: messages.reverse(),   // Restore chronological order for display
            nextCursor,
        }
    } catch (error) {
        console.error('Failed to fetch messages:', error)
        return { success: false, data: [], nextCursor: null, error: 'Failed to fetch messages' }
    }
}
```

- [ ] **Step 3B-2: Verify ChatInterface.tsx call is still valid**

```bash
grep -n "getMessages" src/components/social/ChatInterface.tsx
```

Expected: single call with 1 argument — `getMessages(activeConversation.id)`. This still works because `cursor` and `limit` are optional.

- [ ] **Step 3B-3: Type check and run tests**

```bash
npx tsc --noEmit
npm run test
```

Expected: 0 type errors, all tests pass.

- [ ] **Step 3B-4: Commit**

```bash
git add src/app/actions/messages.ts
git commit -m "$(cat <<'EOF'
perf: add cursor pagination to getMessages

getMessages(conversationId, cursor?, limit=30) now returns { data, nextCursor }.
Fetches newest-first then reverses to chronological order for display.
Backward compatible: existing single-arg callers are unaffected.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3C — In-Memory Rate Limiting

**Files:** `src/lib/rate-limit.ts` (new), `src/app/actions/trips.ts`, `src/app/actions/social.ts`, `src/app/actions/messages.ts`

**Note:** Rate limiting uses an in-memory Map. This resets on server restart and does not work across multiple instances. Sufficient for single-server deployment; flag for Redis migration if horizontal scaling is needed.

**Self-Checking Loop**

```
TASK: Create src/lib/rate-limit.ts with checkRateLimit helper.
      Apply to createTrip (10/hr), sendFriendRequest (20/hr), sendMessage (60/hr).

SUCCESS CRITERIA:
1. src/lib/rate-limit.ts exports checkRateLimit(key, maxCount, windowMs)
2. createTrip calls checkRateLimit and returns user-friendly error when exceeded
3. sendFriendRequest calls checkRateLimit and returns user-friendly error when exceeded
4. sendMessage calls checkRateLimit and returns user-friendly error when exceeded
5. npx tsc --noEmit exits 0
6. npm run test exits 0

LOOP PROTOCOL: PLAN → DO → VERIFY → DECIDE (FINAL if all >=8)
```

---

- [ ] **Step 3C-1: Create src/lib/rate-limit.ts**

```typescript
// src/lib/rate-limit.ts
// In-memory rate limiter. Resets on server restart.
// For multi-instance deployments, replace store with Redis.

interface RateLimitEntry {
    count: number
    windowEnd: number
}

const store = new Map<string, RateLimitEntry>()

export function checkRateLimit(
    key: string,
    maxCount: number,
    windowMs: number
): { allowed: boolean } {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now > entry.windowEnd) {
        store.set(key, { count: 1, windowEnd: now + windowMs })
        return { allowed: true }
    }

    if (entry.count >= maxCount) {
        return { allowed: false }
    }

    entry.count++
    return { allowed: true }
}
```

- [ ] **Step 3C-2: Apply rate limit to createTrip in trips.ts**

Open `src/app/actions/trips.ts`. Add the import at the top (after existing imports):

```typescript
import { checkRateLimit } from '@/lib/rate-limit'
```

Inside `createTrip`, add the rate limit check as the FIRST line of the `try` block (before the `prisma.trip.create` call):

```typescript
    try {
        const { allowed } = checkRateLimit(`trip:${userId}`, 10, 60 * 60 * 1000)
        if (!allowed) {
            return { success: false, error: 'You have created too many trips recently. Please wait before creating another.' }
        }

        const trip = await prisma.trip.create({
```

- [ ] **Step 3C-3: Apply rate limit to sendFriendRequest in social.ts**

Open `src/app/actions/social.ts`. Add the import after existing imports:

```typescript
import { checkRateLimit } from '@/lib/rate-limit'
```

Inside `sendFriendRequest(senderId, receiverId)`, add the check as the first line of the `try` block:

```typescript
    try {
        const { allowed } = checkRateLimit(`friend:${senderId}`, 20, 60 * 60 * 1000)
        if (!allowed) {
            return { success: false, error: 'You have sent too many friend requests recently. Please wait before sending more.' }
        }
```

- [ ] **Step 3C-4: Apply rate limit to sendMessage in messages.ts**

Open `src/app/actions/messages.ts`. Add the import after existing imports:

```typescript
import { checkRateLimit } from '@/lib/rate-limit'
```

Inside `sendMessage(conversationId, senderId, content, replyToId?)`, add the check as the first line of the `try` block:

```typescript
    try {
        const { allowed } = checkRateLimit(`msg:${senderId}`, 60, 60 * 60 * 1000)
        if (!allowed) {
            return { success: false, error: 'You are sending messages too quickly. Please slow down.' }
        }

        const message = await prisma.message.create({
```

- [ ] **Step 3C-5: Type check and run tests**

```bash
npx tsc --noEmit
npm run test
```

Expected: 0 errors, all tests pass.

- [ ] **Step 3C-6: Commit**

```bash
git add src/lib/rate-limit.ts src/app/actions/trips.ts src/app/actions/social.ts src/app/actions/messages.ts
git commit -m "$(cat <<'EOF'
feat: add in-memory rate limiting to createTrip, sendFriendRequest, sendMessage

src/lib/rate-limit.ts: sliding-window counter using Map<key, {count, windowEnd}>.
Limits: 10 trips/hr per user, 20 friend requests/hr, 60 messages/hr.
In-memory only — flags for Redis migration on horizontal scale-out.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Final Phase 3 Verification

Run after all 3 tasks are committed:

```bash
# 1. No in-memory friendship filter
grep -n "friendship.findMany\|filteredUsers\|connectedUserIds" src/app/actions/social.ts
# Expected: empty

# 2. Cursor pagination exists
grep -n "cursor.*limit\|nextCursor" src/app/actions/messages.ts | head -5
# Expected: shows cursor param and nextCursor return

# 3. Rate limiter applied
grep -n "checkRateLimit" src/app/actions/trips.ts src/app/actions/social.ts src/app/actions/messages.ts
# Expected: 3 lines (one per file)

# 4. Type check
npx tsc --noEmit && echo "PASS: tsc clean"

# 5. All tests
npm run test
# Expected: exit 0
```

All 5 checks must pass before Phase 3 is considered complete.
