import { markAsRead } from '@/lib/services/notifications'
import { getApiUser } from '@/lib/supabase/api'
import { respond, unauthorized } from '@/lib/api/respond'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    // Scoped to the authenticated user: only the owner can mark it read
    return respond(await markAsRead(id, auth.user.id))
}
