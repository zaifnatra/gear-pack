import { syncAuthUser } from '@/lib/services/users'
import { getApiUser } from '@/lib/supabase/api'
import { getClientIp, respond, tooManyRequests, unauthorized, badRequest } from '@/lib/api/respond'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const SyncSchema = z.object({
    // Optional overrides for first-time creation: the native sign-up form's
    // chosen username, or the name from an Apple credential (Apple only
    // provides it client-side, on the first authorization).
    username: z.string().min(3).max(25).regex(/^[a-zA-Z0-9_]+$/).optional(),
    fullName: z.string().min(1).max(50).optional(),
})

/**
 * Idempotent post-sign-in provisioning for native clients.
 *
 * Native OAuth (Google/Apple via signInWithIdToken) never touches the web's
 * /auth/callback route, which is where the Prisma User row is created for
 * web logins — the app must call this once after every successful sign-in.
 */
export async function POST(request: Request) {
    const { allowed } = checkRateLimit(`api:sync:${getClientIp(request)}`, 20, 15 * 60 * 1000)
    if (!allowed) return tooManyRequests()

    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    let body: unknown = {}
    try {
        body = await request.json()
    } catch {
        // Empty body is fine — all fields are optional
    }

    const parsed = SyncSchema.safeParse(body ?? {})
    if (!parsed.success) {
        return badRequest('Invalid request', parsed.error.issues.map(
            (issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`
        ))
    }

    const metadata = auth.user.user_metadata ?? {}

    const result = await syncAuthUser({
        userId: auth.user.id,
        email: auth.user.email,
        fullName: parsed.data.fullName ?? metadata.full_name ?? metadata.name ?? null,
        avatarUrl: metadata.avatar_url ?? metadata.picture ?? null,
        accessToken: auth.accessToken,
        username: parsed.data.username ?? null,
    })

    return respond(result)
}
