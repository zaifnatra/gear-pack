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

        revalidatePath('/dashboard/messages')
        return { success: true, data: conversation }

    } catch (error) {
        console.error('Failed to create conversation:', error)
        return { success: false, error: 'Failed to create conversation' }
    }
}

// Send a message (with optional reply)
export async function sendMessage(conversationId: string, senderId: string, content: string, replyToId?: string) {
    try {
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

        revalidatePath('/dashboard/messages')
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
        revalidatePath('/dashboard/messages')
        return { success: true }
    } catch (error) {
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

        revalidatePath('/dashboard/messages')
        return { success: true, data: updated }
    } catch (error) {
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

        revalidatePath('/dashboard/messages')
        return { success: true }
    } catch (error) {
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

        revalidatePath('/dashboard/messages')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to react' }
    }
}

export async function getMessages(conversationId: string) {
    try {
        const messages = await prisma.message.findMany({
            where: { conversationId },
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

export async function getUnreadMessageCount(userId: string) {
    try {
        // Query users where there are unread messages in conversations they handle
        // Prisma doesn't support comparing two columns directly in the `where` clause easily for this specific case
        // without raw query or separate check.
        // HOWEVER: We can't easily do "lastReadAt < conversation.updatedAt" in standard Prisma where clause without field references feature (which might be experimental or limited).

        // Alternative efficient approach: 
        // Get all participant records for user, filter in memory? No that's bad for perf.
        // Use raw query or simply: 
        // Actually, we can fetch all conversations this user is in, and check.
        // 
        // Let's try the safest Prisma approach:
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
                    create: Array.from(allUserIds).map(userId => ({ userId })) as any
                }
            }
        })

        revalidatePath(`/dashboard/trips/${tripId}`)
        return { success: true, conversationId: conversation.id }

    } catch (error) {
        console.error('Failed to get/create trip chat:', error)
        return { success: false, error: 'Failed' }
    }
}
