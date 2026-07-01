import { getUnreadMessageCount } from '@/lib/services/messages'
import { getApiUser } from '@/lib/supabase/api'
import { respond, unauthorized } from '@/lib/api/respond'

export async function GET(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    return respond(await getUnreadMessageCount(auth.user.id))
}
