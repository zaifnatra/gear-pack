import { respondToTripInvite } from '@/lib/services/trips'
import { getApiUser } from '@/lib/supabase/api'
import { parseBody, respond, unauthorized } from '@/lib/api/respond'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const RespondSchema = z.object({
    status: z.enum(['ACCEPTED', 'DECLINED']),
})

export async function POST(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    const parsed = await parseBody(request, RespondSchema)
    if (parsed.response) return parsed.response

    return respond(await respondToTripInvite(id, auth.user.id, parsed.data.status))
}
