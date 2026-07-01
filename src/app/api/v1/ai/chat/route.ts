import { sendAIMessage } from '@/lib/services/aiChat'
import { getApiUser } from '@/lib/supabase/api'
import { forbidden, parseBody, tooManyRequests, unauthorized } from '@/lib/api/respond'
import { checkRateLimit } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Backboard runs poll server-side for up to ~30s plus tool-call round trips.
// Matches the envelope the web chat's server action already runs under.
export const maxDuration = 120

const ChatSchema = z.object({
    message: z.string().min(1).max(4000),
})

export async function POST(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { allowed } = checkRateLimit(`api:ai:${auth.user.id}`, 30, 60 * 60 * 1000)
    if (!allowed) return tooManyRequests('You are sending messages too quickly. Please slow down.')

    const parsed = await parseBody(request, ChatSchema)
    if (parsed.response) return parsed.response

    try {
        const result = await sendAIMessage(auth.user.id, parsed.data.message)

        if (result.status === 'not_paid') {
            // Deliberately neutral: no upgrade/purchase language in the app
            // (App Store guideline 3.1.1)
            return forbidden('This feature is not available on your account.')
        }

        return NextResponse.json({ success: true, data: result.response })
    } catch (error) {
        console.error('AI chat failed:', error)
        return NextResponse.json({ success: false, error: 'PackBot is unavailable right now. Please try again.' }, { status: 502 })
    }
}
