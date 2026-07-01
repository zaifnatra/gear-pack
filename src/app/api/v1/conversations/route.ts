import { createConversation, getConversations } from '@/lib/services/messages'
import { getApiUser } from '@/lib/supabase/api'
import { parseBody, respond, unauthorized } from '@/lib/api/respond'
import { z } from 'zod'

const CreateSchema = z.object({
    participantIds: z.array(z.string().min(1)).min(1).max(50),
    name: z.string().min(1).max(100).optional(),
})

export async function GET(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    return respond(await getConversations(auth.user.id))
}

export async function POST(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const parsed = await parseBody(request, CreateSchema)
    if (parsed.response) return parsed.response

    return respond(await createConversation(auth.user.id, parsed.data.participantIds, parsed.data.name))
}
