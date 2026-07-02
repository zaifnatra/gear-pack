import { getPendingRequests, sendFriendRequest } from '@/lib/services/social'
import { getApiUser } from '@/lib/supabase/api'
import { badRequest, parseBody, respond, unauthorized } from '@/lib/api/respond'
import { z } from 'zod'

const RequestSchema = z.object({
    receiverId: z.string().min(1),
})

export async function GET(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    return respond(await getPendingRequests(auth.user.id))
}

export async function POST(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const parsed = await parseBody(request, RequestSchema)
    if (parsed.response) return parsed.response

    if (parsed.data.receiverId === auth.user.id) {
        return badRequest('You cannot send a friend request to yourself')
    }

    return respond(await sendFriendRequest(auth.user.id, parsed.data.receiverId))
}
