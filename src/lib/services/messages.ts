import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

// Create a new conversation (DM or Group) or return existing DM
export async function createConversation(currentUserId: string, participantIds: string[], name?: string) {
    try {
        // If it's a DM (only 1 other person), check if one already exists
        if (participantIds.length === 1 && !name) {
            const otherUserId = participantIds[0]

            const existingConversations = await prisma.conversation.findMany({
                where: {
                    isGroup: false,
                    participants: {
                        every: {
                            userId: { in: [currentUserId, otherUserId] }
                        }
                    }
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: { id: true, username: true, fullName: true, avatarUrl: true }
                            }
                        }
                    }
                }
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
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, username: true, fullName: true, avatarUrl: true }
                        }
                    }
                }
            }
        })

        return { success: true, data: conversation }

    } catch (error) {
        console.error('Failed to create conversation:', error)
        return { success: false, error: 'Failed to create conversation' }
    }
}

// Send a message (with optional reply)
export async function sendMessage(conversationId: string, senderId: string, content: string, replyToId?: string) {
    try {
        const { allowed } = checkRateLimit(`msg:${senderId}`, 60, 60 * 60 * 1000)
        if (!allowed) {
            return { success: false, error: 'You are sending messages too quickly. Please slow down.' }
        }

        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId,
                content,
                replyToId
            },
            include: {
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        sender: { select: { username: true } }
                    }
                }
            }
        })

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        })

        // Update sender's lastReadAt so they don't see their own message as unread
        await prisma.conversationParticipant.update({
            where: {
                userId_conversationId: {
                    userId: senderId,
                    conversationId
                }
            },
            data: {
                lastReadAt: new Date(),
                isArchived: false // Also unarchive if it was archived
            }
        })

        return { success: true, data: message }
    } catch (error) {
        console.error('Failed to send message:', error)
        return { success: false, error: 'Failed to send message' }
    }
}

// Archive a conversation for a specific user
export async function archiveConversation(conversationId: string, userId: string) {
    try {
        await prisma.conversationParticipant.update({
            where: {
                userId_conversationId: {
                    userId,
                    conversationId
                }
            },
            data: { isArchived: true }
        })
        return { success: true }
    } catch {
        return { success: false, error: 'Failed to archive' }
    }
}

export async function getConversations(userId: string) {
    try {
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId: userId,
                        isArchived: false
                    }
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

export async function editMessage(messageId: string, userId: string, newContent: string) {
    try {
        const message = await prisma.message.findUnique({ where: { id: messageId } })
        if (!message || message.senderId !== userId) return { success: false, error: 'Unauthorized' }

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: { content: newContent },
        })

        return { success: true, data: updated }
    } catch {
        return { success: false, error: 'Failed to edit' }
    }
}

export async function deleteMessage(messageId: string, userId: string) {
    try {
        const message = await prisma.message.findUnique({ where: { id: messageId } })
        if (!message || message.senderId !== userId) return { success: false, error: 'Unauthorized' }

        // Soft delete
        await prisma.message.update({
            where: { id: messageId },
            data: {
                deletedAt: new Date(),
                content: 'This message was deleted'
            }
        })

        return { success: true }
    } catch {
        return { success: false, error: 'Failed to delete' }
    }
}

export async function reactToMessage(messageId: string, userId: string, emoji: string) {
    try {
        // Toggle logic: if exists, remove it. If not, add it.
        const existing = await prisma.reaction.findUnique({
            where: { userId_messageId_emoji: { userId, messageId, emoji } }
        })

        if (existing) {
            await prisma.reaction.delete({ where: { id: existing.id } })
        } else {
            await prisma.reaction.create({
                data: { userId, messageId, emoji }
            })
        }

        return { success: true }
    } catch {
        return { success: false, error: 'Failed to react' }
    }
}

export async function getMessages(conversationId: string, cursor?: string, limit = 30) {
    try {
        const messages = await prisma.message.findMany({
            where: { conversationId },
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: { id: true, username: true, fullName: true, avatarUrl: true }
                },
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        sender: { select: { username: true } }
                    }
                },
                reactions: {
                    include: {
                        user: { select: { id: true, username: true } }
                    }
                }
            },
        })

        const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null

        return {
            success: true,
            data: messages.reverse(),
            nextCursor,
        }
    } catch (error) {
        console.error('Failed to fetch messages:', error)
        return { success: false, data: [], nextCursor: null, error: 'Failed to fetch messages' }
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
    } catch {
        return { success: false }
    }
}

export async function getUnreadMessageCount(userId: string) {
    try {
        const participated = await prisma.conversationParticipant.findMany({
            where: { userId },
            include: { conversation: true }
        })

        const count = participated.filter(p => {
            return new Date(p.conversation.updatedAt) > new Date(p.lastReadAt)
        }).length

        return { success: true, count }
    } catch (error) {
        console.error('Failed to get unread message count:', error)
        return { success: false, count: 0 }
    }
}

export async function getOrCreateTripConversation(tripId: string, currentUserId: string) {
    try {
        // 1. Check if conversation already linked
        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            include: {
                conversation: true,
                participants: { select: { userId: true } }
            }
        })

        if (!trip) return { success: false, error: 'Trip not found' }

        if (trip.conversation) {
            return { success: true, conversationId: trip.conversation.id }
        }

        // 2. Create new conversation
        const allUserIds = new Set(trip.participants.map((p: { userId: string }) => p.userId))
        allUserIds.add(currentUserId) // Ensure current user is in

        const conversation = await prisma.conversation.create({
            data: {
                isGroup: true,
                name: `Trip: ${trip.name}`,
                tripId: trip.id,
                participants: {
                    create: Array.from(allUserIds).map(userId => ({ userId }))
                }
            }
        })

        return { success: true, conversationId: conversation.id }

    } catch (error) {
        console.error('Failed to get/create trip chat:', error)
        return { success: false, error: 'Failed to open trip chat.' }
    }
}

/**
 * Guard used by the API layer: a message can only be interacted with by
 * participants of its conversation.
 */
export async function canAccessMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { conversationId: true }
    })

    if (!message) return false
    return isConversationParticipant(message.conversationId, userId)
}

/**
 * Membership guard used by the API layer: only participants may read or
 * write a conversation.
 */
export async function isConversationParticipant(conversationId: string, userId: string) {
    const participant = await prisma.conversationParticipant.findUnique({
        where: {
            userId_conversationId: { userId, conversationId }
        },
        select: { userId: true }
    })

    return !!participant
}
