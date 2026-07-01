import { clearSessionState } from '@/lib/services/auth'
import { getApiUser } from '@/lib/supabase/api'
import { respond, unauthorized } from '@/lib/api/respond'

/**
 * Server-side part of native logout: clears the user's AI thread, matching
 * the web signOut action. The app revokes its own tokens afterwards via
 * supabase.auth.signOut().
 */
export async function POST(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    return respond(await clearSessionState(auth.user.id))
}
