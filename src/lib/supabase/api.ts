import { createClient as createSupabaseClient, type User } from '@supabase/supabase-js'

/**
 * Auth helper for /api/v1 route handlers.
 *
 * Native clients (the iOS app) authenticate directly with Supabase and send
 * their access token as `Authorization: Bearer <jwt>` on every API call —
 * there are no auth cookies on this path.
 */
export function getBearerToken(request: Request): string | null {
    const header = request.headers.get('authorization')
    if (!header?.startsWith('Bearer ')) return null
    const token = header.slice('Bearer '.length).trim()
    return token || null
}

export async function getApiUser(
    request: Request
): Promise<{ user: User; accessToken: string } | null> {
    const token = getBearerToken(request)
    if (!token) return null

    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return null

    return { user: data.user, accessToken: token }
}
