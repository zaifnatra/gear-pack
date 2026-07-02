import { deleteMessage, editMessage } from '@/lib/services/messages'
import { getApiUser } from '@/lib/supabase/api'
import { parseBody, respond, unauthorized } from '@/lib/api/respond'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const EditSchema = z.object({
    content: z.string().min(1).max(4000),
})

// Sender-only checks live in the service (same as the web actions)

export async function PATCH(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    const parsed = await parseBody(request, EditSchema)
    if (parsed.response) return parsed.response

    return respond(await editMessage(id, auth.user.id, parsed.data.content))
}

export async function DELETE(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    return respond(await deleteMessage(id, auth.user.id))
}
