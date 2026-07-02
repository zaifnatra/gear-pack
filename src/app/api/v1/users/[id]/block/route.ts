import { blockUser, unblockUser } from '@/lib/services/moderation'
import { getApiUser } from '@/lib/supabase/api'
import { respond, unauthorized } from '@/lib/api/respond'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    return respond(await blockUser(auth.user.id, id))
}

export async function DELETE(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    return respond(await unblockUser(auth.user.id, id))
}
