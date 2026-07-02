import { inviteUserToTrip } from '@/lib/services/trips'
import { getApiUser } from '@/lib/supabase/api'
import { parseBody, respond, unauthorized } from '@/lib/api/respond'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const InviteSchema = z.object({
    friendId: z.string().min(1),
})

export async function POST(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    const parsed = await parseBody(request, InviteSchema)
    if (parsed.response) return parsed.response

    return respond(await inviteUserToTrip(id, parsed.data.friendId, auth.user.id))
}
