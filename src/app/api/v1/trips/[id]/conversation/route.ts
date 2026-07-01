import { getOrCreateTripConversation } from '@/lib/services/messages'
import { isTripParticipant } from '@/lib/services/trips'
import { getApiUser } from '@/lib/supabase/api'
import { forbidden, respond, unauthorized } from '@/lib/api/respond'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    // Creating the conversation adds the caller to it, so participants only
    if (!await isTripParticipant(id, auth.user.id)) {
        return forbidden('Only trip participants can open the trip chat')
    }

    return respond(await getOrCreateTripConversation(id, auth.user.id))
}
