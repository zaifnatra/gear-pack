import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import type { User } from '@supabase/supabase-js'

// The bearer-token check talks to Supabase; tests control it directly.
vi.mock('@/lib/supabase/api', () => ({
    getApiUser: vi.fn(),
    getBearerToken: vi.fn(),
}))

import { getApiUser } from '@/lib/supabase/api'
import { prisma } from '@/lib/prisma'
import { cleanDatabase, createTestUser, createTestCategory } from '@/test/db'

import { GET as listGear, POST as createGear } from '@/app/api/v1/gear/route'
import { PATCH as updateGear } from '@/app/api/v1/gear/[id]/route'
import { GET as getMe } from '@/app/api/v1/me/route'
import { DELETE as deleteAccountRoute } from '@/app/api/v1/account/route'
import { POST as syncRoute } from '@/app/api/v1/auth/sync/route'
import { POST as createTripRoute, GET as listTrips } from '@/app/api/v1/trips/route'
import { POST as addTripGear } from '@/app/api/v1/trips/[id]/gear/route'
import { PATCH as toggleTripGear } from '@/app/api/v1/trip-gear/[id]/route'
import { POST as sendFriendRequestRoute } from '@/app/api/v1/friends/requests/route'
import { POST as respondFriendRequest } from '@/app/api/v1/friends/requests/[id]/respond/route'
import { GET as friendCloset } from '@/app/api/v1/users/[id]/gear/route'
import { POST as createConversationRoute } from '@/app/api/v1/conversations/route'
import { GET as getConversationMessages, POST as postConversationMessage } from '@/app/api/v1/conversations/[id]/messages/route'
import { POST as markNotificationRead } from '@/app/api/v1/notifications/[id]/read/route'
import { POST as createReportRoute } from '@/app/api/v1/reports/route'
import { POST as blockUserRoute, DELETE as unblockUserRoute } from '@/app/api/v1/users/[id]/block/route'

function authAs(user: { id: string; email?: string }, metadata: Record<string, unknown> = {}) {
    vi.mocked(getApiUser).mockResolvedValue({
        user: {
            id: user.id,
            email: user.email ?? `${user.id}@example.com`,
            user_metadata: metadata,
        } as unknown as User,
        accessToken: 'test-token',
    })
}

function noAuth() {
    vi.mocked(getApiUser).mockResolvedValue(null)
}

