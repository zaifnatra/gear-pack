import { getPublicProfile } from '@/lib/services/social'
import { getApiUser } from '@/lib/supabase/api'
import { respond, unauthorized } from '@/lib/api/respond'

type Params = { params: Promise<{ id: string }> }

/**
 * Public profile + friendship state — mirrors the friend-closet page's
 * non-friend preview (name, username, avatar, bio, relationship).
 */
export async function GET(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    return respond(await getPublicProfile(auth.user.id, id))
}
