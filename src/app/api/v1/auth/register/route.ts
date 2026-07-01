import { register } from '@/lib/services/auth'
import { getClientIp, parseBody, respond, tooManyRequests } from '@/lib/api/respond'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const RegisterSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(25).regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers and underscores'),
    password: z.string().min(6),
    fullName: z.string().min(1).max(50),
})

export async function POST(request: Request) {
    const { allowed } = checkRateLimit(`api:register:${getClientIp(request)}`, 5, 15 * 60 * 1000)
    if (!allowed) return tooManyRequests('Too many registration attempts. Please try again later.')

    const parsed = await parseBody(request, RegisterSchema)
    if (parsed.response) return parsed.response

    return respond(await register(parsed.data))
}