function jsonRequest(method: string, body?: unknown) {
    return new Request('http://localhost/api/v1/test', {
        method,
        headers: { 'content-type': 'application/json' },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
}

function params(id: string) {
    return { params: Promise.resolve({ id }) }
}

describe('API v1 routes', () => {
    let user: Awaited<ReturnType<typeof createTestUser>>
    let otherUser: Awaited<ReturnType<typeof createTestUser>>
    let category: Awaited<ReturnType<typeof createTestCategory>>

    beforeEach(async () => {
        await cleanDatabase()
        user = await createTestUser()
        otherUser = await createTestUser()
        category = await createTestCategory()
    })

    afterAll(async () => {
        await cleanDatabase()
    })

    describe('auth guard', () => {
        it('returns 401 without a valid bearer token', async () => {
            noAuth()
            const res = await listGear(jsonRequest('GET'))
            expect(res.status).toBe(401)
        })
    })

    describe('gear', () => {
        it('creates and lists gear for the authenticated user only', async () => {
            authAs(user)
            const createRes = await createGear(jsonRequest('POST', {
                name: 'Tent',
                categoryId: category.id,
                weightGrams: 1200,
            }))
            expect(createRes.status).toBe(200)
            const created = await createRes.json()
            expect(created.success).toBe(true)
            expect(created.data.userId).toBe(user.id)

            authAs(otherUser)
            const listRes = await listGear(jsonRequest('GET'))
            const list = await listRes.json()
            expect(list.data).toHaveLength(0)
        })

        it('rejects invalid bodies with 400 and details', async () => {
            authAs(user)
            const res = await createGear(jsonRequest('POST', { name: '' }))
            expect(res.status).toBe(400)
            const body = await res.json()
            expect(body.success).toBe(false)
            expect(body.details?.length).toBeGreaterThan(0)
        })

        it("returns 403 when updating another user's gear", async () => {
            const item = await prisma.gearItem.create({
                data: { userId: otherUser.id, categoryId: category.id, name: 'Their Tent' }
            })

            authAs(user)
            const res = await updateGear(jsonRequest('PATCH', {
                name: 'Hijacked',
                categoryId: category.id,
            }), params(item.id))
            expect(res.status).toBe(403)
        })
    })

    describe('me + account', () => {
        it('returns the profile including isPaid', async () => {
            authAs(user)
            const res = await getMe(jsonRequest('GET'))
            const body = await res.json()
            expect(body.data.id).toBe(user.id)
            expect(body.data.isPaid).toBe(false)
        })

        it('deletes all application data on account deletion', async () => {
            authAs(user)
            const res = await deleteAccountRoute(jsonRequest('DELETE'))
            expect(res.status).toBe(200)

            const gone = await prisma.user.findUnique({ where: { id: user.id } })
            expect(gone).toBeNull()
        })
    })

    describe('auth/sync', () => {
        it('provisions a Prisma row for a first-time OAuth user and is idempotent', async () => {
            const authUserId = `sync-${Date.now()}`
            authAs({ id: authUserId, email: 'oauth@example.com' }, { full_name: 'OAuth User' })

            const first = await syncRoute(jsonRequest('POST', {}))
            expect(first.status).toBe(200)
            const firstBody = await first.json()
            expect(firstBody.created).toBe(true)
            expect(firstBody.data.email).toBe('oauth@example.com')

            const second = await syncRoute(jsonRequest('POST', {}))
            const secondBody = await second.json()
            expect(secondBody.created).toBe(false)

            const rows = await prisma.user.count({ where: { id: authUserId } })
            expect(rows).toBe(1)
        })

        it('tolerates missing metadata (Sign in with Apple)', async () => {
            const authUserId = `apple-${Date.now()}`
            authAs({ id: authUserId, email: 'relay@privaterelay.appleid.com' })

            const res = await syncRoute(jsonRequest('POST', {}))
            expect(res.status).toBe(200)
            const body = await res.json()
            expect(body.data.username).toMatch(/^relay/)
        })

        it('returns 409 when the requested username is taken', async () => {
            await createTestUser({ username: 'takenname' })
            authAs({ id: `new-${Date.now()}`, email: 'new@example.com' })

            const res = await syncRoute(jsonRequest('POST', { username: 'takenname' }))
            expect(res.status).toBe(409)
        })
    })

    describe('trips + trip gear guards', () => {
        async function createTripAs(actor: { id: string }) {
            authAs(actor)
            const res = await createTripRoute(jsonRequest('POST', {
                name: 'Alps Weekend',
                startDate: '2026-08-01',
                type: 'OVERNIGHT',
                difficulty: 'MODERATE',
            }))
            const body = await res.json()
            expect(body.success).toBe(true)
            return body.data as { id: string }
        }

        it('creates a trip and lists it for participants', async () => {
            const trip = await createTripAs(user)

            const listRes = await listTrips(jsonRequest('GET'))
            const list = await listRes.json()
            expect(list.data.map((t: { id: string }) => t.id)).toContain(trip.id)
        })

        it('blocks non-participants from adding trip gear', async () => {
            const trip = await createTripAs(user)
            const item = await prisma.gearItem.create({
                data: { userId: otherUser.id, categoryId: category.id, name: 'Stove' }
            })

            authAs(otherUser)
            const res = await addTripGear(jsonRequest('POST', { gearId: item.id }), params(trip.id))
            expect(res.status).toBe(403)
        })

        it('lets participants add gear and toggle packed', async () => {
            const trip = await createTripAs(user)
            const item = await prisma.gearItem.create({
                data: { userId: user.id, categoryId: category.id, name: 'Stove' }
            })

            authAs(user)
            const addRes = await addTripGear(jsonRequest('POST', { gearId: item.id }), params(trip.id))
            expect(addRes.status).toBe(200)
            const added = await addRes.json()

            const toggleRes = await toggleTripGear(jsonRequest('PATCH', { isPacked: true }), params(added.data.id))
            expect(toggleRes.status).toBe(200)

            const row = await prisma.tripGear.findUnique({ where: { id: added.data.id } })
            expect(row?.isPacked).toBe(true)
        })
    })

    describe('friends', () => {
        it('only the recipient can respond to a friend request', async () => {
            authAs(user)
            const sendRes = await sendFriendRequestRoute(jsonRequest('POST', { receiverId: otherUser.id }))
            expect(sendRes.status).toBe(200)

            const request = await prisma.friendship.findFirstOrThrow({
                where: { userId: user.id, friendId: otherUser.id }
            })

            // The sender must not be able to accept their own request
            const asSender = await respondFriendRequest(jsonRequest('POST', { status: 'ACCEPTED' }), params(request.id))
            expect(asSender.status).toBe(403)

            authAs(otherUser)
            const asRecipient = await respondFriendRequest(jsonRequest('POST', { status: 'ACCEPTED' }), params(request.id))
            expect(asRecipient.status).toBe(200)

            const updated = await prisma.friendship.findUnique({ where: { id: request.id } })
            expect(updated?.status).toBe('ACCEPTED')
        })

        it('rejects sending a friend request to yourself', async () => {
            authAs(user)
            const res = await sendFriendRequestRoute(jsonRequest('POST', { receiverId: user.id }))
            expect(res.status).toBe(400)
        })
    })

    describe('friend closet gate', () => {
        it('blocks non-friends and allows accepted friends', async () => {
            await prisma.gearItem.create({
                data: { userId: otherUser.id, categoryId: category.id, name: 'Their Pack' }
            })

            authAs(user)
            const blocked = await friendCloset(jsonRequest('GET'), params(otherUser.id))
            expect(blocked.status).toBe(403)

            await prisma.friendship.create({
                data: { userId: user.id, friendId: otherUser.id, status: 'ACCEPTED' }
            })

            const allowed = await friendCloset(jsonRequest('GET'), params(otherUser.id))
            expect(allowed.status).toBe(200)
            const body = await allowed.json()
            expect(body.data).toHaveLength(1)
        })
    })

    describe('conversations membership guard', () => {
        it('blocks non-participants from reading or posting messages', async () => {
            authAs(otherUser)
            const convRes = await createConversationRoute(jsonRequest('POST', { participantIds: [user.id] }))
            const conv = await convRes.json()
            const conversationId = conv.data.id as string

            const third = await createTestUser()
            authAs(third)
            const readRes = await getConversationMessages(jsonRequest('GET'), params(conversationId))
            expect(readRes.status).toBe(403)
            const postRes = await postConversationMessage(jsonRequest('POST', { content: 'hi' }), params(conversationId))
            expect(postRes.status).toBe(403)

            authAs(user)
            const okPost = await postConversationMessage(jsonRequest('POST', { content: 'hello!' }), params(conversationId))
            expect(okPost.status).toBe(200)
            const okRead = await getConversationMessages(jsonRequest('GET'), params(conversationId))
            const messages = await okRead.json()
            expect(messages.data).toHaveLength(1)
            expect(messages.data[0].content).toBe('hello!')
        })
    })

    describe('moderation', () => {
        it('records a content report', async () => {
            authAs(user)
            const res = await createReportRoute(jsonRequest('POST', {
                targetType: 'MESSAGE',
                targetId: 'some-message-id',
                reason: 'Spam content',
            }))
            expect(res.status).toBe(200)

            const report = await prisma.report.findFirstOrThrow({ where: { reporterId: user.id } })
            expect(report.targetType).toBe('MESSAGE')
            expect(report.status).toBe('OPEN')
        })

        it('blocking replaces the friendship and removes friend access; unblocking clears it', async () => {
            await prisma.friendship.create({
                data: { userId: user.id, friendId: otherUser.id, status: 'ACCEPTED' }
            })

            authAs(user)
            const blockRes = await blockUserRoute(jsonRequest('POST'), params(otherUser.id))
            expect(blockRes.status).toBe(200)

            const edges = await prisma.friendship.findMany({
                where: {
                    OR: [
                        { userId: user.id, friendId: otherUser.id },
                        { userId: otherUser.id, friendId: user.id }
                    ]
                }
            })
            expect(edges).toHaveLength(1)
            expect(edges[0].status).toBe('BLOCKED')

            // Blocked user can no longer view the closet
            authAs(otherUser)
            const closet = await friendCloset(jsonRequest('GET'), params(user.id))
            expect(closet.status).toBe(403)

            authAs(user)
            const unblockRes = await unblockUserRoute(jsonRequest('DELETE'), params(otherUser.id))
            expect(unblockRes.status).toBe(200)
            const remaining = await prisma.friendship.count({
                where: { userId: user.id, friendId: otherUser.id }
            })
            expect(remaining).toBe(0)
        })

        it('cannot block yourself', async () => {
            authAs(user)
            const res = await blockUserRoute(jsonRequest('POST'), params(user.id))
            expect(res.status).toBe(400)
        })
    })

    describe('notifications scoping', () => {
        it("cannot mark another user's notification as read", async () => {
            const notification = await prisma.notification.create({
                data: { userId: otherUser.id, type: 'SYSTEM', message: 'hi' }
            })

            authAs(user)
            const res = await markNotificationRead(jsonRequest('POST'), params(notification.id))
            expect(res.status).toBe(404)

            const row = await prisma.notification.findUnique({ where: { id: notification.id } })
            expect(row?.isRead).toBe(false)
        })
    })
})
