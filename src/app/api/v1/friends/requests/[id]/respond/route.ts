import { isFriendRequestRecipient, respondToFriendRequest } from '@/lib/services/social'
import { getApiUser } from '@/lib/supabase/api'
import { forbidden, parseBody, respond, unauthorized } from '@/lib/api/respond'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const RespondSchema = z.object({
    status: z.enum(['ACCEPTED', 'DECLINED']),
})

export async function POST(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    // Only the recipient of a request may accept or decline it
    if (!await isFriendRequestRecipient(id, auth.user.id)) {
        return forbidden('Only the request recipient can respond')
    }

    const parsed = await parseBody(request, RespondSchema)
    if (parsed.response) return parsed.response

    return respond(await respondToFriendRequest(id, parsed.data.status))
}
