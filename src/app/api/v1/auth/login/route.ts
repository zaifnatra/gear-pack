import { loginWithPassword } from '@/lib/services/auth'
import { getClientIp, parseBody, respond, tooManyRequests } from '@/lib/api/respond'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const LoginSchema = z.object({
    login: z.string().min(1), // username or email, same as the web sign-in form
    password: z.string().min(1),
})

export async function POST(request: Request) {
    const { allowed } = checkRateLimit(`api:login:${getClientIp(request)}`, 10, 15 * 60 * 1000)
    if (!allowed) return tooManyRequests('Too many login attempts. Please try again later.')

    const parsed = await parseBody(request, LoginSchema)
    if (parsed.response) return parsed.response

    return respond(await loginWithPassword(parsed.data.login, parsed.data.password))
}
