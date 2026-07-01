import { prisma } from '@/lib/prisma'
import { addMessage, createThread, getLatestResponse, getThreadHistory } from '@/lib/backboard'
import {
    applyPreferenceUpdates,
    buildSingleChoiceQuestion,
    extractPreferenceUpdatesFromMessage,
    isAdviceRequestThatDependsOnPreferences,
    isGearTripTrailTopic,
    normalizePreferenceStore,
    pickHighImpactMissingPreference
} from '@/lib/ai/preferences'
import { pollRun } from '@/lib/ai/chat/polling'
import { isClearlyOutOfScope, buildOutOfScopeResponse } from '@/lib/ai/chat/scope'
import type { BackboardMessage, BackboardRun, ChatResponse } from '@/lib/ai/chat/types'

/**
 * PackBot core, shared by the web server action and POST /api/v1/ai/chat.
 * The paid gate is signalled with a status so each surface can phrase it
 * itself: the web shows its upsell copy, the API returns a neutral 403
 * (App Store guideline 3.1.1 — no external-purchase prompts in the app).
 */
export type SendAIMessageResult =
    | { status: 'not_paid' }
    | { status: 'ok'; response: ChatResponse }

export async function sendAIMessage(userId: string, userMessage: string): Promise<SendAIMessageResult> {
    // 1. Get or create Backboard thread
    const dbUser = await prisma.user.findUnique({ where: { id: userId } })

    if (!dbUser?.isPaid) {
        return { status: 'not_paid' }
    }

    let threadId = dbUser?.backboardThreadId ?? null

    if (!threadId) {
        threadId = await createThread()
        if (!threadId) throw new Error("Failed to create AI thread")

        await prisma.user.update({
            where: { id: userId },
            data: { backboardThreadId: threadId }
        })
    }

    // 2. Load and normalize preferences, increment turn
    const timestamp = new Date().toISOString()
    const { store: prefStoreInitial } = normalizePreferenceStore(dbUser?.preferences, timestamp)
    let prefStore = prefStoreInitial

    if (prefStore.question_state?.thread_id !== threadId) {
        prefStore.question_state = { thread_id: threadId, user_turn: 0, last_question_turn: -9999, asked_keys: [] }
    }

    prefStore.question_state = prefStore.question_state ?? { thread_id: threadId, user_turn: 0, last_question_turn: -9999, asked_keys: [] }
    prefStore.question_state.user_turn = (prefStore.question_state.user_turn ?? 0) + 1

    const lastAskedKey = prefStore.question_state.last_question_key
    const lastAskedKeyIsDefault = lastAskedKey ? prefStore.profile[lastAskedKey]?.confidence === "default" : false
    const extractedUpdates = extractPreferenceUpdatesFromMessage(userMessage, { lastAskedKey, lastAskedKeyIsDefault })
    const isPreferenceAnswer =
        !!lastAskedKey &&
        extractedUpdates.some((u) => u.key === lastAskedKey && u.confidence === "confirmed")

    // 3. Scope check
    if (!isPreferenceAnswer && isClearlyOutOfScope(userMessage)) {
        return { status: 'ok', response: buildOutOfScopeResponse() }
    }

    if (extractedUpdates.length > 0) {
        prefStore = applyPreferenceUpdates(prefStore, extractedUpdates, timestamp).store
    }

    // 4. Maybe ask one preference question (rate-limited to 1 per 10 turns)
    const minTurnsBetweenQuestions = 10
    let preferenceQuestion: ReturnType<typeof buildSingleChoiceQuestion> | null = null
    const turnsSinceLastQuestion =
        (prefStore.question_state?.user_turn ?? 0) - (prefStore.question_state?.last_question_turn ?? -9999)

    if (
        turnsSinceLastQuestion >= minTurnsBetweenQuestions &&
        isGearTripTrailTopic(userMessage) &&
        isAdviceRequestThatDependsOnPreferences(userMessage)
    ) {
        const key = pickHighImpactMissingPreference(prefStore)
        if (key && prefStore.question_state) {
            preferenceQuestion = buildSingleChoiceQuestion(key)
            prefStore.question_state.last_question_turn = prefStore.question_state.user_turn ?? 0
            prefStore.question_state.last_question_key = key
            prefStore.question_state.asked_keys = [...(prefStore.question_state.asked_keys ?? []), key]
        }
    }

    // 5. Persist updated preference store
    await prisma.user.update({
        where: { id: userId },
        data: { preferences: prefStore as object }
    })

    // 6. Build and send message with context injection
    const today = new Date().toDateString()
    const userPreferences = JSON.stringify(prefStore.profile)
    const preferenceQuestionDirective = preferenceQuestion
        ? ` Ask EXACTLY ONE single-choice preference question before anything else: ${preferenceQuestion.question} The user must answer with exactly one of the listed values.`
        : ""
    const contextMessage = `[Current Context: Today is ${today}. User Location: ${dbUser?.location ?? "Unknown"}. User Preferences (stable profile): ${userPreferences}.${preferenceQuestionDirective}] ${userMessage}`

    const run = await addMessage(threadId, 'user', contextMessage) as BackboardRun

    // 7. Poll for completion and handle tool calls
    await pollRun(threadId, run, userId)

    // 8. Get and parse response
    const responseText = await getLatestResponse(threadId)
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/)
    let structuredData: Record<string, unknown> | null = null

    if (!jsonMatch) {
        try {
            if (responseText.trim().startsWith('{') && responseText.trim().endsWith('}')) {
                structuredData = JSON.parse(responseText.trim())
            }
        } catch { }
    } else {
        try { structuredData = JSON.parse(jsonMatch[1]) } catch { }
    }

    if (structuredData?.type === 'trail_options' || structuredData?.type === 'gear_analysis') {
        return {
            status: 'ok',
            response: {
                role: 'assistant',
                message: (structuredData.message as string) ?? "Here is what I found:",
                isJSON: true,
                data: structuredData,
                quickActions: (structuredData.quick_actions as Array<{ label: string; value: string }>) ?? []
            }
        }
    }

    return { status: 'ok', response: { role: 'assistant', message: responseText, isJSON: false } }
}

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

export async function getChatHistory(userId: string): Promise<ChatResponse[]> {
    const dbUser = await prisma.user.findUnique({ where: { id: userId } })
    const threadId = dbUser?.backboardThreadId

    if (!threadId) return []

    const messages = await getThreadHistory(threadId) as BackboardMessage[]

    return messages
        .filter((msg) => !isToolOutputMessage(msg))
        .map(mapToUIFormat)
}
