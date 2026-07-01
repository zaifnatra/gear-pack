// src/app/actions/ai-chat/history.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { getChatHistory as getChatHistoryService } from '@/lib/services/aiChat'
import type { ChatResponse } from '@/lib/ai/chat/types'

export async function getChatHistory(): Promise<ChatResponse[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    return getChatHistoryService(user.id)
}
