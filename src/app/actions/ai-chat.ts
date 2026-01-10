'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import {
    createThread,
    addMessage,
    getAssistantId,
    backboardFetch,
    submitToolOutputs,
    getLatestResponse,
    getThreadHistory
} from '@/lib/backboard'
import {
    addGearToTrip,
    createTrip,
    geocodeLocation,
    getUserGear,
    getUserProfile,
    getWeatherForecast,
    updateUserPreferences
} from '@/lib/ai/tools'
import {
    applyPreferenceUpdates,
    buildSingleChoiceQuestion,
    extractPreferenceUpdatesFromMessage,
    isAdviceRequestThatDependsOnPreferences,
    isGearTripTrailTopic,
    normalizePreferenceStore,
    pickHighImpactMissingPreference
} from '@/lib/ai/preferences'

export async function getChatHistory(): Promise<ChatResponse[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    const threadId = (dbUser as any)?.backboardThreadId

    if (!threadId) return []

    const messages = await getThreadHistory(threadId)

    // Map Backboard messages to our UI format
    return messages
        .filter((msg: any) => {
            // Filter 1: Strictly User or Assistant
            if (msg.role !== 'user' && msg.role !== 'assistant') return false

            // Filter 2: Hide Tool Outputs (even if they mimic User role)
            // Heuristic: check for raw JSON (braces/brackets at start/end) OR specific keys
            if (msg.content && typeof msg.content === 'string') {
                const trimmed = msg.content.trim()

                // Explicit tool indicators
                if (trimmed.includes('"tool_call_id"') || trimmed.includes('"success":true')) return false

                // Raw JSON objects or arrays (likely tool outputs echoed back)
                // e.g. {"id":...} or [{"id":...}]
                if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                    // EXCEPTION: If it is our "Type": "trail_options" UI JSON, we WANT it.
                    // But usually UI JSON is wrapped in md block ```json ... ``` by our prompt.
                    // If it's raw JSON, it's likely a tool output.

                    // Double check: Does it have "options" or "gear_analysis"?
                    if (trimmed.includes('"type": "trail_options"') || trimmed.includes('"type": "gear_analysis"') || trimmed.includes('"type":"trail_options"')) {
                        return true // Keep UI Cards
                    }

                    return false // Hide other raw JSON (like profile/gear dumps)
                }
            }
            return true
        })
        .map((msg: any) => {
            let content = Array.isArray(msg.content)
                ? msg.content.map((c: any) => c.text?.value || '').join('\n')
                : msg.content || ""

            // Clean Context Injection
            // Remove [Current Context: ...] from start
            content = content.replace(/^\[Current Context:.*?\]\s*/, '')

            // Try to parse JSON for UI cards
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
            let structuredData = null

            if (jsonMatch) {
                try { structuredData = JSON.parse(jsonMatch[1]) } catch { }
            }

            return {
                role: msg.role, // 'user' or 'assistant'
                message: structuredData?.message || content,
                isJSON: !!structuredData,
                data: structuredData,
                quickActions: structuredData?.quick_actions || []
            }
        })
}

// System Prompt with recent requirements
const SYSTEM_PROMPT = `
You are PackBot, an expert hiking guide and logistics assistant.
Your goal is to help users plan outdoor trips and pack the right gear.

CAPABILITIES:
1. Search the web for trails (Backboard native).
2. Create Trips in the database (create_trip tool).
3. Check User's Gear Closet (get_user_gear tool).
4. Add items to a trip (add_gear_to_trip tool).

RULES:
- When asked for trail options, search the web and return 3-5 options. 
- FORMAT "Trail Options" as a JSON object inside a code block or purely as JSON validation if possible, but for now use this structure in your text response:
  
  \`\`\`json
  {
    "type": "trail_options",
    "options": [
      {
        "id": "trail_1",
        "name": "Trail Name",
        "location": "Location",
        "driveTime": "45 min",
        "distance": 6.0,
        "elevationGain": 400,
        "difficulty": "MODERATE",
        "description": "Short summary",
        "externalUrl": "..."
      }
    ]
  }
  \`\`\`

- DO NOT auto-create a trip unless the user explicitly confirms a specific trail and date.
- Always check the user's actual gear before recommending a packing list.
- Be conversational and safety-focused.
`

export interface ChatResponse {
    message: string
    isJSON: boolean
    data?: any
    quickActions?: any[]
    role?: string
}

