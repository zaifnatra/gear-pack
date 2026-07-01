// src/app/actions/ai-chat/send.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { sendAIMessage as sendAIMessageService } from '@/lib/services/aiChat'
import type { ChatResponse } from '@/lib/ai/chat/types'

export async function sendAIMessage(userMessage: string): Promise<ChatResponse> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const result = await sendAIMessageService(user.id, userMessage)

    if (result.status === 'not_paid') {
        return {
            role: 'assistant',
            isJSON: false,
            message: "PackBot is a paid feature. Upgrade your plan to chat with PackBot about trails, trips, and gear.",
        }
    }

    return result.response
}
