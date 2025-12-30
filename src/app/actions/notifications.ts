'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
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
    } catch (error) {
        return { success: false, count: 0 }
    }
}

export async function markAsRead(notificationId: string) {
    try {
        await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        })
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to mark as read' }
    }
}

export async function markAllAsRead(userId: string) {
    try {
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        })
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to mark all as read' }
    }
}

// Internal helper to be used by other actions
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
        revalidatePath('/dashboard') // Trigger update if possible, though mostly client polling
        return { success: true }
    } catch (error) {
        console.error('Failed to create notification:', error)
        return { success: false }
    }
}
