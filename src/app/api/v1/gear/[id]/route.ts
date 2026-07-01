import { deleteGearItem, updateGearItem } from '@/lib/services/gear'
import { getApiUser } from '@/lib/supabase/api'
import { parseBody, respond, unauthorized } from '@/lib/api/respond'
import { GearSchema } from '@/lib/api/schemas'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    const parsed = await parseBody(request, GearSchema)
    if (parsed.response) return parsed.response

    return respond(await updateGearItem(id, auth.user.id, parsed.data))
}

export async function DELETE(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    return respond(await deleteGearItem(id, auth.user.id))
}
