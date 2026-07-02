'use server'

import * as messagesService from '@/lib/services/messages'
import { revalidatePath } from 'next/cache'

// Create a new conversation (DM or Group) or return existing DM
export async function createConversation(currentUserId: string, participantIds: string[], name?: string) {
    const result = await messagesService.createConversation(currentUserId, participantIds, name)
    if (result.success) revalidatePath('/dashboard/messages')
    return result
}

// Send a message (with optional reply)
export async function sendMessage(conversationId: string, senderId: string, content: string, replyToId?: string) {
    const result = await messagesService.sendMessage(conversationId, senderId, content, replyToId)
    if (result.success) revalidatePath('/dashboard/messages')
    return result
}

// Archive a conversation for a specific user
export async function archiveConversation(conversationId: string, userId: string) {
    const result = await messagesService.archiveConversation(conversationId, userId)
    if (result.success) revalidatePath('/dashboard/messages')
    return result
}

export async function getConversations(userId: string) {
    return messagesService.getConversations(userId)
}

export async function editMessage(messageId: string, userId: string, newContent: string) {
    const result = await messagesService.editMessage(messageId, userId, newContent)
    if (result.success) revalidatePath('/dashboard/messages')
    return result
}

export async function deleteMessage(messageId: string, userId: string) {
    const result = await messagesService.deleteMessage(messageId, userId)
    if (result.success) revalidatePath('/dashboard/messages')
    return result
}

export async function reactToMessage(messageId: string, userId: string, emoji: string) {
    const result = await messagesService.reactToMessage(messageId, userId, emoji)
    if (result.success) revalidatePath('/dashboard/messages')
    return result
}

export async function getMessages(conversationId: string, cursor?: string, limit = 30) {
    return messagesService.getMessages(conversationId, cursor, limit)
}

export async function markAsRead(conversationId: string, userId: string) {
    return messagesService.markAsRead(conversationId, userId)
}

export async function getUnreadMessageCount(userId: string) {
    return messagesService.getUnreadMessageCount(userId)
}

export async function getOrCreateTripConversation(tripId: string, currentUserId: string) {
    const result = await messagesService.getOrCreateTripConversation(tripId, currentUserId)
    if (result.success) revalidatePath(`/dashboard/trips/${tripId}`)
    return result
}
