import { markAllAsRead } from '@/lib/services/notifications'
import { getApiUser } from '@/lib/supabase/api'
import { respond, unauthorized } from '@/lib/api/respond'

export async function POST(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    return respond(await markAllAsRead(auth.user.id))
}