function buildOutOfScopeResponse(): ChatResponse {
    return {
        role: 'assistant',
        isJSON: false,
        message:
            "I’m PackBot — I can only help with hiking/trail planning, trip logistics, and gear packing. Ask me about a hike you want to do, your trip dates/location, or what gear you have.",
        quickActions: [
            { label: "Find a hike nearby", value: "Find a hike nearby" },
            { label: "Plan a weekend trip", value: "Plan a weekend trip" },
            { label: "Analyze my gear closet", value: "Analyze my gear closet" }
        ]
    }
}

function isInScopeMessage(message: string) {
    // Allow only outdoor/trip/gear related requests. Everything else gets a gentle refusal.
    return isGearTripTrailTopic(message)
}

export async function sendAIMessage(userMessage: string): Promise<ChatResponse> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    if (!isInScopeMessage(userMessage)) {
        return buildOutOfScopeResponse()
    }

    // 1. Get or Create Thread
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    let threadId = (dbUser as any)?.backboardThreadId
    let isNewThread = false

    if (!threadId) {
        threadId = await createThread()
        if (!threadId) throw new Error("Failed to create AI thread")

        await prisma.user.update({
            where: { id: user.id },
            data: { backboardThreadId: threadId }
        })
        isNewThread = true
    }

    // 1b. Load/normalize preferences, increment turn, and extract implicit/explicit preferences from this message.
    const timestamp = new Date().toISOString()
    const { store: prefStoreInitial } = normalizePreferenceStore((dbUser as any)?.preferences, timestamp)
    let prefStore = prefStoreInitial

    // Reset question state if we are on a new Backboard thread
    if (prefStore.question_state?.thread_id !== threadId) {
        prefStore.question_state = { thread_id: threadId, user_turn: 0, last_question_turn: -9999, asked_keys: [] }
    }

    prefStore.question_state = prefStore.question_state || { thread_id: threadId, user_turn: 0, last_question_turn: -9999, asked_keys: [] }
    prefStore.question_state.user_turn = (prefStore.question_state.user_turn || 0) + 1

    const lastAskedKey = prefStore.question_state.last_question_key
    const lastAskedKeyIsDefault = lastAskedKey ? prefStore.profile[lastAskedKey]?.confidence === "default" : false
    const extractedUpdates = extractPreferenceUpdatesFromMessage(userMessage, { lastAskedKey, lastAskedKeyIsDefault })

    if (extractedUpdates.length > 0) {
        prefStore = applyPreferenceUpdates(prefStore, extractedUpdates, timestamp).store
    }

    // 1c. Decide whether to ask ONE casual preference question (rate-limited).
    const minTurnsBetweenQuestions = 10
    let preferenceQuestion: ReturnType<typeof buildSingleChoiceQuestion> | null = null
    const turnsSinceLastQuestion =
        (prefStore.question_state.user_turn || 0) - (prefStore.question_state.last_question_turn || -9999)

    if (
        turnsSinceLastQuestion >= minTurnsBetweenQuestions &&
        isGearTripTrailTopic(userMessage) &&
        isAdviceRequestThatDependsOnPreferences(userMessage)
    ) {
        const key = pickHighImpactMissingPreference(prefStore)
        if (key) {
            preferenceQuestion = buildSingleChoiceQuestion(key)
            prefStore.question_state.last_question_turn = prefStore.question_state.user_turn || 0
            prefStore.question_state.last_question_key = key
            prefStore.question_state.asked_keys = [...(prefStore.question_state.asked_keys || []), key]
        }
    }

    // Persist updated preference store (defaults + extracted prefs + question state/turns)
    await prisma.user.update({
        where: { id: user.id },
        data: { preferences: prefStore }
    })

    // 2. Add Message and Trigger Run
    const today = new Date().toDateString()
    const userPreferences = JSON.stringify(prefStore.profile)
    const preferenceQuestionDirective = preferenceQuestion
        ? ` Ask EXACTLY ONE single-choice preference question before anything else: ${preferenceQuestion.question} The user must answer with exactly one of the listed values.`
        : ""
    const contextMessage = `[Current Context: Today is ${today}. User Location: ${dbUser?.location || "Unknown"}. User Preferences (stable profile): ${userPreferences}.${preferenceQuestionDirective}] ${userMessage}`

    const run = await addMessage(threadId, 'user', contextMessage)

    // 3. Poll for Completion / Tool Calls
    let runStatus = await pollRun(threadId, run, user.id)

    // 4. Get Response
    const responseText = await getLatestResponse(threadId)

    // 5. Parse Structured UI JSON
    // We look for strict JSON blocks
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/)
    let structuredData = null

    // Try parsing loose JSON if regex match fails but text looks like JSON
    if (!jsonMatch) {
        try {
            // Only if starts/ends with braces
            if (responseText.trim().startsWith('{') && responseText.trim().endsWith('}')) {
                structuredData = JSON.parse(responseText.trim())
            }
        } catch { }
    } else {
        try {
            structuredData = JSON.parse(jsonMatch[1])
        } catch { }
    }

    if (structuredData) {
        // If the AI returns a "type", we treat it as a structured UI response
        if (structuredData.type === 'trail_options' || structuredData.type === 'gear_analysis') {
            return {
                role: 'assistant',
                message: structuredData.message || "Here is what I found:",
                isJSON: true,
                data: structuredData,
                quickActions: structuredData.quick_actions || []
            }
        }
    }

    // Fallback: If plain text, maybe we want to extract quick actions?
    // For now, let's keep it simple. If plain text, strict structure is likely missing.
    // However, we can heuristically suggest actions if we want, but better to let AI do it.

    return {
        role: 'assistant',
        message: responseText,
        isJSON: false,
        // Default quick actions if none provided? Nah, let AI decide.
    }
}

