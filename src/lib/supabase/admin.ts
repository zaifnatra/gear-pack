import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client for privileged server-side operations
 * (currently: deleting the Supabase auth user on account deletion).
 *
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured so callers
 * can degrade gracefully in environments without the key. Never expose this
 * client or the key to the browser or the mobile app.
 */
export function createAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) return null

    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}
