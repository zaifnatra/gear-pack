import { archiveConversation } from '@/lib/services/messages'
import { getApiUser } from '@/lib/supabase/api'
import { respond, unauthorized } from '@/lib/api/respond'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    return respond(await archiveConversation(id, auth.user.id))
}
