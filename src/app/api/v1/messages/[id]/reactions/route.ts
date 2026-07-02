import { canAccessMessage, reactToMessage } from '@/lib/services/messages'
import { getApiUser } from '@/lib/supabase/api'
import { forbidden, parseBody, respond, unauthorized } from '@/lib/api/respond'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const ReactSchema = z.object({
    emoji: z.string().min(1).max(16),
})

export async function POST(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    if (!await canAccessMessage(id, auth.user.id)) {
        return forbidden('You are not part of this conversation')
    }

    const parsed = await parseBody(request, ReactSchema)
    if (parsed.response) return parsed.response

    return respond(await reactToMessage(id, auth.user.id, parsed.data.emoji))
}
