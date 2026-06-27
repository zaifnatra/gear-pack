// src/app/actions/ai-chat/history.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getThreadHistory } from '@/lib/backboard'
import type { BackboardMessage, ChatResponse } from './types'

function isToolOutputMessage(msg: BackboardMessage): boolean {
    if (msg.role !== 'user' && msg.role !== 'assistant') return true

    const content = typeof msg.content === 'string' ? msg.content : ''
    const trimmed = content.trim()

    if (trimmed.includes('"tool_call_id"') || trimmed.includes('"success":true')) return true

    if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
        // Keep structured UI cards
        if (
            trimmed.includes('"type": "trail_options"') ||
            trimmed.includes('"type": "gear_analysis"') ||
            trimmed.includes('"type":"trail_options"')
        ) {
            return false
        }
        return true
    }

    return false
}

function mapToUIFormat(msg: BackboardMessage): ChatResponse {
    let content = Array.isArray(msg.content)
        ? msg.content.map((c) => c.text?.value ?? '').join('\n')
        : (msg.content as string) ?? ''

    content = content.replace(/^\[Current Context:.*?\]\s*/, '')

    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
    let structuredData: Record<string, unknown> | null = null

    if (jsonMatch) {
        try { structuredData = JSON.parse(jsonMatch[1]) } catch { }
    }

    return {
        role: msg.role,
        message: (structuredData?.message as string) ?? content,
        isJSON: !!structuredData,
        data: structuredData ?? undefined,
        quickActions: (structuredData?.quick_actions as Array<{ label: string; value: string }>) ?? []
    }
}

export async function getChatHistory(): Promise<ChatResponse[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    const threadId = dbUser?.backboardThreadId

    if (!threadId) return []

    const messages = await getThreadHistory(threadId) as BackboardMessage[]

    return messages
        .filter((msg) => !isToolOutputMessage(msg))
        .map(mapToUIFormat)
}
