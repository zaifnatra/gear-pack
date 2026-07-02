import { updateTripImage } from '@/lib/services/trips'
import { getApiUser } from '@/lib/supabase/api'
import { parseBody, respond, unauthorized } from '@/lib/api/respond'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const ImageSchema = z.object({
    imageUrl: z.string().url(),
})

export async function PATCH(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    const parsed = await parseBody(request, ImageSchema)
    if (parsed.response) return parsed.response

    return respond(await updateTripImage(id, parsed.data.imageUrl, auth.user.id))
}
