import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  getGearItems,
  createGearItem,
  updateGearItem,
  deleteGearItem,
} from '@/app/actions/gear'
import { cleanDatabase, createTestUser, createTestCategory } from '@/test/db'

describe('gear actions', () => {
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

  describe('createGearItem', () => {
    it('creates a gear item and returns it with success', async () => {
      const result = await createGearItem(user.id, {
        name: 'Big Agnes Copper Spur HV UL2',
        categoryId: category.id,
        weightGrams: 1060,
      })
      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('Big Agnes Copper Spur HV UL2')
      expect(result.data?.userId).toBe(user.id)
    })

    it('rejects a negative weight value', async () => {
      const result = await createGearItem(user.id, {
        name: 'Invalid Item',
        categoryId: category.id,
        weightGrams: -5,
      })
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/negative/i)
    })

    it('creates item with zero weight successfully', async () => {
      const result = await createGearItem(user.id, {
        name: 'Weightless Item',
        categoryId: category.id,
        weightGrams: 0,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('getGearItems', () => {
    it("returns only the requesting user's gear", async () => {
      await createGearItem(user.id, { name: 'My Tent', categoryId: category.id })
      await createGearItem(otherUser.id, { name: 'Their Tent', categoryId: category.id })

      const result = await getGearItems(user.id)
      expect(result.success).toBe(true)
      expect(result.data?.every(item => item.userId === user.id)).toBe(true)
      expect(result.data?.find(item => item.name === 'Their Tent')).toBeUndefined()
    })
  })

  describe('updateGearItem', () => {
    it('updates own gear item', async () => {
      const created = await prisma.gearItem.create({
        data: { name: 'Old Name', userId: user.id, categoryId: category.id },
      })
      const result = await updateGearItem(created.id, user.id, {
        name: 'New Name',
        categoryId: category.id,
      })
      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('New Name')
    })

    it('blocks a non-owner from updating', async () => {
      const created = await prisma.gearItem.create({
        data: { name: 'My Tent', userId: user.id, categoryId: category.id },
      })
      const result = await updateGearItem(created.id, otherUser.id, {
        name: 'Hijacked Name',
        categoryId: category.id,
      })
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/unauthorized/i)
    })

    it('rejects negative weight on update', async () => {
      const created = await prisma.gearItem.create({
        data: { name: 'My Tent', userId: user.id, categoryId: category.id },
      })
      const result = await updateGearItem(created.id, user.id, {
        name: 'My Tent',
        categoryId: category.id,
        weightGrams: -100,
      })
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/negative/i)
    })
  })

  describe('deleteGearItem', () => {
    it('deletes own gear item', async () => {
      const created = await prisma.gearItem.create({
        data: { name: 'To Delete', userId: user.id, categoryId: category.id },
      })
      const result = await deleteGearItem(created.id, user.id)
      expect(result.success).toBe(true)

      const check = await prisma.gearItem.findUnique({ where: { id: created.id } })
      expect(check).toBeNull()
    })

    it('blocks a non-owner from deleting', async () => {
      const created = await prisma.gearItem.create({
        data: { name: 'Protected Item', userId: user.id, categoryId: category.id },
      })
      const result = await deleteGearItem(created.id, otherUser.id)
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/unauthorized/i)
    })
  })
})
