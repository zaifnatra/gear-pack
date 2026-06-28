// src/app/actions/ai-chat/polling.ts

import { submitToolOutputs } from '@/lib/backboard'
import {
    addGearToTrip,
    createTrip,
    getUserGear,
    getUserProfile,
    getWeatherForecast,
    updateUserPreferences
} from '@/lib/ai/tools'
import type { BackboardRun, BackboardToolCall } from './types'

async function executeToolCall(call: BackboardToolCall, userId: string): Promise<string> {
    let args = call.function.arguments
    if (typeof args === 'string') {
        try { args = JSON.parse(args) } catch { }
    }

    console.log(`[AI] Calling Tool: ${call.function.name}`)

    try {
        switch (call.function.name) {
            case 'create_trip':
                return JSON.stringify(await createTrip(userId, args as unknown as Parameters<typeof createTrip>[1]))
            case 'get_user_gear': {
                const res = await getUserGear(userId)
                if (!res || (Array.isArray(res) && res.length === 0)) {
                    return JSON.stringify({ message: "User has no gear in closet." })
                }
                return JSON.stringify(res)
            }
            case 'get_user_profile':
                return JSON.stringify(await getUserProfile(userId))
            case 'update_user_preferences':
                return JSON.stringify(await updateUserPreferences(userId, args as Parameters<typeof updateUserPreferences>[1]))
            case 'add_gear_to_trip':
                return JSON.stringify(await addGearToTrip(args as unknown as Parameters<typeof addGearToTrip>[0]))
            case 'get_weather_forecast':
                return JSON.stringify(await getWeatherForecast(args as Parameters<typeof getWeatherForecast>[0]))
            default:
                return JSON.stringify({ error: "Unknown tool" })
        }
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        console.error(`Tool execution failed: ${message}`)
        return JSON.stringify({ error: message })
    }
}

export async function pollRun(threadId: string, initialRun: BackboardRun, userId: string): Promise<string> {
    let run = initialRun
    let loops = 0
    const maxLoops = 60

    while (loops < maxLoops) {
        const status = (run.status ?? 'queued').toLowerCase()
        console.log(`[AI] Run Status: ${status}`)

        if (status === 'completed') return 'completed'
        if (status === 'failed') throw new Error("AI Run failed")

        if (status === 'requires_action') {
            const toolCalls = run.tool_calls ?? run.required_action?.submit_tool_outputs?.tool_calls

            if (!toolCalls) {
                console.error("Run requires action but no tool calls found", run)
                throw new Error("AI Protocol Error")
            }

            const toolOutputs = await Promise.all(
                toolCalls.map(async (call) => ({
                    tool_call_id: call.id,
                    output: await executeToolCall(call, userId)
                }))
            )

            run = await submitToolOutputs(threadId, run.run_id ?? run.id ?? '', toolOutputs) as BackboardRun
        } else {
            if (status === 'queued' || status === 'in_progress') {
                await new Promise(r => setTimeout(r, 500))
                if (loops === 20) console.warn("AI taking longer than expected...")
            }
            loops++
        }
    }

    return run.status ?? 'unknown'
}
