'use server'

import * as socialService from '@/lib/services/social'
import { revalidatePath } from 'next/cache'

export async function searchUsers(query: string, currentUserId: string) {
    return socialService.searchUsers(query, currentUserId)
}

export async function sendFriendRequest(senderId: string, receiverId: string) {
    const result = await socialService.sendFriendRequest(senderId, receiverId)
    if (result.success) {
        revalidatePath('/dashboard') // notification badge
        revalidatePath('/dashboard/social')
    }
    return result
}

export async function respondToFriendRequest(requestId: string, status: 'ACCEPTED' | 'DECLINED') {
    const result = await socialService.respondToFriendRequest(requestId, status)
    if (result.success) {
        revalidatePath('/dashboard') // notification badge
        revalidatePath('/dashboard/social')
    }
    return result
}

export async function getFriends(userId: string) {
    return socialService.getFriends(userId)
}

export async function getPendingRequests(userId: string) {
    return socialService.getPendingRequests(userId)
}

export async function getSentRequests(userId: string) {
    return socialService.getSentRequests(userId)
}

export async function cancelFriendRequest(requestId: string, userId: string) {
    const result = await socialService.cancelFriendRequest(requestId, userId)
    if (result.success) revalidatePath('/dashboard/social')
    return result
}
