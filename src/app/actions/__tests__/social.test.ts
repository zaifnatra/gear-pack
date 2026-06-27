import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  sendFriendRequest,
  respondToFriendRequest,
  cancelFriendRequest,
  searchUsers,
} from '@/app/actions/social'
import { cleanDatabase, createTestUser } from '@/test/db'

describe('social actions', () => {
  let alice: Awaited<ReturnType<typeof createTestUser>>
  let bob: Awaited<ReturnType<typeof createTestUser>>

  beforeEach(async () => {
    await cleanDatabase()
    alice = await createTestUser()
    bob = await createTestUser()
  })

  afterAll(async () => {
    await cleanDatabase()
  })

  describe('sendFriendRequest', () => {
    it('creates a PENDING friendship', async () => {
      const result = await sendFriendRequest(alice.id, bob.id)
      expect(result.success).toBe(true)

      const friendship = await prisma.friendship.findFirst({
        where: { userId: alice.id, friendId: bob.id },
      })
      expect(friendship?.status).toBe('PENDING')
    })

    it('blocks duplicate requests', async () => {
      await sendFriendRequest(alice.id, bob.id)
      const result = await sendFriendRequest(alice.id, bob.id)
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/already exists/i)
    })

    it('blocks reverse-duplicate requests', async () => {
      await sendFriendRequest(alice.id, bob.id)
      const result = await sendFriendRequest(bob.id, alice.id)
      expect(result.success).toBe(false)
    })
  })

  describe('respondToFriendRequest', () => {
    it('sets status to ACCEPTED', async () => {
      await sendFriendRequest(alice.id, bob.id)
      const request = await prisma.friendship.findFirst({
        where: { userId: alice.id, friendId: bob.id },
      })

      const result = await respondToFriendRequest(request!.id, 'ACCEPTED')
      expect(result.success).toBe(true)

      const updated = await prisma.friendship.findUnique({ where: { id: request!.id } })
      expect(updated?.status).toBe('ACCEPTED')
    })

    it('deletes the record on DECLINED', async () => {
      await sendFriendRequest(alice.id, bob.id)
      const request = await prisma.friendship.findFirst({
        where: { userId: alice.id, friendId: bob.id },
      })

      await respondToFriendRequest(request!.id, 'DECLINED')
      const check = await prisma.friendship.findUnique({ where: { id: request!.id } })
      expect(check).toBeNull()
    })
  })

  describe('cancelFriendRequest', () => {
    it('allows sender to cancel', async () => {
      await sendFriendRequest(alice.id, bob.id)
      const request = await prisma.friendship.findFirst({
        where: { userId: alice.id, friendId: bob.id },
      })

      const result = await cancelFriendRequest(request!.id, alice.id)
      expect(result.success).toBe(true)
    })

    it('blocks non-sender from cancelling', async () => {
      await sendFriendRequest(alice.id, bob.id)
      const request = await prisma.friendship.findFirst({
        where: { userId: alice.id, friendId: bob.id },
      })

      const result = await cancelFriendRequest(request!.id, bob.id)
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/unauthorized/i)
    })
  })

  describe('searchUsers', () => {
    it('returns empty array for queries shorter than 2 chars', async () => {
      const result = await searchUsers('a', alice.id)
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })

    it('excludes the searching user from results', async () => {
      const result = await searchUsers('testuser', alice.id)
      expect(result.success).toBe(true)
      const ids = result.data?.map(u => u.id) ?? []
      expect(ids).not.toContain(alice.id)
    })
  })
})
