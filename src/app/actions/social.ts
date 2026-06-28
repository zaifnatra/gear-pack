'use server'

import { prisma } from '@/lib/prisma'
import { FriendshipStatus, NotificationType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'
import { checkRateLimit } from '@/lib/rate-limit'

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

export async function sendFriendRequest(senderId: string, receiverId: string) {
    try {
        const { allowed } = checkRateLimit(`friend:${senderId}`, 20, 60 * 60 * 1000)
        if (!allowed) {
            return { success: false, error: 'You have sent too many friend requests recently. Please wait before sending more.' }
        }

        // Check if exists
        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: senderId, friendId: receiverId },
                    { userId: receiverId, friendId: senderId }
                ]
            }
        })

        if (existing) {
            return { success: false, error: 'Friendship or request already exists' }
        }

        await prisma.friendship.create({
            data: {
                userId: senderId,
                friendId: receiverId,
                status: 'PENDING'
            }
        })

        await createNotification(
            receiverId,
            NotificationType.FRIEND_REQUEST,
            `You have a new friend request!`,
            '/dashboard/social'
        )

        revalidatePath('/dashboard/social')
        return { success: true }
    } catch (error) {
        console.error('Send request error:', error)
        return { success: false, error: 'Failed to send request' }
    }
}

export async function respondToFriendRequest(requestId: string, status: 'ACCEPTED' | 'DECLINED') {
    try {
        if (status === 'DECLINED') {
            await prisma.friendship.delete({
                where: { id: requestId }
            })
        } else {
            const updated = await prisma.friendship.update({
                where: { id: requestId },
                data: { status: 'ACCEPTED' },
                include: { friend: true, user: true } // friend is receiver (current user), user is sender (requester)
            })

            // Notify the requester (updated.userId) that the receiver (updated.friend.username) accepted
            await createNotification(
                updated.userId,
                NotificationType.SYSTEM,
                `${updated.friend.fullName || updated.friend.username} accepted your friend request`,
                `/dashboard/social/${updated.friendId}/closet`
            )
        }

        revalidatePath('/dashboard/social')
        return { success: true }
    } catch (error) {
        console.error('Respond request error:', error)
        return { success: false, error: 'Failed to respond to request' }
    }
}

export async function getFriends(userId: string) {
    try {
        const friendships = await prisma.friendship.findMany({
            where: {
                AND: [
                    { status: 'ACCEPTED' },
                    {
                        OR: [
                            { userId: userId },
                            { friendId: userId }
                        ]
                    }
                ]
            },
            include: {
                user: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
                friend: { select: { id: true, username: true, fullName: true, avatarUrl: true } }
            }
        })

        // Map to just the OTHER user
        const friends = friendships.map(f => f.userId === userId ? f.friend : f.user)

        return { success: true, data: friends }
    } catch (error) {
        console.error('Get friends error:', error)
        return { success: false, error: 'Failed to get friends' }
    }
}

export async function getPendingRequests(userId: string) {
    try {
        // Requests sent TO the user (where user is friendId)
        const requests = await prisma.friendship.findMany({
            where: {
                friendId: userId,
                status: 'PENDING'
            },
            include: {
                user: { select: { id: true, username: true, fullName: true, avatarUrl: true } } // The SENDER
            }
        })

        return { success: true, data: requests }
    } catch (error) {
        console.error('Get requests error:', error)
        return { success: false, error: 'Failed to get requests' }
    }
}

export async function getSentRequests(userId: string) {
    try {
        // Requests sent BY the user (where user is userId)
        const requests = await prisma.friendship.findMany({
            where: {
                userId: userId,
                status: 'PENDING'
            },
            include: {
                friend: { select: { id: true, username: true, fullName: true, avatarUrl: true } } // The RECEIVER
            }
        })

        return { success: true, data: requests }
    } catch (error) {
        console.error('Get sent requests error:', error)
        return { success: false, error: 'Failed to get sent requests' }
    }
}

export async function cancelFriendRequest(requestId: string, userId: string) {
    try {
        // Verify ownership (the user cancelling must be the one who sent it)
        const request = await prisma.friendship.findUnique({
            where: { id: requestId }
        })

        if (!request || request.userId !== userId) {
            return { success: false, error: 'Unauthorized' }
        }

        await prisma.friendship.delete({
            where: { id: requestId }
        })

        revalidatePath('/dashboard/social')
        return { success: true }
    } catch (error) {
        console.error('Cancel request error:', error)
        return { success: false, error: 'Failed to cancel request' }
    }
}
