'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Create a new conversation (DM or Group) or return existing DM
export async function createConversation(currentUserId: string, participantIds: string[], name?: string) {
    try {
        // If it's a DM (only 1 other person), check if one already exists
        if (participantIds.length === 1 && !name) {
            const otherUserId = participantIds[0]

            // Find shared conversations between these two users
            // This is complex in Prisma, so we might check if they have a common conversation with exactly 2 participants
            // For MVP, we can just create a new one or simplistic check. 
            // Better approach: Query conversationParticipants

            const existingConversations = await prisma.conversation.findMany({
                where: {
                    isGroup: false,
                    participants: {
                        every: {
                            userId: { in: [currentUserId, otherUserId] }
                        }
                    }
                },
                include: { participants: true }
            })

            // Filter for exact match of 2 participants
            const exactMatch = existingConversations.find(c => c.participants.length === 2)

            if (exactMatch) {
                return { success: true, data: exactMatch }
            }
        }

        // Create new conversation
        const isGroup = participantIds.length > 1
        const conversation = await prisma.conversation.create({
            data: {
                isGroup,
                name: isGroup ? (name || 'Group Chat') : null,
                participants: {
                    create: [
                        { userId: currentUserId },
                        ...participantIds.map(id => ({ userId: id }))
                    ]
                }
            }
        })

        revalidatePath('/dashboard/messages')
        return { success: true, data: conversation }

    } catch (error) {
        console.error('Failed to create conversation:', error)
        return { success: false, error: 'Failed to create conversation' }
    }
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
    try {
        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId,
                content
            }
        })

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        })

        revalidatePath('/dashboard/messages')
        return { success: true, data: message }
    } catch (error) {
        console.error('Failed to send message:', error)
        return { success: false, error: 'Failed to send message' }
    }
}

export async function getConversations(userId: string) {
    try {
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId: userId }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, username: true, fullName: true, avatarUrl: true }
                        }
                    }
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })
        return { success: true, data: conversations }
    } catch (error) {
        console.error('Failed to get conversations:', error)
        return { success: false, error: 'Failed to fetch conversations' }
    }
}

export async function getMessages(conversationId: string) {
    try {
        const messages = await prisma.message.findMany({
            where: { conversationId },
            include: {
                sender: {
                    select: { id: true, username: true, fullName: true, avatarUrl: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        })
        return { success: true, data: messages }
    } catch (error) {
        console.error('Failed to fetch messages:', error)
        return { success: false, error: 'Failed to fetch messages' }
    }
}

export async function markAsRead(conversationId: string, userId: string) {
    try {
        // Find participant record
        await prisma.conversationParticipant.update({
            where: {
                userId_conversationId: {
                    userId,
                    conversationId
                }
            },
            data: {
                lastReadAt: new Date()
            }
        })
        return { success: true }
    } catch (error) {
        return { success: false }
    }
}
