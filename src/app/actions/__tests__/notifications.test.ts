import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '@/app/actions/notifications'
import { cleanDatabase, createTestUser } from '@/test/db'

describe('notifications actions', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>

  beforeEach(async () => {
    await cleanDatabase()
    user = await createTestUser()
  })

  afterAll(async () => {
    await cleanDatabase()
  })

  it('creates a notification for the user', async () => {
    const result = await createNotification(user.id, 'SYSTEM', 'Welcome to gear-pack!', '/dashboard')
    expect(result.success).toBe(true)

    const notifications = await prisma.notification.findMany({ where: { userId: user.id } })
    expect(notifications).toHaveLength(1)
    expect(notifications[0].message).toBe('Welcome to gear-pack!')
    expect(notifications[0].isRead).toBe(false)
  })

  it('markAsRead sets isRead to true', async () => {
    await createNotification(user.id, 'SYSTEM', 'Test notification')
    const notification = await prisma.notification.findFirst({ where: { userId: user.id } })

    const result = await markAsRead(notification!.id)
    expect(result.success).toBe(true)

    const updated = await prisma.notification.findUnique({ where: { id: notification!.id } })
    expect(updated?.isRead).toBe(true)
  })

  it('markAllAsRead marks every unread notification as read', async () => {
    await createNotification(user.id, 'SYSTEM', 'First')
    await createNotification(user.id, 'SYSTEM', 'Second')

    const countBefore = await getUnreadCount(user.id)
    expect(countBefore.count).toBe(2)

    await markAllAsRead(user.id)

    const countAfter = await getUnreadCount(user.id)
    expect(countAfter.count).toBe(0)
  })

  it('getNotifications returns notifications ordered by newest first', async () => {
    await createNotification(user.id, 'SYSTEM', 'First')
    await createNotification(user.id, 'FRIEND_REQUEST', 'Second')

    const result = await getNotifications(user.id)
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(2)
    expect(result.data![0].message).toBe('Second')
  })
})
