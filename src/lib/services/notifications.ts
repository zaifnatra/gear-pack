import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

export async function getNotifications(userId: string) {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        })
        return { success: true, data: notifications }
    } catch (error) {
        console.error('Failed to get notifications:', error)
        return { success: false, error: 'Failed to fetch notifications' }
    }
}

export async function getUnreadCount(userId: string) {
    try {
        const count = await prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        })
        return { success: true, count }
    } catch {
        return { success: false, count: 0 }
    }
}

export async function markAsRead(notificationId: string, userId?: string) {
    try {
        // When a userId is provided (API path), only the owner may mark it read
        const result = await prisma.notification.updateMany({
            where: { id: notificationId, ...(userId ? { userId } : {}) },
            data: { isRead: true }
        })

        if (result.count === 0) {
            return { success: false, error: 'Notification not found' }
        }

        return { success: true }
    } catch {
        return { success: false, error: 'Failed to mark as read' }
    }
}

export async function markAllAsRead(userId: string) {
    try {
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        })
        return { success: true }
    } catch {
        return { success: false, error: 'Failed to mark all as read' }
    }
}

export async function createNotification(
    userId: string,
    type: NotificationType,
    message: string,
    link?: string
) {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type,
                message,
                link
            }
        })
        return { success: true }
    } catch (error) {
        console.error('Failed to create notification:', error)
        return { success: false }
    }
}
