'use server'

import * as notificationsService from '@/lib/services/notifications'
import { revalidatePath } from 'next/cache'
import { NotificationType } from '@prisma/client'

export async function getNotifications(userId: string) {
    return notificationsService.getNotifications(userId)
}

export async function getUnreadCount(userId: string) {
    return notificationsService.getUnreadCount(userId)
}

export async function markAsRead(notificationId: string) {
    const result = await notificationsService.markAsRead(notificationId)
    if (result.success) revalidatePath('/dashboard')
    return result
}

export async function markAllAsRead(userId: string) {
    const result = await notificationsService.markAllAsRead(userId)
    if (result.success) revalidatePath('/dashboard')
    return result
}

// Internal helper to be used by other actions
export async function createNotification(
    userId: string,
    type: NotificationType,
    message: string,
    link?: string
) {
    const result = await notificationsService.createNotification(userId, type, message, link)
    revalidatePath('/dashboard') // Trigger update if possible, though mostly client polling
    return result
}
