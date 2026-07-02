import { getGearItems } from '@/lib/services/gear'
import { areFriends } from '@/lib/services/social'
import { getApiUser } from '@/lib/supabase/api'
import { forbidden, respond, unauthorized } from '@/lib/api/respond'

type Params = { params: Promise<{ id: string }> }

/**
 * Friend closet — same gate as the web page: only accepted friends
 * (or the owner) can view a user's gear.
 */
export async function GET(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    if (!await areFriends(auth.user.id, id)) {
        return forbidden('You must be friends to view this closet')
    }

    return respond(await getGearItems(id))
}
