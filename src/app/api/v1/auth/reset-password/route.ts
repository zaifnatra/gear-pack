import { requestPasswordReset } from '@/lib/services/auth'
import { getClientIp, parseBody, respond, tooManyRequests } from '@/lib/api/respond'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const ResetSchema = z.object({
    email: z.string().email(),
})

export async function POST(request: Request) {
    const { allowed } = checkRateLimit(`api:reset:${getClientIp(request)}`, 5, 15 * 60 * 1000)
    if (!allowed) return tooManyRequests('Too many reset attempts. Please try again later.')

    const parsed = await parseBody(request, ResetSchema)
    if (parsed.response) return parsed.response

    return respond(await requestPasswordReset(parsed.data.email))
}
