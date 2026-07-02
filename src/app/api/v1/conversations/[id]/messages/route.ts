import { getMessages, isConversationParticipant, sendMessage } from '@/lib/services/messages'
import { getApiUser } from '@/lib/supabase/api'
import { forbidden, parseBody, respond, unauthorized } from '@/lib/api/respond'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const SendSchema = z.object({
    content: z.string().min(1).max(4000),
    replyToId: z.string().optional(),
})

export async function GET(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    if (!await isConversationParticipant(id, auth.user.id)) {
        return forbidden('You are not part of this conversation')
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') ?? undefined
    const limitParam = Number(searchParams.get('limit'))
    const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100 ? limitParam : 30

    return respond(await getMessages(id, cursor, limit))
}

export async function POST(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    if (!await isConversationParticipant(id, auth.user.id)) {
        return forbidden('You are not part of this conversation')
    }

    const parsed = await parseBody(request, SendSchema)
    if (parsed.response) return parsed.response

    return respond(await sendMessage(id, auth.user.id, parsed.data.content, parsed.data.replyToId))
}