async function pollRun(threadId: string, initialRun: any, userId: string) {
    let run = initialRun
    let loops = 0
    const maxLoops = 10 // Safety break, though we expect synchronous-ish responses

    while (loops < maxLoops) {
        const status = (run.status || 'queued').toLowerCase()
        console.log(`[AI] Run Status: ${status}`)

        if (status === 'completed') return 'completed'
        if (status === 'failed') throw new Error("AI Run failed")

        if (status === 'requires_action') {
            // Check for tool_calls (Backboard simplified) or required_action (OpenAI standard)
            // Debug logs showed "tool_calls": null at top level, so it's likely a top-level property.
            const toolCalls = run.tool_calls || run.required_action?.submit_tool_outputs?.tool_calls

            if (!toolCalls) {
                console.error("Run requires action but no tool calls found", run)
                throw new Error("AI Protocol Error")
            }

            const toolOutputs = []

            for (const call of toolCalls) {
                // Backboard might parse arguments for us or give string
                let args = call.function.arguments
                if (typeof args === 'string') {
                    try { args = JSON.parse(args) } catch { }
                }

                console.log(`[AI] Calling Tool: ${call.function.name}`)
                let output = ""

                try {
                    if (call.function.name === 'create_trip') {
                        const res = await createTrip(userId, args)
                        output = JSON.stringify(res)
                    } else if (call.function.name === 'get_user_gear') {
                        const res = await getUserGear(userId)
                        // If no gear, say so
                        if (!res || (Array.isArray(res) && res.length === 0)) {
                            output = JSON.stringify({ message: "User has no gear in closet." })
                        } else {
                            output = JSON.stringify(res)
                        }
                    } else if (call.function.name === 'get_user_profile') {
                        const res = await getUserProfile(userId)
                        output = JSON.stringify(res)
                    } else if (call.function.name === 'update_user_preferences') {
                        const res = await updateUserPreferences(userId, args)
                        output = JSON.stringify(res)
                    } else if (call.function.name === 'add_gear_to_trip') {
                        const res = await addGearToTrip(args)
                        output = JSON.stringify(res)
                    } else if (call.function.name === 'geocode_location') {
                        const res = await geocodeLocation(args)
                        output = JSON.stringify(res)
                    } else if (call.function.name === 'get_weather_forecast') {
                        const res = await getWeatherForecast(args)
                        output = JSON.stringify(res)
                    } else {
                        output = JSON.stringify({ error: "Unknown tool" })
                    }
                } catch (e: any) {
                    console.error(`Tool execution failed: ${e.message}`)
                    output = JSON.stringify({ error: e.message })
                }

                toolOutputs.push({
                    tool_call_id: call.id,
                    output: output
                })
            }

            // Submit outputs - this returns the NEXT run state
            run = await submitToolOutputs(threadId, run.run_id || run.id, toolOutputs)
            // Loop continues with new run state
        } else {
            // If queued/in_progress but we can't poll URL, we just have to wait?
            // But previous observation says response is sync. 
            // If we get here with non-terminal status, we might be stuck.
            // Let's assume Backboard always returns settled state or we wait a bit.
            if (status === 'queued' || status === 'in_progress') {
                await new Promise(r => setTimeout(r, 1000))
                // If we can't fetch by ID, and we are stuck in progress, we are kind of blind.
                // But let's hope submitToolOutputs waits.
                // For initial addMessage, we already waited.
                // If we are stuck here, we might need to break.
                console.warn("Got queued/in_progress but cannot poll. Breaking.")
                break;
            }
            loops++
        }
    }

    // If we exit loop without 'completed', it's ambiguous, but let's assume we can read messages.
    return run.status
}
